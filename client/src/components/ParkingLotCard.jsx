import React from "react";
import { createPortal } from "react-dom";

export default function ParkingLotCard({
  lot,
  isFavorite,
  onToggleFavorite,
  onClick,
  fallbackCityName = "",
}) {
  const [isHoveringPrice, setIsHoveringPrice] = React.useState(false);
  const [showFullPriceModal, setShowFullPriceModal] = React.useState(false);

  const getLotPricingLabel = (lot) => {
    const pricing = lot.pricing ?? {};
    if (pricing.isFree) return "חינם";
    if (Number(pricing.pricePerMinute) > 0) {
      return `${Number(pricing.pricePerMinute).toLocaleString("he-IL", { maximumFractionDigits: 2 })} ₪ לדקה`;
    }
    if (Number(pricing.parkingFeeMinor) > 0) {
      return `${(Number(pricing.parkingFeeMinor) / 100).toLocaleString("he-IL", { maximumFractionDigits: 2 })} ₪`;
    }
    return "לא הוגדר";
  };

  const formatDistance = (dist) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)} מטר`;
    }
    return `${dist.toFixed(1)} ק"מ`;
  };

  return (
    <>
      <button
        onClick={onClick}
        className="group relative flex w-full cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 text-right shadow-sm transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary hover:bg-primary/5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary sm:p-5"
        aria-label={`הצג את חניון ${lot.name}`}
      >
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-1 text-right">
            <span className="font-headline-sm text-primary transition-colors">
              {lot.name}
            </span>
            <div className="flex items-center gap-1 text-on-surface-variant font-body-md justify-start">
              <span className="material-symbols-outlined text-sm">
                location_on
              </span>
              <span>{lot.address || lot.city?.name || fallbackCityName}</span>
            </div>
            {lot.distanceKm !== undefined && (
              <div className="flex items-center gap-1 text-primary/80 font-body-sm justify-start mt-1">
                <span className="material-symbols-outlined text-sm">route</span>
                <span>{formatDistance(lot.distanceKm)} ממך</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-2 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </div>
          </div>
        </div>

        <div className="mt-1 flex w-full flex-col items-stretch justify-between gap-2 border-t border-outline-variant/20 pt-3 min-[360px]:flex-row min-[360px]:items-center">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {lot.totalSpots && (
              <span className="whitespace-nowrap rounded-md bg-surface-container-high px-2 py-1 text-xs font-bold text-on-surface transition-colors group-hover:bg-primary group-hover:text-on-primary sm:text-sm">
                {lot.totalSpots} סה"כ מקומות
              </span>
            )}
            {lot.spots && (
              <span
                className={`whitespace-nowrap rounded-md px-2 py-1 text-xs transition-colors sm:text-sm ${
                  lot.spots.filter((s) => s.status === "free").length > 0
                    ? "bg-blue-100/80 text-slate-900 font-extrabold group-hover:bg-blue-200 group-hover:text-black"
                    : "bg-error-container text-on-error-container font-bold"
                }`}
              >
                {lot.spots.filter((s) => s.status === "free").length} פנויים
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <div 
              className="relative"
              onMouseEnter={() => setIsHoveringPrice(true)}
              onMouseLeave={() => setIsHoveringPrice(false)}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullPriceModal(true);
                  setIsHoveringPrice(false);
                }}
                className={`flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-primary transition-colors hover:bg-primary/10 ${isHoveringPrice ? 'bg-primary/10' : ''}`}
                title="לחץ למחירון המלא"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">payments</span>
              </div>
              
              {isHoveringPrice && !showFullPriceModal && (
                <div 
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-surface-container-highest text-on-surface font-bold text-[12px] sm:text-sm px-3 py-2 rounded-lg shadow-lg border border-outline-variant/30 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  תעריף: <span className="text-primary">{getLotPricingLabel(lot)}</span>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-surface-container-highest"></div>
                </div>
              )}
            </div>
            
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (lot.location?.lat && lot.location?.lng) {
                  window.open(`https://waze.com/ul?ll=${lot.location.lat},${lot.location.lng}&navigate=yes`, '_blank');
                } else {
                  alert('קואורדינטות חסרות לחניון זה');
                }
              }}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-primary transition-colors hover:bg-primary/10"
              title="נווט לחניון ב-Waze"
            >
              <i className="fa-brands fa-waze text-[20px] sm:text-[22px]"></i>
            </div>
            <div
              onClick={(e) => onToggleFavorite(e, lot)}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 transition-colors hover:bg-yellow-500/10 ${
                isFavorite
                  ? "text-yellow-500"
                  : "text-outline-variant hover:text-yellow-500"
              }`}
              title="שמור למועדפים"
            >
            <span
              className="material-symbols-outlined text-[20px] sm:text-[22px]"
              style={{
                fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              star
            </span>
          </div>
          </div>
        </div>
      </button>

      {showFullPriceModal && createPortal(
        <div 
          className="mobile-sheet-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
          onClick={(e) => { e.stopPropagation(); setShowFullPriceModal(false); }}
        >
          <div 
          className="mobile-sheet flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-0 text-right shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lot-price-title"
          >
            <div className="bg-primary/5 px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center relative">
              <div className="flex flex-col">
                <h3 id="lot-price-title" className="text-xl font-black text-primary">מחירון חניון</h3>
                <span className="text-sm font-bold text-on-surface-variant">{lot.name}</span>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">receipt_long</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 text-on-surface sm:p-6">
               {lot.pricing?.isFree ? (
                 <div className="flex flex-col items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-6 rounded-2xl border border-emerald-200">
                   <span className="material-symbols-outlined text-5xl drop-shadow-sm">verified</span>
                   <span className="text-xl font-black">החניה חינם!</span>
                 </div>
               ) : (
                 <div className="flex flex-col gap-3 bg-surface-container/30 p-4 rounded-2xl">
                   {lot.pricing?.freeFirstHours > 0 && (
                     <div className="flex justify-between items-center py-2">
                       <span className="text-on-surface-variant font-medium">שעות ראשונות חינם</span>
                       <span className="font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full text-sm shadow-sm">{lot.pricing.freeFirstHours} שעות</span>
                     </div>
                   )}
                   {lot.pricing?.pricePerMinute > 0 && (
                     <div className="flex justify-between items-center py-2 border-t border-outline-variant/30">
                       <span className="text-on-surface-variant font-medium">תעריף לדקה</span>
                       <span className="font-black text-lg">{Number(lot.pricing.pricePerMinute).toLocaleString("he-IL", { maximumFractionDigits: 2 })} ₪</span>
                     </div>
                   )}
                   {lot.pricing?.fullDayPriceMinor > 0 && (
                     <div className="flex justify-between items-center py-2 border-t border-outline-variant/30">
                       <span className="text-on-surface-variant font-medium">תקרה יומית מקסימלית</span>
                       <span className="font-black text-lg">{(lot.pricing.fullDayPriceMinor / 100).toLocaleString("he-IL", { maximumFractionDigits: 2 })} ₪</span>
                     </div>
                   )}
                   {lot.pricing?.parkingFeeMinor > 0 && (
                     <div className="flex justify-between items-center py-2 border-t border-outline-variant/30">
                       <span className="text-on-surface-variant font-medium">מחיר כניסה חד פעמי</span>
                       <span className="font-black text-lg">{(lot.pricing.parkingFeeMinor / 100).toLocaleString("he-IL", { maximumFractionDigits: 2 })} ₪</span>
                     </div>
                   )}
                   
                   {(!lot.pricing?.freeFirstHours && !lot.pricing?.pricePerMinute && !lot.pricing?.fullDayPriceMinor && !lot.pricing?.parkingFeeMinor) && (
                      <div className="text-center text-on-surface-variant italic py-4">
                        לא הוגדר מחירון מפורט לחניון זה.
                      </div>
                   )}
                 </div>
               )}
            </div>

            <div className="p-4 pt-0">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowFullPriceModal(false); }}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-black text-on-primary shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
              >
                הבנתי, תודה
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
