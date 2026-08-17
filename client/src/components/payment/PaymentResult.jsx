import React, { useState } from "react";

export default function PaymentResult({ status, onReset, onRetry }) {
  const isSuccess = status === 'success';
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (email) {
      // Dummy logic for sending email
      setIsSent(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in-up max-w-md mx-auto py-10">
      
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg ${
        isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        <span className="material-symbols-outlined text-6xl">
          {isSuccess ? 'check_circle' : 'cancel'}
        </span>
      </div>
      
      <h2 className={`text-3xl font-black mb-4 text-center ${isSuccess ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
        {isSuccess ? 'התשלום בוצע בהצלחה!' : 'שגיאה בביצוע התשלום'}
      </h2>
      
      <p className="text-on-surface-variant text-center mb-10 text-lg">
        {isSuccess 
          ? 'תודה רבה! החשבונית נשלחה למייל שלך. שער החניון ייפתח כעת באופן אוטומטי ביציאה.' 
          : 'מצטערים, חלה שגיאה במהלך עיבוד התשלום מול חברת האשראי או פייפאל. אנא נסה שוב.'}
      </p>

      {isSuccess ? (
        <div className="w-full flex flex-col gap-6 mt-4">
          {!isSent ? (
            <form onSubmit={handleSendEmail} className="w-full flex flex-col gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <label htmlFor="receiptEmail" className="text-sm font-medium text-on-surface">
                קבלת חשבונית למייל (אופציונלי)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="receiptEmail"
                  placeholder="כתובת דואר אלקטרוני"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-surface border border-outline-variant/50 rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={!email}
                  className="bg-primary hover:bg-primary/90 text-on-primary font-bold px-4 py-2 rounded-lg transition-all text-sm disabled:opacity-50 cursor-pointer"
                >
                  שלח
                </button>
              </div>
            </form>
          ) : (
            <div className="w-full flex items-center gap-3 bg-success/10 text-success p-4 rounded-xl border border-success/30">
              <span className="material-symbols-outlined text-success">mark_email_read</span>
              <span className="text-sm font-bold">החשבונית נשלחה בהצלחה לכתובת {email}</span>
            </div>
          )}

          <button
            onClick={onReset}
            className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-4 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 border border-outline-variant/30 cursor-pointer"
          >
            <span className="material-symbols-outlined">home</span>
            סיום וחזרה להתחלה
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined">refresh</span>
            נסה שוב
          </button>
          <button
            onClick={onReset}
            className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 border border-outline-variant/30 cursor-pointer"
          >
            <span className="material-symbols-outlined">search</span>
            חיפוש רכב אחר
          </button>
        </div>
      )}
    </div>
  );
}
