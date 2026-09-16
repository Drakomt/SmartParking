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
    <main className="flex-grow w-full max-w-4xl mx-auto flex min-h-[calc(100vh-100px)] flex-col px-3 pt-20 pb-8 sm:px-8 sm:pt-24 sm:pb-12">
      <div className="mb-5 flex items-center gap-3 sm:mb-8 sm:gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="חזרה לעמוד הקודם"
          title="חזור"
        >
          <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }}>arrow_back</span>
        </button>
        <h1 className="text-2xl font-black text-primary sm:text-3xl">הגדרות</h1>
      </div>

      <div className="flex-grow rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:rounded-3xl sm:p-8">
        
        <h2 className="text-xl font-bold text-primary mb-6">הגדרות כלליות</h2>
        <div className="space-y-6 mb-10">
          
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="group mb-6 flex min-h-20 w-full cursor-pointer items-center justify-between gap-4 border-b border-outline-variant/20 pb-6 text-right"
            aria-pressed={isDarkMode}
          >
            <div className="min-w-0">
              <h3 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">מצב לילה</h3>
              <p className="text-sm text-on-surface-variant">החלף בין תצוגה בהירה לכהה בכל רחבי האתר</p>
            </div>
            <span className={`flex h-8 w-14 shrink-0 items-center rounded-full border px-1 transition-colors ${isDarkMode ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant/30'}`} aria-hidden="true">
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-[-28px]' : 'translate-x-0'}`}></div>
            </span>
          </button>

          <div>
            <h3 className="font-bold text-on-surface text-lg mb-4">ערכת נושא (צבעי האתר)</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setThemeColor('classic')}
                className={`flex min-h-12 flex-1 items-center gap-4 rounded-xl border-2 px-4 py-3 transition-all sm:flex-col sm:gap-2 ${themeColor === 'classic' ? 'border-[#091426] dark:border-[#3b82f6] bg-surface-container-low shadow-sm' : 'border-outline-variant/30 hover:border-outline/50 cursor-pointer'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#091426] dark:bg-[#3b82f6] shrink-0"></div>
                <span className="font-bold text-sm">קלאסי</span>
              </button>
              
              <button 
                onClick={() => setThemeColor('ocean')}
                className={`flex min-h-12 flex-1 items-center gap-4 rounded-xl border-2 px-4 py-3 transition-all sm:flex-col sm:gap-2 ${themeColor === 'ocean' ? 'border-[#0284c7] dark:border-[#38bdf8] bg-surface-container-low shadow-sm' : 'border-outline-variant/30 hover:border-outline/50 cursor-pointer'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#0284c7] dark:bg-[#38bdf8] shrink-0"></div>
                <span className="font-bold text-sm">אוקיינוס</span>
              </button>
              
              <button 
                onClick={() => setThemeColor('earth')}
                className={`flex min-h-12 flex-1 items-center gap-4 rounded-xl border-2 px-4 py-3 transition-all sm:flex-col sm:gap-2 ${themeColor === 'earth' ? 'border-[#ea580c] dark:border-[#f59e0b] bg-surface-container-low shadow-sm' : 'border-outline-variant/30 hover:border-outline/50 cursor-pointer'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#ea580c] dark:bg-[#f59e0b] shrink-0"></div>
                <span className="font-bold text-sm">אדמה ושקיעה</span>
              </button>
            </div>
          </div>
        </div>

        <div ref={accessibilityRef} className="mb-4 overflow-hidden rounded-2xl border border-outline-variant/30 sm:mb-8">
          <button 
            onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)}
            className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 bg-surface-container-low p-4 text-right transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary sm:p-6"
            aria-expanded={isAccessibilityOpen}
            aria-controls="accessibility-settings"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">accessibility_new</span>
              <h2 className="text-xl font-bold text-primary">נגישות</h2>
            </div>
            <span className="material-symbols-outlined text-primary transition-transform" style={{ transform: isAccessibilityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </button>
          
          {isAccessibilityOpen && (
            <div id="accessibility-settings" className="space-y-3 border-t border-outline-variant/30 bg-surface-container-lowest p-3 animate-fade-in-up sm:space-y-4 sm:p-6">
              
              <button
                type="button"
                onClick={() => setIsLargeText(!isLargeText)}
                className="group flex min-h-28 w-full cursor-pointer flex-col items-stretch justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-right transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-0 sm:flex-row sm:items-center sm:p-5"
                role="switch"
                aria-checked={isLargeText}
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">נגישות ראייה (טקסט גדול)</h3>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">הגדל את כל הטקסטים והכפתורים באתר לקריאה נוחה יותר</p>
                </div>
                <span className="flex items-center justify-between gap-3 sm:shrink-0" aria-hidden="true">
                  <span className="text-sm font-bold text-on-surface-variant">{isLargeText ? 'פעיל' : 'כבוי'}</span>
                  <span className={`flex h-8 w-14 items-center rounded-full border px-1 transition-colors ${isLargeText ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant/30'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isLargeText ? 'translate-x-[-28px]' : 'translate-x-0'}`}></div>
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsColorBlindMode(!isColorBlindMode)}
                className="group flex min-h-28 w-full cursor-pointer flex-col items-stretch justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-right transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-0 sm:flex-row sm:items-center sm:p-5"
                role="switch"
                aria-checked={isColorBlindMode}
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">התאמת צבעים (עיוורון צבעים)</h3>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">מחליף סטטוסים של אדום/ירוק לכחול/כתום בעלי ניגודיות גבוהה</p>
                </div>
                <span className="flex items-center justify-between gap-3 sm:shrink-0" aria-hidden="true">
                  <span className="text-sm font-bold text-on-surface-variant">{isColorBlindMode ? 'פעיל' : 'כבוי'}</span>
                  <span className={`flex h-8 w-14 items-center rounded-full border px-1 transition-colors ${isColorBlindMode ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant/30'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isColorBlindMode ? 'translate-x-[-28px]' : 'translate-x-0'}`}></div>
                  </span>
                </span>
              </button>

            </div>
          )}
        </div>

      </div>
    </main>
  );
}
