import { useState, useEffect } from "react";
import axios from "axios"; // היה חסר
import ParkingButton from "../components/ParkingButton";
import ParkingLotView from "../components/ParkingLotView";

export default function ParkinLotPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parkings, setParkings] = useState(null);
  const [selectedCity, setSelectedCity] = useState("חולון");

  const onBack = () => {
    setParkings(null);
  };

  const handleUpdateLocation = (spotsToLoad) => {
    setParkings(spotsToLoad);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/parkings/city");
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  let HITParkings = [
    { id: "A1", type: "regular", isAvilable: false },
    { id: "A2", type: "regular", isAvilable: true },
    { id: "A3", type: "disabled", isAvilable: false },
    { id: "A4", type: "regular", isAvilable: true },
    { id: "A5", type: "regular", isAvilable: false },
    { id: "A6", type: "disabled", isAvilable: true },
    { id: "A7", type: "regular", isAvilable: true },
    { id: "A8", type: "dean", isAvilable: false },
    { id: "A9", type: "disabled", isAvilable: true },
  ];
  let teheranParkings = [
    { id: "A1", type: "regular", isAvilable: false },
    { id: "A2", type: "regular", isAvilable: false },
    { id: "A3", type: "regular", isAvilable: false },
    { id: "A4", type: "dean", isAvilable: true },
    { id: "A5", type: "regular", isAvilable: false },
    { id: "A6", type: "disabled", isAvilable: true },
    { id: "A7", type: "regular", isAvilable: false },
    { id: "A8", type: "dean", isAvilable: false },
    { id: "A9", type: "disabled", isAvilable: true },
  ];

  let map = { HIT: HITParkings, טהרן: teheranParkings };

  if (isLoading) return <div>loading...</div>;

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

          <div className="grid grid-cols-2 gap-4">
            {data.filter((lot) => lot.city === selectedCity).map((lot) => (
                <ParkingButton key={lot.lotId} onClick={() => handleUpdateLocation(map[lot.lotId] || lot.spots)}>
                  {lot.lotId}
                </ParkingButton>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}