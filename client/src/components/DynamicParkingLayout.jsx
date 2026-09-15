import React from "react";
import ZoomableParkingCanvas from "./ZoomableParkingCanvas";

export default function DynamicParkingLayout({ parkings = [], isAdmin = false, onSpotClick, onAddSpot, isAddingSpot }) {
  // Always ensure spots are ordered sequentially by spotNumber
  const sortedParkings = [...parkings].sort(
    (a, b) => (Number(a.spotNumber) || 0) - (Number(b.spotNumber) || 0)
  );

  // If admin, push a special "Add Spot" placeholder to the end of the array
  const displayParkings = [...sortedParkings];
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
  const hasRow4 = row4.length > 0;

  // Helper to render a single parking spot slot
  const renderSpot = (spot, index, rowPosition = "top") => {
    if (!spot) {
      // Empty placeholder stall to maintain the 8-column grid symmetry
      return (
        <div
          key={`placeholder-${rowPosition}-${index}`}
          className="flex h-20 select-none items-center justify-center rounded-md border border-dashed border-slate-700/30 bg-[#131820]/50 opacity-30 pointer-events-none sm:h-36"
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
          className={`relative flex h-20 flex-col items-center justify-center bg-[#252f3d] p-1 shadow-md transition-all duration-300 hover:bg-primary/20 sm:h-36 sm:p-2 ${borderStyle} ${
            isAddingSpot
              ? "opacity-50 cursor-wait"
              : "cursor-pointer hover:ring-2 hover:ring-white/80 z-20 group"
          }`}
        >
          <span className={`material-symbols-outlined text-3xl font-bold text-white opacity-70 drop-shadow-md sm:text-5xl ${isAddingSpot ? "animate-pulse" : "group-hover:scale-110 group-hover:opacity-100"} transition-all duration-300`}>
            add
          </span>
        </div>
      );
    }

    const isBlocked = spot.status === "blocked" || spot.status === "block";
    const isOccupied = spot.status !== "free" && !isBlocked;
    // Stable car image index based on spotNumber or spot index (1 to 8)
    const carImageIndex = (Math.abs(Number(spot.spotNumber) || index + 1) % 8) + 1;

    // Painted asphalt marking for disabled or dean spots.
    let typeMarking = null;

    if (!isOccupied && spot.type === "disabled") {
      typeMarking = (
        <span className="parking-asphalt-marking parking-spot-relative-symbol parking-asphalt-marking-disabled material-symbols-outlined">
          accessible
        </span>
      );
    } else if (!isOccupied && spot.type === "dean") {
      typeMarking = (
        <span className="parking-asphalt-marking parking-spot-relative-symbol parking-asphalt-marking-dean material-symbols-outlined">
          school
        </span>
      );
    }

    return (
      <div
        key={spot._id || `spot-${index}`}
        onClick={() => onSpotClick && onSpotClick(spot)}
        className={`relative flex h-20 flex-col items-center justify-between bg-[#252f3d] p-0.5 shadow-md transition-all duration-300 hover:bg-[#2d3848] sm:h-36 sm:p-2 ${borderStyle} ${
          isAdmin
            ? "cursor-pointer hover:ring-2 hover:ring-primary z-20"
            : ""
        }`}
      >
        {/* Header at the curb end: spot number only. */}
        <div
          className={`w-full flex flex-col items-center gap-0.5 ${
            rowPosition === "top" ? "order-1" : "order-3"
          }`}
        >
          <div className="w-full relative flex items-center justify-center px-1 min-h-[20px]">
            <span className="z-10 rounded border border-slate-700/60 bg-slate-950/80 px-0.5 py-0.5 font-mono text-[9px] font-black tracking-tight text-slate-200 sm:px-1 sm:text-xs sm:tracking-wider">
              {spot.spotNumber}
            </span>
          </div>
          {/* Wheel Stopper Bar */}
          <div className="mt-0.5 h-1 w-6 rounded-full border border-slate-700/70 bg-slate-950 opacity-70 sm:w-14" />
        </div>

        {/* Spot Center: Car (with multiply blend mode to eliminate white BG) or Free/Blocked indicator */}
        <div className="flex-1 w-full flex items-center justify-center my-0.5 order-2 relative overflow-hidden">
          {typeMarking && (
            <div
              className={`parking-spot-symbol-container absolute inset-0 z-0 flex items-center justify-center pointer-events-none ${
                rowPosition === "bottom" ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              {typeMarking}
            </div>
          )}
          {isBlocked ? (
            <div className="relative z-10 flex flex-col items-center justify-center">
              <span className="parking-blocked-badge-icon material-symbols-outlined text-lg drop-shadow sm:text-3xl">
                block
              </span>
              <span className="parking-blocked-badge-text mt-0.5 hidden text-[10px] font-bold sm:inline sm:text-xs">
                חסום
              </span>
            </div>
          ) : isOccupied ? (
            <img
              src={`/cars/${carImageIndex}.png`}
              alt="Parked car"
              className={`relative z-10 w-[78%] h-[88%] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.8)] transition-transform duration-300 ${
                rowPosition === "bottom" ? "rotate-180" : ""
              }`}
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-end h-full gap-1 pb-1">
              <span className="parking-slot-free-badge rounded-full border px-1 py-0.5 text-[8px] font-bold drop-shadow-sm sm:px-2 sm:text-xs">
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
  const renderRoadLane = () => {
    return (
      <div className="relative my-1.5 flex h-12 select-none items-center justify-between overflow-hidden border-y-2 border-white/60 bg-[#161c24] px-8 shadow-inner pointer-events-none sm:my-3 sm:h-20 sm:px-14">
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
      <ZoomableParkingCanvas label="תרשים חניות במפלס">
        {/* Parking Area Container */}
        <div
          className="w-full overflow-hidden rounded-2xl border-2 border-slate-700/60 bg-[#0d1117] p-2 shadow-2xl sm:p-5"
          dir="ltr"
        >
        <div className="flex w-full flex-col">
          {/* ================= ROW 1 (Spots 1 - 8) ================= */}
          <div className="grid grid-cols-8 gap-1 sm:gap-3">
            {fillRowTo8(row1).map((spot, idx) => renderSpot(spot, idx, "top"))}
          </div>

          {/* ================= ROAD 1 (Central Lane) ================= */}
          {renderRoadLane()}

          {/* ================= ROW 2 (Spots 9 - 16) ================= */}
          {hasRow2 && (
            <div className="grid grid-cols-8 gap-1 sm:gap-3">
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
              <div className="grid grid-cols-8 gap-1 sm:gap-3">
                {fillRowTo8(row3).map((spot, idx) => renderSpot(spot, idx, "top"))}
              </div>

              {/* ROAD 2 (Second Lane - Reverse Direction) */}
              {renderRoadLane()}

              {/* ROW 4 (Spots 25 - 32) */}
              {hasRow4 && (
                <div className="grid grid-cols-8 gap-1 sm:gap-3">
                  {fillRowTo8(row4).map((spot, idx) => renderSpot(spot, idx, "bottom"))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </ZoomableParkingCanvas>

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
