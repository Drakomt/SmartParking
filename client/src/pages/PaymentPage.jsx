import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LicensePlateSearch from "../components/payment/LicensePlateSearch";
import InvoiceSummary from "../components/payment/InvoiceSummary";
import PaymentResult from "../components/payment/PaymentResult";
import NoPaymentRequired from "../components/payment/NoPaymentRequired";
import api from "../lib/api";

const EXIT_GRACE_PERIOD_MS = 15 * 60 * 1000;

const normalizePlate = (value) => String(value ?? "").replace(/[^A-Z0-9]/gi, "").toUpperCase();

const getBackendGraceExpiry = (data) => {
  if (data?.graceExpiresAt && Number.isFinite(new Date(data.graceExpiresAt).getTime())) {
    return new Date(data.graceExpiresAt).toISOString();
  }
  if (Number.isFinite(Number(data?.remainingGraceSeconds))) {
    return new Date(Date.now() + Number(data.remainingGraceSeconds) * 1000).toISOString();
  }
  if (data?.paidAt && Number.isFinite(new Date(data.paidAt).getTime())) {
    return new Date(new Date(data.paidAt).getTime() + EXIT_GRACE_PERIOD_MS).toISOString();
  }
  return null;
};

export default function PaymentPage() {
  const navigate = useNavigate();
  // State to track current step: 1 = search, 2 = invoice, 3 = result
  const [step, setStep] = useState(1);
  const [licensePlate, setLicensePlate] = useState("");
  const [sessionData, setSessionData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' or 'error'
  const [graceExpiresAt, setGraceExpiresAt] = useState(null);
  const [graceLicensePlate, setGraceLicensePlate] = useState("");

  const handleSearchSubmit = (plateNumber, data) => {
    setLicensePlate(plateNumber);
    setSessionData(data);

    if (data?.paymentRequired === false) {
      const backendExpiry = getBackendGraceExpiry(data);
      const knownExpiry = normalizePlate(plateNumber) === normalizePlate(graceLicensePlate)
        ? graceExpiresAt
        : null;
      setGraceExpiresAt(backendExpiry || knownExpiry);
      setGraceLicensePlate(plateNumber);
      setStep(4);
      return;
    }

    setStep(2); // Proceed to invoice
  };

  const handlePaymentComplete = (status, paymentData) => {
    setPaymentStatus(status);
    if (status === "success") {
      setGraceExpiresAt(
        getBackendGraceExpiry(paymentData)
        || new Date(Date.now() + EXIT_GRACE_PERIOD_MS).toISOString(),
      );
      setGraceLicensePlate(licensePlate);
    }
    setStep(3); // Proceed to result
  };

  const handleGraceExpired = async () => {
    setGraceExpiresAt(null);
    try {
      const response = await api.get("/api/parking/session/lookup", {
        params: { plate: licensePlate },
      });
      setSessionData(response.data);
      if (response.data?.paymentRequired) {
        setStep(2);
      } else {
        setStep(4);
      }
    } catch (error) {
      console.error("Failed to refresh parking debt after grace period", error);
      setStep(1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setLicensePlate("");
    setPaymentStatus(null);
  };

  const handleRetry = () => {
    setPaymentStatus(null);
    setStep(2); // Go back to invoice step
  };

  return (
    <div className="pt-24 pb-8 px-4 sm:px-8 max-w-4xl mx-auto w-full flex flex-col min-h-[calc(100vh-100px)]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 w-full">
        <button
          onClick={() => {
            if (step > 1 && step < 3) {
              setStep(step - 1);
            } else {
              navigate("/");
            }
          }}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface flex items-center gap-2 cursor-pointer font-medium border border-outline-variant/30 shadow-sm"
        >
          {step > 1 && step < 3 ? 'חזור' : 'חזרה לדף הבית'}
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-primary flex items-center justify-center gap-3 flex-grow text-center">
          <span className="material-symbols-outlined text-3xl sm:text-4xl">payments</span>
          תשלום לחניון
        </h1>
        <div className="hidden sm:block w-[140px]"></div> {/* Spacer for perfect centering */}
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-lg border border-outline-variant/30 overflow-hidden relative min-h-[400px]">
        {/* Progress Bar */}
        {step < 3 && (
          <div className="w-full bg-surface-container-high h-1.5 flex flex-row-reverse">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-out" 
              style={{ width: step === 1 ? '50%' : '100%' }}
            ></div>
          </div>
        )}

        <div className="p-6 sm:p-10">
          {step === 1 && (
            <LicensePlateSearch onSearch={handleSearchSubmit} />
          )}
          {step === 2 && (
            <InvoiceSummary 
              licensePlate={licensePlate} 
              sessionData={sessionData}
              onPay={handlePaymentComplete} 
            />
          )}
          {step === 3 && (
            <PaymentResult 
              status={paymentStatus} 
              sessionData={sessionData}
              graceExpiresAt={graceExpiresAt}
              onGraceExpired={handleGraceExpired}
              onReset={handleReset} 
              onRetry={handleRetry}
            />
          )}
          {step === 4 && (
            <NoPaymentRequired
              sessionData={sessionData}
              expiresAt={graceExpiresAt}
              onExpired={handleGraceExpired}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
