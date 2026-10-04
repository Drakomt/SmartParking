import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-4xl flex-grow flex-col px-3 pb-8 pt-20 sm:px-8 sm:pb-12 sm:pt-24">
      <div className="mb-5 flex items-center gap-3 sm:mb-8 sm:gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          title="חזור"
          aria-label="חזרה לעמוד הקודם"
        >
          <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }}>arrow_back</span>
        </button>
        <h1 className="text-2xl font-black text-primary sm:text-3xl">אודות המערכת</h1>
      </div>

      <div className="flex-grow rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">Smart Parking</h2>
        <p className="mb-4 leading-7 text-on-surface-variant sm:text-lg sm:leading-relaxed">
          ברוכים הבאים למערכת החניות החכמה שלנו. המערכת נועדה לעזור לכם למצוא חניה פנויה בקלות, 
          לנווט ישירות לחניון הקרוב אליכם, ולחסוך זמן יקר בחיפוש חניה.
        </p>
        <p className="mb-4 leading-7 text-on-surface-variant sm:text-lg sm:leading-relaxed" dir="rtl">
          Smart Parking משלבת מידע בזמן אמת, נגישות וניהול חכם כדי לשפר את חוויית החניה בעיר.
        </p>
        <p className="leading-7 text-on-surface-variant sm:text-lg sm:leading-relaxed" dir="rtl">
          האתר נבנה על ידי דולב חלבי, ליאור כהן, ישר פשאי ומתי ציפלקוב במסגרת פרויקט במכללת HIT.
        </p>
      </div>
    </main>
  );
}
