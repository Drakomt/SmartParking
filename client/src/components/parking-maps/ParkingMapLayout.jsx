import { useMemo } from "react";
import ZoomableParkingCanvas from "../ZoomableParkingCanvas";

/**
 * Generic image-based parking layout. A parking lot supplies its image and
 * coordinates while this component owns the shared parking spot behaviour.
 */
export default function ParkingMapLayout({
  parkings = [],
  isAdmin = false,
  onSpotClick,
  onAddSpot,
  isAddingSpot = false,
  map,
}) {
  const sortedParkings = useMemo(() => {
    const excludedSpotNumbers = new Set(
      (map?.excludedSpotNumbers ?? []).map((spotNumber) => String(spotNumber)),
    );

    return [...parkings]
      .filter((spot) => !excludedSpotNumbers.has(String(spot.spotNumber)))
      .sort(
        (a, b) => (Number(a.spotNumber) || 0) - (Number(b.spotNumber) || 0),
      );
  }, [map, parkings]);
  const coordinates = map?.coordinates ?? [];
  const visibleParkings = sortedParkings.slice(0, coordinates.length);
  const canAddSpot =
    isAdmin && Boolean(onAddSpot) && visibleParkings.length < coordinates.length;

  return (
    <div className="w-full flex flex-col items-center">
      <ZoomableParkingCanvas label={map?.imageAlt ?? "מפת החניון"}>
        <div
          className="relative w-full select-none overflow-hidden rounded-2xl border-2 border-outline-variant/30 bg-slate-900 shadow-2xl sm:rounded-3xl"
          style={{ aspectRatio: map?.aspectRatio ?? "1024 / 686" }}
        >
        <img
          src={map?.imageSrc}
          alt={map?.imageAlt ?? "מפת חניון"}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {coordinates.map((coord, index) => {
          const spot = visibleParkings[index];
          const isAddSlot = !spot && canAddSpot && index === visibleParkings.length;
          if (!spot && !isAddSlot) return null;

          const stallStyle = {
            position: "absolute",
            left: `${coord.x}%`,
            top: `${coord.y}%`,
            width: `${coord.width}%`,
            height: `${coord.height}%`,
            transform: coord.rotation ? `rotate(${coord.rotation}deg)` : undefined,
            transformOrigin: "center center",
          };
          const endLinePosition =
            coord.facing === "down" ? "bottom-[-2px]" : "top-[-2px]";

          if (isAddSlot) {
            return (
              <button
                key="parking-map-add-spot"
                type="button"
                onClick={onAddSpot}
                disabled={isAddingSpot}
                style={stallStyle}
                className="mediatheque-painted-stall flex items-center justify-center border-l-2 border-r-2 border-t-0 border-b-0 border-transparent rounded-none bg-primary/15 text-white hover:bg-primary/30 transition-colors duration-150 cursor-pointer disabled:cursor-wait disabled:opacity-50"
                title="הוסף חניה"
                aria-label="הוסף חניה"
              >
                <span className={`mediatheque-painted-stall-end-line ${endLinePosition}`} aria-hidden="true" />
                <span className="material-symbols-outlined relative z-10 text-[10px] sm:text-[clamp(12px,2vw,26px)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">add</span>
              </button>
            );
          }

          const isFree = spot.status === "free";
          const isBlocked = spot.status === "blocked" || spot.status === "block";
          const isOccupied = !isFree && !isBlocked;
          const carSrc = `/cars/${(index % 8) + 1}.png`;
          const displayedSpotNumber = map?.getDisplayedSpotNumber
            ? map.getDisplayedSpotNumber(spot, index)
            : spot.spotNumber;

          return (
            <div
              key={spot._id || `stall-${index}`}
              onClick={() => onSpotClick?.(spot)}
              style={stallStyle}
              className={`mediatheque-painted-stall flex flex-col items-center justify-between p-0.5 border-l-2 border-r-2 border-t-0 border-b-0 border-transparent rounded-none transition-colors duration-150 select-none ${isAdmin ? "cursor-pointer hover:bg-white/20 z-20" : ""} ${isBlocked ? "parking-slot-blocked-surface" : "bg-transparent"}`}
              title={`חניה ${displayedSpotNumber} (${isFree ? "פנויה" : isBlocked ? "חסומה" : "תפוסה"})`}
            >
              <span className={`mediatheque-painted-stall-end-line ${endLinePosition}`} aria-hidden="true" />
              <div className={`absolute right-0.5 left-0.5 z-20 flex items-center pointer-events-none ${coord.facing === "down" ? "bottom-0.5" : "top-0.5"}`}>
                <span className="text-[7px] sm:text-[9px] font-black leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">{displayedSpotNumber}</span>
              </div>
              {!isOccupied && (spot.type === "disabled" || spot.type === "dean") && (
                <div className="parking-spot-symbol-container absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
                  <span
                    className={`parking-asphalt-marking parking-spot-relative-symbol material-symbols-outlined ${spot.type === "disabled" ? "parking-asphalt-marking-disabled" : "parking-asphalt-marking-dean"} ${coord.facing === "down" ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    {spot.type === "disabled" ? "accessible" : "school"}
                  </span>
                </div>
              )}
              <div className="relative z-10 min-h-0 flex-1 w-full flex items-center justify-center pointer-events-none overflow-hidden">
                {isOccupied && (
                  <img
                    src={carSrc}
                    alt="רכב חונה"
                    className={`w-[85%] h-[92%] object-contain filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)] ${coord.facing === "down" ? "rotate-180" : ""}`}
                  />
                )}
                {isBlocked && <span className="parking-blocked-badge-icon material-symbols-outlined text-sm sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,1)] animate-pulse">block</span>}
              </div>
            </div>
          );
        })}
        </div>
      </ZoomableParkingCanvas>

      <div className="w-full mt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 px-2" dir="rtl">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full parking-legend-free-dot" /><span>פנוי</span></span>
          <span className="flex items-center gap-1.5"><span className="parking-blocked-badge-icon material-symbols-outlined text-sm">block</span><span>חסום</span></span>
          <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-blue-400 text-sm">accessible</span><span>נכה</span></span>
          <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-amber-500 text-sm">school</span><span>דיקן</span></span>
        </div>
      </div>
    </div>
  );
}
