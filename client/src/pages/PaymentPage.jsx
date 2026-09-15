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
    <div className="mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-4xl flex-col px-3 pb-8 pt-20 sm:px-8 sm:pt-24">
      <div className="mb-5 flex w-full items-center justify-between gap-3 sm:mb-8">
        <button
          onClick={() => {
            if (step > 1 && step < 3) {
              setStep(step - 1);
            } else {
              navigate("/");
            }
          }}
          className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container p-2 font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container-high sm:px-4"
          aria-label={step > 1 && step < 3 ? 'חזרה לשלב הקודם' : 'חזרה לדף הבית'}
        >
          <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }} aria-hidden="true">arrow_back</span>
          <span className="hidden sm:inline">{step > 1 && step < 3 ? 'חזור' : 'חזרה לדף הבית'}</span>
        </button>
        <h1 className="flex min-w-0 flex-grow items-center justify-center gap-2 text-center text-2xl font-black text-primary sm:gap-3 sm:text-3xl">
          <span className="material-symbols-outlined text-3xl sm:text-4xl" aria-hidden="true">payments</span>
          תשלום לחניון
        </h1>
        <div className="w-11 shrink-0 sm:w-[140px]" aria-hidden="true"></div>
      </div>

      <div className="relative min-h-[400px] overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg sm:rounded-3xl">
        {/* Progress Bar */}
        {step < 3 && (
          <div className="w-full bg-surface-container-high h-1.5 flex flex-row-reverse">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-out" 
              style={{ width: step === 1 ? '50%' : '100%' }}
            ></div>
          </div>
        )}

        <div className="p-4 sm:p-10">
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
