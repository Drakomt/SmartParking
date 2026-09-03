import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useNavigate, useLocation } from "react-router-dom";
import CarsModal from "../components/CarsModal";
import EditLotModal from "../components/EditLotModal";
import AuthorizedVehiclesModal from "../components/AuthorizedVehiclesModal";
import AddParkingLotModal from "../components/AddParkingLotModal";

export default function Dashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [parkingLots, setParkingLots] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingLot, setEditingLot] = useState(null);
  const [authorizedVehiclesLot, setAuthorizedVehiclesLot] = useState(null);
  const [lotToDelete, setLotToDelete] = useState(null);
  const [isDeletingLot, setIsDeletingLot] = useState(false);
  const [isAddingLot, setIsAddingLot] = useState(false);

  const [showCars, setShowCars] = useState(false);
  const [selectedLotNameForCars, setSelectedLotNameForCars] = useState("");

  const [selectedCityId, setSelectedCityId] = useState(
    location.state?.selectedCityId || null,
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [citiesRes, lotsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/parking/authorized/cities`, {
            withCredentials: true,
          }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/parking/authorized/lots`, {
            withCredentials: true,
          }),
        ]);
        setCities(citiesRes.data);
        setParkingLots(lotsRes.data);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
        setError("שגיאה בטעינת הנתונים.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !socket) return;

    const handleSpotUpdated = (updatedSpot) => {
      setParkingLots((prevLots) =>
        prevLots.map((lot) => {
          if (lot._id !== updatedSpot.parkingLot) return lot;
          return {
            ...lot,
            spots: lot.spots.map((spot) =>
              spot._id === updatedSpot._id ? updatedSpot : spot,
            ),
          };
        }),
      );
    };

    const handleSessionUpdated = (updatedSession) => {
      setParkingLots((prevLots) =>
        prevLots.map((lot) => {
          if (lot._id !== updatedSession.parkingLot) return lot;

          let sessions = lot.sessions || [];
          const sessionExists = sessions.some(
            (s) => s._id === updatedSession._id,
          );

          if (sessionExists) {
            sessions = sessions.map((s) =>
              s._id === updatedSession._id ? updatedSession : s,
            );
          } else {
            sessions = [...sessions, updatedSession];
          }

          return { ...lot, sessions };
        }),
      );
    };

    socket.on("parking-spot-updated", handleSpotUpdated);
    socket.on("parking-session-updated", handleSessionUpdated);
    return () => {
      socket.off("parking-spot-updated", handleSpotUpdated);
      socket.off("parking-session-updated", handleSessionUpdated);
    };
  }, [user, socket]);

  const handleSaveLotSubmit = async (lotId, formData) => {
    await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/api/parking/${lotId}`,
      formData,
      {
        withCredentials: true,
      },
    );
    setParkingLots((prev) =>
      prev.map((lot) =>
        lot._id === lotId ? { ...lot, ...formData } : lot,
      ),
    );
  };

  const executeDeleteLot = async () => {
    if (!lotToDelete) return;
    setIsDeletingLot(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/parking/${lotToDelete._id}`, {
        withCredentials: true,
      });
      setParkingLots(prev => prev.filter(l => l._id !== lotToDelete._id));
      setLotToDelete(null);
    } catch (err) {
      console.error("Failed to delete parking lot", err);
      alert("שגיאה במחיקת החניון. ייתכן ואין לך הרשאות.");
    } finally {
      setIsDeletingLot(false);
    }
  };

  const handleCreateLot = async (lotPayload, levelsDistribution) => {
    // 1. Create the lot
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/parking/`,
      lotPayload,
      { withCredentials: true }
    );
    const newLot = res.data;

    // 2. Loop through levels and create spots
    const spotPromises = [];
    for (const [levelStr, numSpots] of Object.entries(levelsDistribution)) {
      const levelNum = Number(levelStr);
      for (let i = 1; i <= numSpots; i++) {
        spotPromises.push(
          axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/parking/${newLot._id}/spots`,
            {
              spotNumber: i,
              level: levelNum,
              isAvailable: true,
            },
            { withCredentials: true }
          )
        );
      }
    }

    // Wait for all spots to be created
    if (spotPromises.length > 0) {
      await Promise.all(spotPromises);
    }

    // Fetch the updated lot with all spots populated
    const updatedLotRes = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/parking/parkinglotbyid?id=${newLot._id}`,
      { withCredentials: true }
    );

    setParkingLots(prev => [...prev, updatedLotRes.data]);
  };

  const loadCarsForLot = (lot) => {
    if (!lot.sessions) {
      alert(
        "הנתונים המלאים של החניון טרם נטענו מהשרת, או שקיימת שגיאה. אנא ודא שהשרת התרפרש ושאין בו שגיאות.",
      );
      return;
    }
    setSelectedLotNameForCars(lot.name);
    setShowCars(true);
  };

  const getLotPricingLabel = (lot) => {
    const pricing = lot.pricing ?? {};
    if (pricing.isFree) return "חינם";
    if (Number(pricing.pricePerMinute) > 0) {
      return `${Number(pricing.pricePerMinute).toLocaleString("he-IL", { maximumFractionDigits: 2 })} ₪ לדקה`;
    }
    if (Number(pricing.parkingFeeMinor) > 0) {
      return `${(Number(pricing.parkingFeeMinor) / 100).toLocaleString("he-IL", { maximumFractionDigits: 2 })} ₪`;
    }
    return "לא הוגדר";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen pt-16">
        טוען נתונים...
      </div>
    );
  }

  const getCityName = (cityId) => {
    const city = cities.find((c) => c._id === cityId);
    return city ? city.name : cityId;
  };

  const lotsToDisplay = selectedCityId
    ? parkingLots.filter((lot) => {
        const lotCityId = typeof lot.city === 'object' && lot.city !== null ? lot.city._id : lot.city;
        return lotCityId === selectedCityId;
      })
    : [];

  const selectedCityName = selectedCityId ? getCityName(selectedCityId) : "";

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-6xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-primary">
          אזור אישי - מנהל מערכת
        </h1>
      </div>

      <div className="mb-8 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm">
        <h2 className="text-xl font-bold mb-2">שלום</h2>
        <p className="text-on-surface-variant">
          הערים שבאחריותך:{" "}
          {cities.map((c) => c.name).join(", ") || "אין ערים מוגדרות"}
        </p>
      </div>

      {!selectedCityId ? (
        <>
          <h3 className="text-2xl font-bold mb-4">בחר עיר לניהול</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cities.map((city) => {
              const cityLotsCount = parkingLots.filter((lot) => {
                const lotCityId = typeof lot.city === 'object' && lot.city !== null ? lot.city._id : lot.city;
                return lotCityId === city._id;
              }).length;
              return (
                <div
                  key={city._id}
                  onClick={() => setSelectedCityId(city._id)}
                  className="bg-surface-container-lowest p-8 rounded-2xl shadow border border-outline-variant/30 hover:border-primary hover:shadow-md cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-4xl text-primary">
                    location_city
                  </span>
                  <h4 className="text-2xl font-bold text-on-surface">
                    {city.name}
                  </h4>
                  <p className="text-on-surface-variant">
                    {cityLotsCount} חניונים
                  </p>
                </div>
              );
            })}
            {cities.length === 0 && (
              <p className="text-on-surface-variant">לא נמצאו ערים באחריותך.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedCityId(null)}
              className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex items-center justify-center"
              title="חזור לרשימת הערים"
            >
              <span
                className="material-symbols-outlined"
                style={{ transform: "rotate(180deg)" }}
              >
                arrow_back
              </span>
            </button>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">
                ניהול חניונים - {selectedCityName}
              </h3>
            </div>
            <button
              onClick={() => setIsAddingLot(true)}
              className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined">add</span>
              הוסף חניון
            </button>
          </div>

          {error && <p className="text-error">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lotsToDisplay.map((lot) => (
              <div
                key={lot._id}
                className="bg-surface-container-lowest p-6 rounded-2xl shadow border border-outline-variant/30 hover:border-primary transition-all relative flex flex-col h-full"
              >
                <div className="absolute top-4 left-4 flex gap-2">
                  <button
                    onClick={() => setEditingLot(lot)}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                    title="ערוך חניון"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
                <h4 className="text-xl font-bold text-primary mb-1">
                  {lot.name}
                </h4>
                <p className="text-on-surface-variant mb-4">{lot.address}</p>
                <div className="flex justify-between text-sm text-on-surface-variant mb-6">
                  <span>סך הכל חניות: {lot.totalSpots}</span>
                  <span>מפלסים: {lot.levels}</span>
                </div>
                <div className="mb-5 rounded-xl bg-primary/5 px-3 py-2 text-sm text-on-surface-variant">
                  תעריף: <span className="font-bold text-primary">{getLotPricingLabel(lot)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthorizedVehiclesLot(lot)}
                  className="mb-3 flex w-full cursor-pointer items-center justify-between rounded-lg border border-outline-variant/30 px-3 py-2 text-sm font-bold text-on-surface transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">no_crash</span>
                    ניהול רכבים פטורים
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {lot.authorizedVehicles?.length ?? 0}
                  </span>
                </button>

                <div className="mt-auto space-y-3">
                  <button
                    onClick={() =>
                      navigate("/", {
                        state: {
                          selectedAdminLot: lot._id,
                          adminMode: true,
                          selectedCityId: selectedCityId,
                          cityName: selectedCityName,
                          lotName: lot.name,
                        },
                      })
                    }
                    className="w-full py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-on-primary transition-all"
                  >
                    נהל סטטוס חניות
                  </button>
                  <button
                    onClick={() => loadCarsForLot(lot)}
                    className="w-full py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-on-primary transition-all"
                  >
                    צפה ברכבים חונים
                  </button>
                  <button
                    onClick={() => setLotToDelete(lot)}
                    className="w-full py-2 bg-error/10 text-error font-bold rounded-lg hover:bg-error hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    מחק חניון
                  </button>
                </div>
              </div>
            ))}
            {lotsToDisplay.length === 0 && (
              <p className="text-on-surface-variant">
                לא נמצאו חניונים בעיר זו.
              </p>
            )}
          </div>
        </>
      )}

      <EditLotModal 
        isOpen={!!editingLot}
        onClose={() => setEditingLot(null)}
        lot={editingLot}
        onSave={handleSaveLotSubmit}
      />

      <AuthorizedVehiclesModal
        isOpen={!!authorizedVehiclesLot}
        lot={authorizedVehiclesLot}
        onClose={() => setAuthorizedVehiclesLot(null)}
        onSave={handleSaveLotSubmit}
      />

      <CarsModal 
        isOpen={showCars}
        onClose={() => setShowCars(false)}
        lotName={selectedLotNameForCars}
        sessions={parkingLots.find((l) => l.name === selectedLotNameForCars)?.sessions || []}
      />

      {lotToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in duration-200" dir="rtl">
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-xl text-center w-full max-w-sm border border-outline-variant/20">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h4 className="text-xl font-bold text-on-surface mb-2">מחיקת חניון</h4>
            <p className="text-sm text-on-surface-variant mb-6">
              האם אתה בטוח שברצונך למחוק לצמיתות את חניון <strong>{lotToDelete.name}</strong>?<br/>
              פעולה זו תמחק גם את כל החניות שלו.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setLotToDelete(null)}
                disabled={isDeletingLot}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
              <button 
                onClick={executeDeleteLot}
                disabled={isDeletingLot}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-error text-white hover:bg-error/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingLot ? "מוחק..." : "כן, מחק חניון"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddParkingLotModal
        isOpen={isAddingLot}
        onClose={() => setIsAddingLot(false)}
        cityId={selectedCityId}
        cityName={selectedCityName}
        onSave={handleCreateLot}
      />
    </div>
  );
}
