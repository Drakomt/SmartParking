import { useState } from "react";
import ParkingLotView from "../components/ParkingLotView";
import useParkingLots from "../hooks/useParkingLots";
import SearchInput from "../components/SearchInput";

export default function ParkinLotPage() {
  const [parkings, setParkings] = useState(null);
  const [selectedCity, setSelectedCity] = useState("");

  const { parkingLotsCity, loading, error } = useParkingLots();

  const onBack = () => {
    setParkings(null);
  };

  const handleUpdateLocation = (spotsToLoad) => {
    setParkings(spotsToLoad);
  };

  const filteredLots =
    parkingLotsCity?.filter((lot) => lot.city === selectedCity) || [];

  if (loading) return <div>loading...</div>;
  if (error) return <div> Erorr: {error}</div>;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 font-sans"
      dir="rtl"
    >
      {parkings ? (
        <ParkingLotView parkings={parkings} onBack={onBack} />
      ) : (
        <div className="text-center p-8 sm:p-10 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-lg">
          <p className="text-lg text-slate-300 mb-8 font-medium">
            ברוכים הבאים למערכת ניהול החנייה החכמה. <br />
            אנא בחרו חניון רצוי:
          </p>

          <SearchInput onSearch={setSelectedCity} />

          {selectedCity && (
            <div className="w-full">
              {filteredLots.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {filteredLots
                    .filter((lot) => lot.city === selectedCity)
                    .map((lot) => (
                      <button
                        key={lot.lotId}
                        onClick={() => handleUpdateLocation(lot.spots)}
                        className="bg-slate-700 hover:bg-slate-600 transition-colors p-4 rounded-xl border border-slate-600 font-medium"
                      >
                        {lot.lotId}
                      </button>
                    ))}
                </div>
              ) : (
                <div className="bg-slate-700/40 border border-slate-600  rounded-xl p-6 text-center shadow-inner mt-4">
                  <p className="text-white-400 text-lg font-small mb-2">
                    העיר "{selectedCity}" לא נמצאה במאגר
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
