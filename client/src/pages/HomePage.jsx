import { useState } from "react";
import ParkingLotView from "../components/ParkingLotView";
import useParkingLots from "../hooks/useParkingLots";
import SearchInput from "../components/SearchInput";
import useCities from "../hooks/useCities";
import useParkingData from "../hooks/useParkingData";

export default function HomePage() {
  const [submittedCity, setSubmittedCity] = useState("");
  const { parkingLotsCity, loading, error } = useParkingLots(submittedCity);
  const citiesInDatabase = useCities();

  const [selectedParkingLotId, setSelectedParkingLotId] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);

  const { 
    parkings, 
    totalLevels, 
    isLoading: isLoadingSlots, 
    error: slotsError 
  } = useParkingData(selectedParkingLotId, currentLevel);

  const onBack = () => {
    setSelectedParkingLotId(null);
    setCurrentLevel(1); 
  };

  const handleUpdateLocation = (lotId) => {
    setSelectedParkingLotId(lotId);
    setCurrentLevel(1); 
  };
  console.log(parkings);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 font-sans" dir="rtl">
      
      {selectedParkingLotId ? (
        <div className="w-full flex flex-col items-center">
          {isLoadingSlots ? (
            <div className="text-center p-8 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-lg mt-6">
               <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-sky-400 text-lg">טוען נתוני חניון...</p>
            </div>
          ) : slotsError ? (
            <div className="text-center p-8 bg-slate-800 rounded-3xl shadow-2xl border border-red-500/50 w-full max-w-lg mt-6">
              <p className="text-red-400 text-lg mb-4">שגיאה: {slotsError}</p>
              <button onClick={onBack} className="px-5 py-2 border border-slate-600 hover:bg-slate-700 rounded-xl transition-all">
                חזור
              </button>
            </div>
          ) : (
            <ParkingLotView 
              parkings={parkings} 
              onBack={onBack} 
              currentLevel={currentLevel}
              totalLevels={totalLevels}
              onLevelChange={setCurrentLevel}
            />
          )}
        </div>
      ) : (
        <div className="text-center p-8 sm:p-10 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-lg min-h-[320px] flex flex-col items-center">
          <p className="text-lg text-slate-300 mb-8 font-medium">
            ברוכים הבאים למערכת ניהול החנייה החכמה. <br />
            אנא בחרו חניון רצוי:
          </p>

          <div className="w-full">
            <SearchInput 
              onSearch={(city) => setSubmittedCity(city)} 
              availableCities={citiesInDatabase}
            />

            {submittedCity && loading && <div className="text-sky-400 mb-4">מחפש חניונים ב{submittedCity}...</div>}
            {submittedCity && error && <div className="text-red-400 mb-4">שגיאה: {error}</div>}

            {submittedCity && !loading && parkingLotsCity && parkingLotsCity.length > 0 ? (
              <div className="grid grid-rows-3 gap-4 mt-4 w-full">
                {parkingLotsCity.map((lot) => (
                  <button
                    key={lot._id}
                    onClick={() => handleUpdateLocation(lot._id)}
                    className="cursor-pointer bg-slate-700 hover:bg-slate-600 transition-colors p-3 rounded-xl border border-slate-600 font-medium text-lg w-full text-right"
                  >
                    {lot.name}
                  </button>
                ))}
              </div>
            ) : (
              submittedCity && !loading && (
                <div className="bg-slate-700/40 border border-slate-600 rounded-xl p-6 text-center shadow-inner mt-4">
                  <p className="text-slate-300 text-lg mb-2">
                    לא נמצאו חניונים בעיר "{submittedCity}"
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}