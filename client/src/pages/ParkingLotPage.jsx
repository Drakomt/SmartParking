import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ParkingLotView from "../components/ParkingLotView";
import useParkingData from "../hooks/useParkingData";
import api from "../lib/api";

export default function ParkingLotPage() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const [parkingLot, setParkingLot] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [lotError, setLotError] = useState(null);
  const [isLoadingLot, setIsLoadingLot] = useState(true);

  const {
    parkings,
    totalLevels,
    isLoading: isLoadingSpots,
    error: spotsError,
    refreshData,
  } = useParkingData(lotId, currentLevel, parkingLot?.city?.name);

  useEffect(() => {
    let cancelled = false;

    const loadParkingLot = async () => {
      setIsLoadingLot(true);
      setLotError(null);
      try {
        const response = await api.get("/api/parking/parkinglotbyid", {
          params: { id: lotId },
        });
        if (!cancelled) setParkingLot(response.data);
      } catch (error) {
        if (!cancelled) {
          setLotError(error.response?.data?.message || "לא הצלחנו לטעון את החניון.");
        }
      } finally {
        if (!cancelled) setIsLoadingLot(false);
      }
    };

    loadParkingLot();
    return () => {
      cancelled = true;
    };
  }, [lotId]);

  const handleBack = () => navigate("/all-lots");
  const isLoading = isLoadingLot || isLoadingSpots;
  const error = lotError || spotsError;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col items-center px-3 pb-8 pt-20 sm:px-6 sm:pt-24">
      {isLoading ? (
        <div className="mt-8 w-full max-w-lg rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 text-center shadow-xl" role="status">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg text-primary">טוען נתוני חניון...</p>
        </div>
      ) : error || !parkingLot ? (
        <div className="mt-8 w-full max-w-lg rounded-3xl border border-error/50 bg-error-container p-8 text-center shadow-xl" role="alert">
          <p className="mb-5 text-lg text-on-error-container">{error || "החניון לא נמצא."}</p>
          <button
            type="button"
            onClick={handleBack}
            className="min-h-11 cursor-pointer rounded-xl border border-error px-5 py-2 font-bold text-error transition-colors hover:bg-error/10"
          >
            חזרה לכל החניונים
          </button>
        </div>
      ) : (
        <ParkingLotView
          parkings={parkings}
          onBack={handleBack}
          currentLevel={currentLevel}
          totalLevels={totalLevels}
          onLevelChange={setCurrentLevel}
          lotName={parkingLot.name}
          lotLocation={parkingLot.location}
          isAdmin={false}
          lotId={lotId}
          onSpotsChanged={(targetLevel) => {
            if (targetLevel !== undefined) setCurrentLevel(targetLevel);
            refreshData(targetLevel);
          }}
        />
      )}
    </main>
  );
}
