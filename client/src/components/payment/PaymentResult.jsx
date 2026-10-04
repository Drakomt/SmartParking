import { useState } from "react";
import api from "../../lib/api";
import ExitCountdown from "./ExitCountdown";

export default function PaymentResult({ status, sessionData, graceExpiresAt, onGraceExpired, onReset, onRetry }) {
  const isSuccess = status === 'success';
  const isPending = status === "pending";
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email || !sessionData) return;
    
    setLoading(true);
    setError('');

    try {
      await api.post("/api/parking/session/receipt", {
        email,
        checkoutId: sessionData.checkoutId,
        checkoutToken: sessionData.checkoutToken
      });
      setIsSent(true);
    } catch (err) {
      console.error("Failed to send receipt:", err);
      setError("שגיאה בשליחת המייל. (ודא שהשרת תומך בכך)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-6 animate-fade-in-up sm:py-10">
      
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg ${
        isSuccess ? 'bg-green-100 text-green-600' : isPending ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
      }`}>
        <span className="material-symbols-outlined text-6xl">
          {isSuccess ? 'check_circle' : isPending ? 'schedule' : 'cancel'}
        </span>
      </div>
      
      <h2 className={`mb-4 text-center text-2xl font-black sm:text-3xl ${isSuccess ? 'text-green-600 dark:text-green-500' : isPending ? 'text-amber-700 dark:text-amber-400' : 'text-red-600 dark:text-red-500'}`}>
        {isSuccess ? 'התשלום בוצע בהצלחה!' : isPending ? 'התשלום ממתין לאישור' : 'שגיאה בביצוע התשלום'}
      </h2>
      
      <p className="mb-7 text-center leading-7 text-on-surface-variant sm:mb-10 sm:text-lg">
        {isSuccess 
          ? 'התשלום נקלט בהצלחה. יש לצאת מהחניון לפני סיום הזמן כדי להימנע מחיוב נוסף.'
          : isPending
            ? 'פייפאל קיבל את הבקשה ומעבד אותה. בדוק שוב את לוחית הרישוי בעוד כמה רגעים.'
          : 'מצטערים, חלה שגיאה במהלך עיבוד התשלום מול חברת האשראי או פייפאל. אנא נסה שוב.'}
      </p>

      {isSuccess ? (
        <div className="w-full flex flex-col gap-6 mt-4">
          {graceExpiresAt && (
            <ExitCountdown expiresAt={graceExpiresAt} onExpired={onGraceExpired} />
          )}
          {!isSent ? (
            <form onSubmit={handleSendEmail} className="w-full flex flex-col gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <label htmlFor="receiptEmail" className="text-sm font-medium text-on-surface">
                קבלת חשבונית למייל (אופציונלי)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  id="receiptEmail"
                  placeholder="כתובת דואר אלקטרוני"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-12 flex-1 rounded-lg border border-outline-variant/50 bg-surface px-4 py-2 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={!email || loading}
                  className="flex min-h-12 min-w-[70px] cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : "שלח"}
                </button>
              </div>
              {error && <p className="text-error text-xs font-medium px-1">{error}</p>}
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
      ) : isPending ? (
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onReset}
            className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-4 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 border border-outline-variant/30 cursor-pointer"
          >
            <span className="material-symbols-outlined">search</span>
            בדיקת לוחית מחדש
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
