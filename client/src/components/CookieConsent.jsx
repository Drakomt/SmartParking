import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-highest border-t border-outline-variant/30 p-4 sm:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom duration-500"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-3xl">cookie</span>
        <div>
          <h4 className="text-on-surface font-bold text-sm sm:text-base">אנחנו משתמשים בעוגיות</h4>
          <p className="text-on-surface-variant text-xs sm:text-sm">
            האתר עושה שימוש בקבצי קוקיז (Cookies) כדי לשמור את החיבור שלך למערכת ולשפר את חווית המשתמש.
          </p>
        </div>
      </div>
      <button
        onClick={handleAccept}
        className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow hover:bg-primary/90 transition-all text-sm"
      >
        הבנתי והסכמתי
      </button>
    </div>
  );
}
