import React from "react";

export default function ParkingLotCard({
  lot,
  isFavorite,
  onToggleFavorite,
  onClick,
  fallbackCityName = "",
}) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer bg-surface-container-lowest hover:bg-primary/5 transition-all duration-300 p-5 rounded-2xl border border-outline-variant/40 hover:border-primary shadow-sm hover:shadow-lg hover:-translate-y-1 text-right flex flex-col gap-3 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary w-full"
      aria-label={`הצג את חניון ${lot.name}`}
    >
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-1 text-right">
          <span className="font-headline-sm text-primary group-hover:text-primary-container transition-colors">
            {lot.name}
          </span>
          <div className="flex items-center gap-1 text-on-surface-variant font-body-md justify-start">
            <span className="material-symbols-outlined text-sm">
              location_on
            </span>
            <span>{lot.address || lot.city?.name || fallbackCityName}</span>
          </div>
        </div>

        <div className="bg-primary/10 text-primary p-2 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </div>
      </div>

      <div className="w-full pt-3 mt-1 border-t border-outline-variant/20 flex justify-between items-center gap-2">
        <div className="flex gap-2">
          {lot.totalSpots && (
            <span className="bg-surface-container-high px-2 py-1 rounded-md text-label-sm text-on-surface font-bold group-hover:bg-primary group-hover:text-on-primary transition-colors">
              {lot.totalSpots} סה"כ מקומות
            </span>
          )}
          {lot.spots && (
            <span
              className={`px-2 py-1 rounded-md text-label-sm transition-colors ${
                lot.spots.filter((s) => s.status === "free").length > 0
                  ? "bg-blue-100/80 text-slate-900 font-extrabold group-hover:bg-blue-200 group-hover:text-black"
                  : "bg-error-container text-on-error-container font-bold"
              }`}
            >
              {lot.spots.filter((s) => s.status === "free").length} פנויים
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (lot.location?.lat && lot.location?.lng) {
                window.open(`https://waze.com/ul?ll=${lot.location.lat},${lot.location.lng}&navigate=yes`, '_blank');
              } else {
                alert('קואורדינטות חסרות לחניון זה');
              }
            }}
            className="p-2 rounded-full transition-colors flex items-center justify-center text-primary hover:bg-primary/10 hover:text-primary-container"
            title="נווט לחניון ב-Waze"
          >
            <i className="fa-brands fa-waze text-xl"></i>
          </div>
          <div
            onClick={(e) => onToggleFavorite(e, lot)}
            className={`p-2 rounded-full transition-colors flex items-center justify-center hover:bg-yellow-500/10 ${
              isFavorite
                ? "text-yellow-500"
                : "text-outline-variant hover:text-yellow-500"
            }`}
            title="שמור למועדפים"
          >
          <span
            className="material-symbols-outlined"
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
  );
}
