import React from "react";

export default function PaymentResult({ status, onReset, onRetry }) {
  const isSuccess = status === 'success';

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
        <button
          onClick={onReset}
          className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-4 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 border border-outline-variant/30 cursor-pointer"
        >
          <span className="material-symbols-outlined">home</span>
          סיום וחזרה להתחלה
        </button>
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
