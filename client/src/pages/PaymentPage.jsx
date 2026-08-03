import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LicensePlateSearch from "../components/payment/LicensePlateSearch";
import InvoiceSummary from "../components/payment/InvoiceSummary";
import PaymentResult from "../components/payment/PaymentResult";

export default function PaymentPage() {
  const navigate = useNavigate();
  // State to track current step: 1 = search, 2 = invoice, 3 = result
  const [step, setStep] = useState(1);
  const [licensePlate, setLicensePlate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' or 'error'

  const handleSearchSubmit = (plateNumber) => {
    setLicensePlate(plateNumber);
    setStep(2); // Proceed to invoice
  };

  const handlePaymentComplete = (status) => {
    setPaymentStatus(status);
    setStep(3); // Proceed to result
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
      <div className="flex flex-col items-center gap-4 mb-8">
        <button
          onClick={() => {
            if (step > 1 && step < 3) {
              setStep(step - 1);
            } else {
              navigate("/");
            }
          }}
          className="absolute top-20 right-4 sm:right-8 z-40 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface flex items-center gap-2 cursor-pointer font-medium border border-outline-variant/30 shadow-sm"
        >
          {step > 1 && step < 3 ? 'חזור לשלב הקודם' : 'חזרה לדף הבית'}
        </button>
        <h1 className="text-3xl font-black text-primary flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl">payments</span>
          תשלום לחניון
        </h1>
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
              onPay={handlePaymentComplete} 
            />
          )}
          {step === 3 && (
            <PaymentResult 
              status={paymentStatus} 
              onReset={handleReset} 
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
}
