import React, { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";

export default function InvoiceSummary({ licensePlate, onPay }) {
  const [error, setError] = useState(null);

  // Static placeholders since we are not using backend data or mock data yet.
  const parkingLotName = "חניון ממתין לנתונים...";
  const entryTime = "--:--";
  const duration = "- שעות";
  const amountToPay = "0";

  const mockCheckoutId = "1234567890abcdef1234567890abcdef";
  const mockCheckoutToken = "abcdef1234567890abcdef1234567890abcdef12345";

  const paypalOptions = {
    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
    currency: "ILS",
    intent: "capture",
    "disable-funding": "card,paylater",
  };

  const createOrder = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/paypal/orders`, {
        checkoutId: mockCheckoutId,
        checkoutToken: mockCheckoutToken,
      });
      return response.data.orderId;
    } catch (err) {
      console.error("Failed to create order:", err);
      // Fallback for UI testing if backend isn't ready
      // return "mock_order_id";
      throw err;
    }
  };

  const onApprove = async (data) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/paypal/orders/${data.orderID}/capture`, {
        checkoutId: mockCheckoutId,
        checkoutToken: mockCheckoutToken,
      });
      
      if (response.data.status === 'COMPLETED' || response.data.status === 'APPROVED') {
        onPay('success');
      } else {
        onPay('error');
      }
    } catch (err) {
      console.error("Failed to capture order:", err);
      onPay('error');
    }
  };

  const onPayPalError = (err) => {
    console.error("PayPal error:", err);
    onPay('error');
  };

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in-up max-w-md mx-auto py-4">
      <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-on-secondary-container">receipt_long</span>
      </div>
      
      <h2 className="text-2xl font-bold text-on-surface mb-6 text-center">סיכום תשלום</h2>
      
      <div className="w-full bg-surface border border-outline-variant/30 rounded-2xl p-6 shadow-sm mb-8 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
          <span className="text-on-surface-variant font-medium">לוחית רישוי:</span>
          <span className="font-bold text-xl text-primary tracking-wider px-3 py-1 bg-primary/10 rounded-lg" dir="ltr">
            {licensePlate}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-on-surface-variant font-medium">חניון:</span>
          <span className="font-bold text-on-surface text-left">{parkingLotName}</span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-on-surface-variant font-medium">שעת כניסה:</span>
          <span className="font-bold text-on-surface">{entryTime}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-outline-variant/20 pb-4">
          <span className="text-on-surface-variant font-medium">זמן חניה:</span>
          <span className="font-bold text-on-surface">{duration}</span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-on-surface-variant font-bold text-lg">סך הכל לתשלום:</span>
          <span className="font-black text-3xl text-primary">{amountToPay} ₪</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 relative z-0">
        <PayPalScriptProvider options={paypalOptions}>
          <PayPalButtons 
            style={{ layout: "vertical", shape: "rect", color: "blue" }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onPayPalError}
          />
        </PayPalScriptProvider>

        {/* Temporary buttons for testing the UI flow while backend is incomplete */}
        <div className="mt-4 pt-4 border-t border-outline-variant/30">
          <p className="text-xs text-center text-on-surface-variant mb-2">כפתורי בדיקה זמניים:</p>
          <button
            onClick={() => onPay('success')}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-2 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mb-2"
          >
            <span className="material-symbols-outlined text-sm">credit_score</span>
            מעבר אוטומטי להצלחה
          </button>
          
          <button
            onClick={() => onPay('error')}
            className="w-full bg-surface-container-high hover:bg-error/10 text-error font-bold py-2 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-error/30"
          >
            <span className="material-symbols-outlined text-sm">error</span>
            מעבר אוטומטי לשגיאה
          </button>
        </div>
      </div>
    </div>
  );
}
