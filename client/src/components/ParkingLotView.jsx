import LevelNavigation from "./LevelNavigation";
import DynamicParkingLayout from "./DynamicParkingLayout";
import MediathequeParkingLayout from "./parking-maps/MediathequeParkingLayout";
import HaifaPortParkingLayout from "./parking-maps/HaifaPortParkingLayout";
import BeershebaCenterParkingLayout from "./parking-maps/BeershebaCenterParkingLayout";
import { getParkingLayout, PARKING_LAYOUT } from "./parking-maps/parkingLayoutRegistry";
import { useState } from "react";
import SpotManagementModal from "./SpotManagementModal";
import api from "../lib/api";

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
  const isAddingSpot = false;

  const parkingLayout = getParkingLayout(lotName);
  const isImageMapLot = Boolean(parkingLayout);

  const handleSpotClick = (spot) => {
    if (!isAdmin || spot.isDummy) return;
    setSelectedSpot(spot);
  };

  const handleAddSpot = () => {
    if (!lotId) return;
    if (parkingLayout && parkings?.length >= parkingLayout.capacity) return;
    
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
      await api.post(`/api/parking/${lotId}/levels`, { spotCount: spotsCount });

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
      await api.delete(`/api/parking/${lotId}/levels/${lastLevelNum}`);
      const updatedTotalLevels = totalLevels - 1;
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
      className="mx-auto mt-2 w-full max-w-5xl rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-3 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] sm:mt-6 sm:rounded-3xl sm:p-8"
    >
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-8 sm:gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <button
            onClick={onBack}
            className="z-10 min-h-11 cursor-pointer rounded-xl border border-outline-variant/50 bg-transparent px-4 py-2 font-medium text-on-surface-variant transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary sm:px-5"
          >
            חזור
          </button>

          {!isAdmin && lotLocation?.lat && lotLocation?.lng && (
            <button
              onClick={() => {
                window.open(`https://waze.com/ul?ll=${lotLocation.lat},${lotLocation.lng}&navigate=yes`, '_blank');
              }}
              className="z-10 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl bg-primary/10 p-2 font-medium text-primary transition-colors hover:bg-primary hover:text-on-primary sm:hidden"
              aria-label="ניווט לחניון ב-Waze"
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
        <h2 className="mb-5 text-center text-2xl font-black text-primary drop-shadow-sm sm:mb-6 sm:text-4xl" dir="rtl">
          {lotName}
        </h2>
      )}

      {(!parkings || parkings.length === 0) && !(isImageMapLot && isAdmin) ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-center text-on-surface-variant text-lg font-bold">
            אין מידע על חניות במפלס זה
          </p>
        </div>
      ) : parkingLayout?.layout === PARKING_LAYOUT.MEDIATHEQUE ? (
        <MediathequeParkingLayout
          parkings={parkings}
          isAdmin={isAdmin}
          onSpotClick={handleSpotClick}
          onAddSpot={handleAddSpot}
          isAddingSpot={isAddingSpot}
        />
      ) : parkingLayout?.layout === PARKING_LAYOUT.HAIFA_PORT ? (
        <HaifaPortParkingLayout
          parkings={parkings}
          isAdmin={isAdmin}
          onSpotClick={handleSpotClick}
          onAddSpot={handleAddSpot}
          isAddingSpot={isAddingSpot}
        />
      ) : parkingLayout?.layout === PARKING_LAYOUT.BEERSHEBA_CENTER ? (
        <BeershebaCenterParkingLayout
          parkings={parkings}
          isAdmin={isAdmin}
          onSpotClick={handleSpotClick}
          onAddSpot={handleAddSpot}
          isAddingSpot={isAddingSpot}
        />
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
        className="relative mt-6 flex min-h-[52px] w-full flex-col items-stretch justify-center gap-3 border-t border-outline-variant/20 pt-5 sm:mt-8 md:flex-row md:items-center md:gap-4 md:pt-6"
        dir="rtl"
      >
        {isAdmin && (
          <div className="flex items-center md:absolute md:right-0">
            <button
              onClick={() => {
                setAddLevelError(null);
                setNewLevelSpotsCount(16);
                setIsAddLevelModalOpen(true);
              }}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-on-primary md:w-auto"
              title="הוסף מפלס חדש לחניון"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              הוסף מפלס חדש
            </button>
          </div>
        )}

          <div className="flex max-w-full justify-center overflow-hidden">
          <LevelNavigation
            currentLevel={currentLevel}
            totalLevels={totalLevels}
            onLevelChange={onLevelChange}
          />
        </div>

        {isAdmin && totalLevels > 1 && (
          <div className="flex items-center md:absolute md:left-0">
            <button
              onClick={() => {
                setDeleteLevelError(null);
                setIsDeleteLevelModalOpen(true);
              }}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-error/20 bg-error/10 px-4 py-2 text-sm font-bold text-error shadow-sm transition-colors hover:bg-error hover:!text-white md:w-auto"
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

      {isAddLevelModalOpen && (
        <div className="mobile-sheet-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
          <section className="mobile-sheet relative w-full max-w-md rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="add-level-title">
            <button
              type="button"
              onClick={() => setIsAddLevelModalOpen(false)}
              disabled={isCreatingLevel}
              className="absolute left-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error"
              aria-label="סגירת חלון הוספת המפלס"
            >
              &times;
            </button>

            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">add_circle</span>
              <h3 id="add-level-title" className="text-xl font-black sm:text-2xl">הוספת מפלס חדש</h3>
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

              <div className="flex flex-col-reverse gap-3 pt-4 min-[360px]:flex-row">
                <button
                  type="button"
                  onClick={() => setIsAddLevelModalOpen(false)}
                  disabled={isCreatingLevel}
                  className="min-h-12 flex-1 rounded-xl border border-outline-variant py-3 font-bold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLevel}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-on-primary shadow-md transition-colors hover:bg-primary/90 disabled:opacity-50"
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
          </section>
        </div>
      )}

      {isDeleteLevelModalOpen && (
        <div className="mobile-sheet-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
          <section className="mobile-sheet relative w-full max-w-md rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 text-center shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="delete-level-title">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">delete_sweep</span>
            </div>

            <h3 id="delete-level-title" className="mb-2 text-xl font-black text-on-surface sm:text-2xl">
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

            <div className="flex flex-col-reverse justify-center gap-3 min-[360px]:flex-row">
              <button
                type="button"
                onClick={() => setIsDeleteLevelModalOpen(false)}
                disabled={isDeletingLevel}
                className="min-h-12 flex-1 rounded-xl border border-outline-variant py-3 font-bold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleDeleteLevel}
                disabled={isDeletingLevel}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-error py-3 font-bold text-white shadow-md transition-colors hover:bg-error/90 disabled:opacity-50"
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
          </section>
        </div>
      )}
    </div>
  );
}
