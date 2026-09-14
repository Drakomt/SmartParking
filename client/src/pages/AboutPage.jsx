import React from "react";
import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <main className="flex-grow pt-24 px-4 sm:px-8 max-w-4xl mx-auto w-full flex flex-col min-h-[calc(100vh-100px)] pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer"
          title="חזור"
        >
          <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }}>arrow_back</span>
        </button>
        <h1 className="text-3xl font-black text-primary">אודות המערכת</h1>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/30 flex-grow">
        <h2 className="text-2xl font-bold text-primary mb-4">Smart Parking</h2>
        <p className="text-on-surface-variant text-lg mb-4 leading-relaxed">
          ברוכים הבאים למערכת החניות החכמה שלנו. המערכת נועדה לעזור לכם למצוא חניה פנויה בקלות, 
          לנווט ישירות לחניון הקרוב אליכם, ולחסוך זמן יקר בחיפוש חניה.
        </p>
        <p className="text-on-surface-variant text-lg mb-4 leading-relaxed" dir="rtl">
          Smart Parking משלבת מידע בזמן אמת, נגישות וניהול חכם כדי לשפר את חוויית החניה בעיר.
        </p>
        <p className="text-on-surface-variant text-lg leading-relaxed" dir="rtl">
          האתר נבנה על ידי דולב חלבי, ליאור כהן, ישר פשאי ומתי ציפלקוב במסגרת פרויקט במכללת HIT.
        </p>
      </div>
    </main>
  );
}
