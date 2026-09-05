import LevelNavigation from "./LevelNavigation";
import DynamicParkingLayout from "./DynamicParkingLayout";
import { useState } from "react";
import SpotManagementModal from "./SpotManagementModal";
import axios from "axios";

export default function ParkingLotView({
  parkings,
  onBack,
  currentLevel,
  totalLevels,
  onLevelChange,
  lotName,
  lotLocation,
  isAdmin,
  lotId,
  onSpotsChanged,
}) {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isAddingSpot, setIsAddingSpot] = useState(false);

  const [randomCarIndexes] = useState(() => {
    return Array.from({ length: 16 }).map(
      () => Math.floor(Math.random() * 8) + 1,
    );
  });

  const isMediatheque =
    lotName &&
    (lotName.includes("מדיטק") ||
      lotName.toLowerCase().includes("mediatheque"));

  const handleSpotClick = (spot) => {
    if (!isAdmin || spot.isDummy) return;
    setSelectedSpot(spot);
  };

  const handleAddSpot = () => {
    if (!lotId) return;
    
    // Calculate next spot number automatically based on current level (e.g. 101, 102... or 201, 202...)
    const baseNumber = currentLevel * 100;
    let nextSpotNumber = baseNumber + 1;
    if (parkings && parkings.length > 0) {
      const levelSpots = parkings
        .map(p => Number(p.spotNumber) || 0)
        .filter(num => num >= baseNumber && num < (currentLevel + 1) * 100);
      
      if (levelSpots.length > 0) {
        nextSpotNumber = Math.max(...levelSpots) + 1;
      }
    }

    setSelectedSpot({ 
      isNew: true, 
      status: "free", 
      type: "regular", 
      level: currentLevel,
      spotNumber: nextSpotNumber
    });
  };

  // Add / Delete Level states
  const [isAddLevelModalOpen, setIsAddLevelModalOpen] = useState(false);
  const [newLevelSpotsCount, setNewLevelSpotsCount] = useState(16);
  const [isCreatingLevel, setIsCreatingLevel] = useState(false);
  const [addLevelError, setAddLevelError] = useState(null);

  const [isDeleteLevelModalOpen, setIsDeleteLevelModalOpen] = useState(false);
  const [isDeletingLevel, setIsDeletingLevel] = useState(false);
  const [deleteLevelError, setDeleteLevelError] = useState(null);

  const handleAddLevel = async (e) => {
    e.preventDefault();
    if (!lotId) return;

    const spotsCount = Number(newLevelSpotsCount);
    if (!spotsCount || spotsCount < 1 || spotsCount > 32) {
      setAddLevelError("כמות חניות למפלס חייבת להיות בין 1 ל-32.");
      return;
    }

    setIsCreatingLevel(true);
    setAddLevelError(null);

    try {
      const nextLevelNum = (totalLevels || 1) + 1;

      // 1. Update parking lot with new level count
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/parking/${lotId}`,
        { levels: nextLevelNum },
        { withCredentials: true }
      );

      // 2. Create the spots for the new level
      const spotPromises = [];
      for (let i = 1; i <= spotsCount; i++) {
        spotPromises.push(
          axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/parking/${lotId}/spots`,
            {
              spotNumber: nextLevelNum * 100 + i,
              level: nextLevelNum,
              status: "free",
              type: "regular",
            },
            { withCredentials: true }
          )
        );
      }

      await Promise.all(spotPromises);

      // 3. Switch to the new level and refresh data
      setIsAddLevelModalOpen(false);
      if (onSpotsChanged) {
        onSpotsChanged(nextLevelNum);
      } else if (onLevelChange) {
        onLevelChange(nextLevelNum);
      }
    } catch (err) {
      console.error("Failed to add level", err);
      setAddLevelError(err.response?.data?.message || err.message || "שגיאה בהוספת המפלס");
    } finally {
      setIsCreatingLevel(false);
    }
  };

  const handleDeleteLevel = async () => {
    if (!lotId || totalLevels <= 1) return;

    setIsDeletingLevel(true);
    setDeleteLevelError(null);

    try {
      const lastLevelNum = totalLevels;

      // 1. Fetch all spots on the LAST level to make sure we delete them all
      const lastLevelSpotsRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/parking/${lotId}/spots`,
        { params: { level: lastLevelNum } }
      );
      const spotsToDelete = lastLevelSpotsRes.data?.slots || (currentLevel === lastLevelNum ? parkings : []) || [];

      // 2. Delete each spot on the last level
      if (spotsToDelete.length > 0) {
        await Promise.all(
          spotsToDelete.map((s) =>
            axios.delete(
              `${import.meta.env.VITE_API_BASE_URL}/api/parking/spots/${s._id}`,
              { withCredentials: true }
            )
          )
        );
      }

      // 3. Update parking lot with decremented levels count
      const updatedTotalLevels = totalLevels - 1;
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/parking/${lotId}`,
        { levels: updatedTotalLevels },
        { withCredentials: true }
      );

      // 4. Switch to valid level and refresh data immediately
      setIsDeleteLevelModalOpen(false);
      const targetLevel = currentLevel >= lastLevelNum ? updatedTotalLevels : currentLevel;
      if (onSpotsChanged) {
        onSpotsChanged(targetLevel);
      } else if (onLevelChange) {
        onLevelChange(targetLevel);
      }
    } catch (err) {
      console.error("Failed to delete level", err);
      setDeleteLevelError(err.response?.data?.message || err.message || "שגיאה במחיקת המפלס");
    } finally {
      setIsDeletingLevel(false);
    }
  };

  return (
    <div
      className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] border border-outline-variant/20 w-full mx-auto mt-6 max-w-5xl"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <button
            onClick={onBack}
            className="cursor-pointer px-4 sm:px-5 py-2 bg-transparent border border-outline-variant/50 hover:border-primary hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-xl transition-all duration-300 font-medium z-10"
          >
            חזור
          </button>

          {isAdmin && isMediatheque && (
            <button
              onClick={handleAddSpot}
              disabled={isAddingSpot}
              className="cursor-pointer px-4 sm:px-5 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary border border-primary/20 rounded-xl transition-all duration-300 font-medium z-10 flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              הוסף חניה
            </button>
          )}

          {/* Mobile Waze button (visible only on small screens) */}
          {!isAdmin && lotLocation?.lat && lotLocation?.lng && (
            <button
              onClick={() => {
                window.open(`https://waze.com/ul?ll=${lotLocation.lat},${lotLocation.lng}&navigate=yes`, '_blank');
              }}
              className="sm:hidden cursor-pointer p-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-xl transition-all duration-300 font-medium z-10 flex items-center justify-center"
            >
              <i className="fa-brands fa-waze text-lg"></i>
            </button>
          )}
        </div>

        {!isAdmin && lotLocation?.lat && lotLocation?.lng ? (
          <button
            onClick={() => {
              window.open(`https://waze.com/ul?ll=${lotLocation.lat},${lotLocation.lng}&navigate=yes`, '_blank');
            }}
            className="hidden sm:flex cursor-pointer px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-xl transition-all duration-300 font-medium z-10 items-center gap-2"
          >
            <i className="fa-brands fa-waze text-lg"></i>
            נווט לחניון
          </button>
        ) : (
          <div className="hidden sm:block w-[140px]"></div>
        )}
      </div>

      {lotName && (
        <h2 className="text-3xl sm:text-4xl font-black text-center text-primary mb-8 drop-shadow-sm" dir="rtl">
          {lotName}
        </h2>
      )}

      {!parkings || parkings.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-center text-on-surface-variant text-lg font-bold">
            אין מידע על חניות במפלס זה
          </p>
        </div>
      ) : isMediatheque ? (
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-[1.8/1] rounded-2xl overflow-hidden border-2 border-outline-variant/30 shadow-inner bg-surface-container">
            <img
              src="/parking-bg.jpg"
              alt="Parking Background"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            <div
              className="absolute inset-0 px-[2%] py-[3%] grid grid-cols-8 grid-rows-2"
              dir="ltr"
            >
              {Array.from({ length: 16 }).map((_, index) => {
                const slot = parkings[index] || {
                  _id: `dummy-${index}`,
                  status: "occupied",
                  isDummy: true,
                };
                const carImageIndex = randomCarIndexes[index];

                let typeIcon = null;
                let badge = null;
                const isOccupied =
                  slot.status !== "free" && slot.status !== "blocked";
                const svgClass = "w-10 h-10 sm:w-14 sm:h-14 opacity-90 drop-shadow-md";

                if (slot.type === "disabled") {
                  if (isOccupied) {
                    badge = (
                      <div className="absolute bottom-0 right-0 bg-blue-500 text-white px-1 py-0.5 rounded-tl-lg shadow-sm z-30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">accessible</span>
                      </div>
                    );
                  } else {
                    typeIcon = (
                      <svg
                        className={`${svgClass} text-blue-500`}
                        fill="currentColor"
                        viewBox="0 0 512 512"
                      >
                        <circle cx="221.912" cy="66.088" r="34.088" />
                        <path d="m460.12 360.478l-47.943 11.985L393 282.971A24.126 24.126 0 0 0 369.533 264h-88.705l-6.462-56H384v-32H270.674l-4.134-35.826a24 24 0 0 0-26.593-21.091l-39.736 4.585L220.1 296h142.97l24.758 115.537l80.057-20.015Z" />
                        <path d="M224 448a120 120 0 0 1-45.248-231.135l-3.779-32.75C115.143 204.558 72 261.334 72 328c0 83.813 68.187 152 152 152a152.06 152.06 0 0 0 130.044-73.378L344 360c-16 48-61.4 88-120 88" />
                      </svg>
                    );
                  }
                } else if (slot.type === "dean") {
                  if (isOccupied) {
                    badge = (
                      <div className="absolute bottom-0 right-0 bg-black text-white px-1 py-0.5 rounded-tl-lg shadow-sm z-30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">school</span>
                      </div>
                    );
                  } else {
                    typeIcon = (
                      <svg
                        className={`${svgClass} text-black`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 14.72l5-2.45v3.72z" />
                      </svg>
                    );
                  }
                }

                return (
                  <div
                    key={slot._id}
                    onClick={() => handleSpotClick(slot)}
                    className={`relative w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 ${isAdmin && !slot.isDummy ? "cursor-pointer hover:bg-slate-700/40 hover:ring-2 hover:ring-primary transition-all" : ""} rounded-md`}
                  >
                    {badge}
                    {typeIcon && slot.status === "free" && (
                      <div className="absolute inset-0 pointer-events-none z-10 flex justify-center items-center transition-all duration-300">
                        {typeIcon}
                      </div>
                    )}

                    {slot.status === "blocked" ? (
                      <>
                        <span className="parking-blocked-icon absolute inset-0 flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-20 pointer-events-none">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "48px" }}
                          >
                            block
                          </span>
                        </span>
                      <span className="parking-blocked-label absolute bottom-5 sm:bottom-7 text-sm sm:text-lg font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] z-10">
                        חסום
                      </span>
                    </>
                  ) : slot.status === "free" ? (
                      <span className="parking-slot-free-label absolute bottom-5 sm:bottom-7 text-sm sm:text-lg font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] z-10">
                        פנוי
                      </span>
                    ) : (
                      <img
                        src={`/cars/${carImageIndex}.png`}
                        alt="Parked car"
                        className="relative z-20 w-[70%] h-[80%] object-contain"
                        style={{ mixBlendMode: "multiply" }}
                      />
                    )}

                    {!slot.isDummy && (
                      <span className="absolute bottom-1 sm:bottom-2 text-xs sm:text-sm font-bold text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10">
                        {slot.spotNumber}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <DynamicParkingLayout
          parkings={parkings}
          isAdmin={isAdmin}
          onSpotClick={handleSpotClick}
          onAddSpot={handleAddSpot}
          isAddingSpot={isAddingSpot}
        />
      )}

      <div
        className="mt-8 relative flex flex-col md:flex-row items-center justify-center gap-4 w-full border-t border-outline-variant/20 pt-6 min-h-[52px]"
        dir="rtl"
      >
        {/* Right side: Add Level Button */}
        {isAdmin && (
          <div className="flex items-center md:absolute md:right-0">
            <button
              onClick={() => {
                setAddLevelError(null);
                setNewLevelSpotsCount(16);
                setIsAddLevelModalOpen(true);
              }}
              className="cursor-pointer px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary border border-primary/20 rounded-xl transition-all duration-300 font-bold text-sm flex items-center gap-1.5 shadow-sm"
              title="הוסף מפלס חדש לחניון"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              הוסף מפלס חדש
            </button>
          </div>
        )}

        {/* Center: LevelNavigation */}
        <div className="flex justify-center">
          <LevelNavigation
            currentLevel={currentLevel}
            totalLevels={totalLevels}
            onLevelChange={onLevelChange}
          />
        </div>

        {/* Left side: Delete Level Button */}
        {isAdmin && totalLevels > 1 && (
          <div className="flex items-center md:absolute md:left-0">
            <button
              onClick={() => {
                setDeleteLevelError(null);
                setIsDeleteLevelModalOpen(true);
              }}
              className="cursor-pointer px-4 py-2 bg-error/10 text-error hover:bg-error hover:!text-white border border-error/20 rounded-xl transition-all duration-300 font-bold text-sm flex items-center gap-1.5 shadow-sm"
              title="מחיקת מפלס אחרון"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              מחיקת מפלס אחרון
            </button>
          </div>
        )}
      </div>

      {selectedSpot && (
        <SpotManagementModal
          spot={selectedSpot}
          lotId={lotId}
          onClose={() => setSelectedSpot(null)}
          onUpdate={() => {
            if (onSpotsChanged) onSpotsChanged();
          }}
        />
      )}

      {/* Add Level Modal */}
      {isAddLevelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl border border-outline-variant/20 relative">
            <button
              onClick={() => setIsAddLevelModalOpen(false)}
              disabled={isCreatingLevel}
              className="absolute top-4 left-4 text-2xl text-on-surface-variant hover:text-error transition-colors"
            >
              &times;
            </button>

            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">add_circle</span>
              <h3 className="text-2xl font-black">הוספת מפלס חדש</h3>
            </div>

            <p className="text-sm text-on-surface-variant mb-6">
              ייווצר <strong>מפלס {(totalLevels || 1) + 1}</strong> חדש בחניון זה.
            </p>

            {addLevelError && (
              <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-sm font-bold flex items-center gap-2 border border-error/20">
                <span className="material-symbols-outlined text-base">error</span>
                {addLevelError}
              </div>
            )}

            <form onSubmit={handleAddLevel} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">
                  כמה חניות יהיו במפלס החדש?
                </label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  required
                  value={newLevelSpotsCount}
                  onChange={(e) => setNewLevelSpotsCount(e.target.value)}
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold text-lg"
                />
                <span className="text-xs text-on-surface-variant mt-1.5 block">
                  מספרי החניות שיווצרו: {((totalLevels || 1) + 1) * 100 + 1} עד {((totalLevels || 1) + 1) * 100 + (Number(newLevelSpotsCount) || 1)} (עד 32 חניות למפלס)
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddLevelModalOpen(false)}
                  disabled={isCreatingLevel}
                  className="flex-1 py-3 rounded-xl font-bold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLevel}
                  className="flex-1 py-3 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreatingLevel ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      יוצר מפלס...
                    </>
                  ) : (
                    "צור מפלס"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Level Modal */}
      {isDeleteLevelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl border border-outline-variant/20 relative text-center">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">delete_sweep</span>
            </div>

            <h3 className="text-2xl font-black text-on-surface mb-2">
              מחיקת מפלס {totalLevels} (מפלס עליון)
            </h3>

            <p className="text-sm text-on-surface-variant mb-6">
              האם אתה בטוח שברצונך למחוק לצמיתות את <strong>מפלס {totalLevels} (המפלס העליון)</strong>?<br/>
              כל החניות במפלס זה יימחקו, וכמות המפלסים בחניון תרד ל-<strong>{totalLevels - 1}</strong>.
            </p>

            {deleteLevelError && (
              <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-sm font-bold flex items-center gap-2 border border-error/20 text-right">
                <span className="material-symbols-outlined text-base">error</span>
                {deleteLevelError}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setIsDeleteLevelModalOpen(false)}
                disabled={isDeletingLevel}
                className="flex-1 py-3 rounded-xl font-bold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleDeleteLevel}
                disabled={isDeletingLevel}
                className="flex-1 py-3 rounded-xl font-bold bg-error text-white hover:bg-error/90 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingLevel ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    מוחק מפלס...
                  </>
                ) : (
                  `כן, מחק מפלס ${totalLevels}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
