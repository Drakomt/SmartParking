import { useState } from "react";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(
    () => !localStorage.getItem("cookie_consent"),
  );

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div 
      className="fixed bottom-2 left-2 right-2 z-50 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-highest p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_-6px_rgba(0,0,0,0.25)] sm:bottom-0 sm:left-0 sm:right-0 sm:flex-row sm:items-center sm:gap-4 sm:rounded-none sm:border-x-0 sm:border-b-0 sm:p-6"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-2xl text-primary sm:text-3xl" aria-hidden="true">cookie</span>
        <div>
          <h4 className="text-on-surface font-bold text-sm sm:text-base">אנחנו משתמשים בעוגיות</h4>
          <p className="mt-0.5 text-xs leading-5 text-on-surface-variant sm:text-sm">
            האתר עושה שימוש בקבצי קוקיז (Cookies) כדי לשמור את החיבור שלך למערכת ולשפר את חווית המשתמש.
          </p>
        </div>
      </div>
      <button
        onClick={handleAccept}
        className="min-h-12 w-full whitespace-nowrap rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow transition-colors hover:bg-primary/90 sm:w-auto"
      >
        הבנתי והסכמתי
      </button>
    </div>
  );
}
