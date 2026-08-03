import React from "react";

export default function InvoiceSummary({ licensePlate, onPay }) {
  // Static placeholders since we are not using backend data or mock data yet.
  const parkingLotName = "חניון ממתין לנתונים...";
  const entryTime = "--:--";
  const duration = "- שעות";
  const amountToPay = "0";

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

      <div className="w-full flex flex-col gap-3">
        {/* PayPal Placeholder */}
        <div className="w-full bg-[#003087]/5 border-2 border-[#003087]/20 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 mb-2">
          <i className="fa-brands fa-paypal text-2xl text-[#003087]"></i>
          <span className="text-sm font-medium text-[#003087] text-center">
            כפתור PayPal Developer ישולב כאן בעתיד
          </span>
        </div>

        <button
          onClick={() => onPay('success')}
          className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined">credit_score</span>
          שלם עכשיו (הדמיית הצלחה)
        </button>

        <button
          onClick={() => onPay('error')}
          className="w-full bg-surface-container-high hover:bg-error/10 text-error font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 border border-error/30"
        >
          <span className="material-symbols-outlined">error</span>
          הדמיית שגיאה בתשלום
        </button>
      </div>
    </div>
  );
}
