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
      await api.put(`/api/parking/${lotId}`, { levels: nextLevelNum });

      // 2. Create the spots for the new level
      const spotPromises = [];
      for (let i = 1; i <= spotsCount; i++) {
        spotPromises.push(
          api.post(
            `/api/parking/${lotId}/spots`,
            {
              spotNumber: nextLevelNum * 100 + i,
              level: nextLevelNum,
              status: "free",
              type: "regular",
            },
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
      const lastLevelSpotsRes = await api.get(`/api/parking/${lotId}/spots`, {
        params: { level: lastLevelNum },
      });
      const spotsToDelete = lastLevelSpotsRes.data?.slots || (currentLevel === lastLevelNum ? parkings : []) || [];

      // 2. Delete each spot on the last level
      if (spotsToDelete.length > 0) {
        await Promise.all(
          spotsToDelete.map((s) =>
            api.delete(`/api/parking/spots/${s._id}`)
          )
        );
      }

      // 3. Update parking lot with decremented levels count
      const updatedTotalLevels = totalLevels - 1;
      await api.put(`/api/parking/${lotId}`, { levels: updatedTotalLevels });

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
        <h2 className="text-3xl sm:text-4xl font-black text-center text-primary mb-6 drop-shadow-sm" dir="rtl">
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
