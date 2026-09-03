import React from "react";

export default function DynamicParkingLayout({ parkings = [], isAdmin = false, onSpotClick, onAddSpot, isAddingSpot }) {
  // If admin, push a special "Add Spot" placeholder to the end of the array
  const displayParkings = [...parkings];
  if (isAdmin && onAddSpot) {
    displayParkings.push({ isAddButton: true });
  }

  // Slicing parkings into rows of 8 (up to 32 spots total per level)
  const row1 = displayParkings.slice(0, 8);
  const row2 = displayParkings.slice(8, 16);
  const row3 = displayParkings.slice(16, 24);
  const row4 = displayParkings.slice(24, 32);

  const hasSecondRoad = displayParkings.length > 16;
  const hasRow2 = row2.length > 0;
  const hasRow3 = row3.length > 0;
  const hasRow4 = row4.length > 0;

  // Helper to render a single parking spot slot
  const renderSpot = (spot, index, rowPosition = "top") => {
    if (!spot) {
      // Empty placeholder stall to maintain the 8-column grid symmetry
      return (
        <div
          key={`placeholder-${rowPosition}-${index}`}
          className="h-28 sm:h-36 rounded-md bg-[#131820]/50 border border-dashed border-slate-700/30 flex items-center justify-center opacity-30 select-none pointer-events-none"
        >
          <span className="text-[10px] text-slate-600 font-mono">--</span>
        </div>
      );
    }

    const borderStyle =
      rowPosition === "top"
        ? "border-x-2 border-t-2 border-b-0 border-white/80 rounded-t-sm"
        : "border-x-2 border-b-2 border-t-0 border-white/80 rounded-b-sm";

    if (spot.isAddButton) {
      return (
        <div
          key="add-button-spot"
          onClick={isAddingSpot ? undefined : onAddSpot}
          className={`relative h-28 sm:h-36 bg-[#252f3d] hover:bg-primary/20 ${borderStyle} flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-300 shadow-md ${
            isAddingSpot
              ? "opacity-50 cursor-wait"
              : "cursor-pointer hover:ring-2 hover:ring-white/80 z-20 group"
          }`}
        >
          <span className={`material-symbols-outlined text-5xl text-white font-bold drop-shadow-md opacity-70 ${isAddingSpot ? "animate-pulse" : "group-hover:opacity-100 group-hover:scale-110"} transition-all duration-300`}>
            add
          </span>
        </div>
      );
    }

    const isOccupied = spot.status !== "free" && spot.status !== "blocked";
    // Stable car image index based on spotNumber or spot index (1 to 8)
    const carImageIndex = (Math.abs(Number(spot.spotNumber) || index + 1) % 8) + 1;

    // Dedicated badge for disabled or dean spot (neatly aligned next to spot number, never overlapping)
    let typeBadge = null;
    let typeWatermark = null;

    if (spot.type === "disabled") {
      typeBadge = (
        <div
          className="bg-blue-600 text-white p-[2px] rounded-sm flex items-center justify-center shadow-sm"
          title="חניית נכה"
        >
          <span className="material-symbols-outlined text-[11px] leading-none block">accessible</span>
        </div>
      );
      if (!isOccupied) {
        typeWatermark = (
          <span className="material-symbols-outlined text-blue-400 text-2xl sm:text-3xl opacity-80">
            accessible
          </span>
        );
      }
    } else if (spot.type === "dean") {
      typeBadge = (
        <div
          className="bg-amber-600 text-slate-950 p-[0.5px] rounded-sm flex items-center justify-center shadow-sm font-bold"
          title="חניית הנהלה"
        >
          <span className="material-symbols-outlined text-[11px] leading-none block">school</span>
        </div>
      );
      if (!isOccupied) {
        typeWatermark = (
          <span className="material-symbols-outlined text-amber-300 text-2xl sm:text-3xl opacity-80">
            school
          </span>
        );
      }
    }

    return (
      <div
        key={spot._id || `spot-${index}`}
        onClick={() => onSpotClick && onSpotClick(spot)}
        className={`relative h-28 sm:h-36 bg-[#252f3d] hover:bg-[#2d3848] ${borderStyle} flex flex-col items-center justify-between p-1 sm:p-2 transition-all duration-300 shadow-md ${
          isAdmin
            ? "cursor-pointer hover:ring-2 hover:ring-primary z-20"
            : ""
        }`}
      >
        {/* Header at the curb end: Spot Number centered, Badge absolute right */}
        <div
          className={`w-full flex flex-col items-center gap-0.5 ${
            rowPosition === "top" ? "order-1" : "order-3"
          }`}
        >
          <div className="w-full relative flex items-center justify-center px-1 min-h-[20px]">
            <span className="text-[11px] sm:text-xs font-black text-slate-200 tracking-wider bg-slate-950/80 px-1 py-0.5 rounded border border-slate-700/60 z-10">
              {spot.spotNumber}
            </span>
            {typeBadge && (
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 z-0">
                {typeBadge}
              </div>
            )}
          </div>
          {/* Wheel Stopper Bar */}
          <div className="w-10 sm:w-14 h-1 bg-slate-950 rounded-full border border-slate-700/70 opacity-70 mt-0.5" />
        </div>

        {/* Spot Center: Car (with multiply blend mode to eliminate white BG) or Free/Blocked indicator */}
        <div className="flex-1 w-full flex items-center justify-center my-0.5 order-2 relative overflow-hidden">
          {spot.status === "blocked" ? (
            <div className="flex flex-col items-center justify-center">
              <span className="parking-blocked-badge-icon material-symbols-outlined text-2xl sm:text-3xl drop-shadow">
                block
              </span>
              <span className="parking-blocked-badge-text text-[10px] sm:text-xs font-bold mt-0.5">
                חסום
              </span>
            </div>
          ) : isOccupied ? (
            <img
              src={`/cars/${carImageIndex}.png`}
              alt="Parked car"
              className={`w-[78%] h-[88%] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.8)] transition-transform duration-300 ${
                rowPosition === "bottom" ? "rotate-180" : ""
              }`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1">
              {typeWatermark}
              <span className="parking-slot-free-badge text-[10px] sm:text-xs font-bold border px-2 py-0.5 rounded-full drop-shadow-sm">
                פנוי
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper to fill a row up to 8 slots for perfect grid alignment
  const fillRowTo8 = (rowArray) => {
    return Array.from({ length: 8 }, (_, i) => rowArray[i] || null);
  };

  // Clean Realistic Road Lane Component (No text, pure painted arrows & asphalt center line)
  const renderRoadLane = (direction = "right") => {
    const isReverse = direction === "left";
    return (
      <div className="h-16 sm:h-20 bg-[#161c24] my-2 sm:my-3 relative flex items-center justify-between px-8 sm:px-14 border-y-2 border-white/60 shadow-inner overflow-hidden select-none pointer-events-none">
        {/* Asphalt Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/30 via-transparent to-slate-900/30 pointer-events-none" />

        {/* Center Dashed Yellow Lane Line */}
        <div 
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] opacity-80"
          style={{
            backgroundImage: "repeating-linear-gradient(to right, #fbbf24 0, #fbbf24 40px, transparent 40px, transparent 90px)"
          }}
        />

        {/* Top Lane Arrows (Pointing Left, placed on the Right) */}
        <div className="absolute top-0 left-0 right-0 bottom-1/2 flex items-center justify-end pr-16 sm:pr-32 z-10">
          {[1].map((arrowIdx) => (
            <div key={`arrow-left-${arrowIdx}`} className="flex items-center opacity-95">
              <svg
                className="w-12 h-6 sm:w-16 sm:h-8 text-white fill-current drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] rotate-180"
                viewBox="0 0 100 50"
              >
                <path d="M 5,20 L 65,20 L 65,5 L 95,25 L 65,45 L 65,30 L 5,30 Z" />
              </svg>
            </div>
          ))}
        </div>

        {/* Bottom Lane Arrows (Pointing Right, placed on the Left) */}
        <div className="absolute top-1/2 left-0 right-0 bottom-0 flex items-center justify-start pl-16 sm:pl-32 z-10">
          {[1].map((arrowIdx) => (
            <div key={`arrow-right-${arrowIdx}`} className="flex items-center opacity-95">
              <svg
                className="w-12 h-6 sm:w-16 sm:h-8 text-white fill-current drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                viewBox="0 0 100 50"
              >
                <path d="M 5,20 L 65,20 L 65,5 L 95,25 L 65,45 L 65,30 L 5,30 Z" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Parking Area Container */}
      <div
        className="w-full bg-[#0d1117] rounded-2xl p-3 sm:p-5 border-2 border-slate-700/60 shadow-2xl overflow-x-auto"
        dir="ltr"
      >
        <div className="min-w-[620px] flex flex-col">
          {/* ================= ROW 1 (Spots 1 - 8) ================= */}
          <div className="grid grid-cols-8 gap-2 sm:gap-3">
            {fillRowTo8(row1).map((spot, idx) => renderSpot(spot, idx, "top"))}
          </div>

          {/* ================= ROAD 1 (Central Lane) ================= */}
          {renderRoadLane("right")}

          {/* ================= ROW 2 (Spots 9 - 16) ================= */}
          {hasRow2 && (
            <div className="grid grid-cols-8 gap-2 sm:gap-3">
              {fillRowTo8(row2).map((spot, idx) => renderSpot(spot, idx, "bottom"))}
            </div>
          )}

          {/* ================= EXTENDED SECTION (Above 16 spots: Row 3, Road 2, Row 4) ================= */}
          {hasSecondRoad && (
            <>
              {/* Central Divider / Curb Island between Row 2 and Row 3 */}
              <div className="h-3 bg-slate-900 my-2 rounded-full border-t-2 border-b-2 border-slate-700 flex items-center justify-center">
                <div className="w-24 h-0.5 bg-slate-700 rounded-full" />
              </div>

              {/* ROW 3 (Spots 17 - 24) */}
              <div className="grid grid-cols-8 gap-2 sm:gap-3">
                {fillRowTo8(row3).map((spot, idx) => renderSpot(spot, idx, "top"))}
              </div>

              {/* ROAD 2 (Second Lane - Reverse Direction) */}
              {renderRoadLane("left")}

              {/* ROW 4 (Spots 25 - 32) */}
              {hasRow4 && (
                <div className="grid grid-cols-8 gap-2 sm:gap-3">
                  {fillRowTo8(row4).map((spot, idx) => renderSpot(spot, idx, "bottom"))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend / Status Info */}
      <div
        className="w-full mt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 px-2"
        dir="rtl"
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full parking-legend-free-dot"></span>
            <span>פנוי</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="parking-blocked-badge-icon material-symbols-outlined text-sm">block</span>
            <span>חסום</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-blue-400 text-sm">accessible</span>
            <span>נכה</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber-500 text-sm">school</span>
            <span>דיקן</span>
          </span>
        </div>
      </div>
    </div>
  );
}
