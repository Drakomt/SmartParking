import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    isDarkMode,
    setIsDarkMode,
    isLargeText,
    setIsLargeText,
    isColorBlindMode,
    setIsColorBlindMode,
    themeColor,
    setThemeColor,
  } = useSettings();

  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const accessibilityRef = useRef(null);

  useEffect(() => {
    if (isAccessibilityOpen && accessibilityRef.current) {
      setTimeout(() => {
        accessibilityRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
    }
  }, [isAccessibilityOpen]);

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
        <h1 className="text-3xl font-black text-primary">הגדרות</h1>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/30 flex-grow">
        
        <h2 className="text-xl font-bold text-primary mb-6">הגדרות כלליות</h2>
        <div className="space-y-6 mb-10">
          
          <div 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center justify-between pb-6 border-b border-outline-variant/20 cursor-pointer group mb-6"
          >
            <div>
              <h3 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">מצב לילה</h3>
              <p className="text-sm text-on-surface-variant">החלף בין תצוגה בהירה לכהה בכל רחבי האתר</p>
            </div>
            <button 
              className={`w-14 h-7 rounded-full flex items-center px-1 transition-colors border ${isDarkMode ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant/30'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-[-28px]' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div>
            <h3 className="font-bold text-on-surface text-lg mb-4">ערכת נושא (צבעי האתר)</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setThemeColor('classic')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${themeColor === 'classic' ? 'border-[#091426] dark:border-[#3b82f6] bg-surface-container-low shadow-sm' : 'border-outline-variant/30 hover:border-outline/50 cursor-pointer'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#091426] dark:bg-[#3b82f6]"></div>
                <span className="font-bold text-sm">קלאסי</span>
              </button>
              
              <button 
                onClick={() => setThemeColor('ocean')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${themeColor === 'ocean' ? 'border-[#0284c7] dark:border-[#38bdf8] bg-surface-container-low shadow-sm' : 'border-outline-variant/30 hover:border-outline/50 cursor-pointer'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#0284c7] dark:bg-[#38bdf8]"></div>
                <span className="font-bold text-sm">אוקיינוס</span>
              </button>
              
              <button 
                onClick={() => setThemeColor('earth')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${themeColor === 'earth' ? 'border-[#ea580c] dark:border-[#f59e0b] bg-surface-container-low shadow-sm' : 'border-outline-variant/30 hover:border-outline/50 cursor-pointer'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#ea580c] dark:bg-[#f59e0b]"></div>
                <span className="font-bold text-sm">אדמה ושקיעה</span>
              </button>
            </div>
          </div>
        </div>

        <div ref={accessibilityRef} className="border border-outline-variant/30 rounded-2xl overflow-hidden mb-8">
          <button 
            onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)}
            className="w-full bg-surface-container-low hover:bg-surface-container transition-colors p-6 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">accessibility_new</span>
              <h2 className="text-xl font-bold text-primary">נגישות</h2>
            </div>
            <span className="material-symbols-outlined text-primary transition-transform" style={{ transform: isAccessibilityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </button>
          
          {isAccessibilityOpen && (
            <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/30 space-y-6 animate-fade-in-up">
              
              <div 
                onClick={() => setIsLargeText(!isLargeText)}
                className="flex items-center justify-between border-b border-outline-variant/20 pb-6 cursor-pointer group"
              >
                <div>
                  <h3 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">נגישות ראייה (טקסט גדול)</h3>
                  <p className="text-sm text-on-surface-variant">הגדל את כל הטקסטים והכפתורים באתר לקריאה נוחה יותר</p>
                </div>
                <button 
                  className={`w-14 h-7 rounded-full flex items-center px-1 transition-colors border ${isLargeText ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant/30'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isLargeText ? 'translate-x-[-28px]' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div 
                onClick={() => setIsColorBlindMode(!isColorBlindMode)}
                className="flex items-center justify-between pb-2 cursor-pointer group"
              >
                <div>
                  <h3 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">התאמת צבעים (עיוורון צבעים)</h3>
                  <p className="text-sm text-on-surface-variant">מחליף צבעים בעייתיים (כגון אדום/ירוק) לפלטה בעלת ניגודיות גבוהה (כחול/כתום)</p>
                </div>
                <button 
                  className={`w-14 h-7 rounded-full flex items-center px-1 transition-colors border ${isColorBlindMode ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant/30'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isColorBlindMode ? 'translate-x-[-28px]' : 'translate-x-0'}`}></div>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </main>
  );
}
