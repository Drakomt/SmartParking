import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import CarsModal from "../components/CarsModal";
import EditLotModal from "../components/EditLotModal";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [parkingLots, setParkingLots] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingLot, setEditingLot] = useState(null);

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
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/parking/authorized/lots`, {
            headers: { Authorization: `Bearer ${user.token}` },
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
    if (!user) return;

    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token: user.token },
    });

    socket.on("connect", () => {
      console.log("Admin connected to personal socket room");
    });

    socket.on("parking-spot-updated", (updatedSpot) => {
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
    });

    socket.on("parking-session-updated", (updatedSession) => {
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
    });

    return () => socket.disconnect();
  }, [user]);

  const handleSaveLotSubmit = async (lotId, formData) => {
    await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/api/parking/${lotId}`,
      formData,
      {
        headers: { Authorization: `Bearer ${user.token}` },
      },
    );
    setParkingLots((prev) =>
      prev.map((lot) =>
        lot._id === lotId ? { ...lot, ...formData } : lot,
      ),
    );
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
    ? parkingLots.filter((lot) => lot.city === selectedCityId)
    : [];

  const selectedCityName = selectedCityId ? getCityName(selectedCityId) : "";

  return (
    <div className="pt-24 px-4 sm:px-8 max-w-6xl mx-auto" dir="rtl">
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
              const cityLotsCount = parkingLots.filter(
                (lot) => lot.city === city._id,
              ).length;
              return (
                <div
                  key={city._id}
                  onClick={() => setSelectedCityId(city._id)}
                  className="bg-white/80 p-8 rounded-2xl shadow border border-outline-variant/30 hover:border-primary hover:shadow-md cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
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
            <h3 className="text-2xl font-bold">
              ניהול חניונים - {selectedCityName}
            </h3>
          </div>

          {error && <p className="text-error">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lotsToDisplay.map((lot) => (
              <div
                key={lot._id}
                className="bg-white/80 p-6 rounded-2xl shadow border border-outline-variant/30 hover:border-primary transition-all relative flex flex-col h-full"
              >
                <button
                  onClick={() => setEditingLot(lot)}
                  className="absolute top-4 left-4 text-on-surface-variant hover:text-primary transition-colors"
                  title="ערוך חניון"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <h4 className="text-xl font-bold text-primary mb-1">
                  {lot.name}
                </h4>
                <p className="text-on-surface-variant mb-4">{lot.address}</p>
                <div className="flex justify-between text-sm text-on-surface-variant mb-6">
                  <span>סך הכל חניות: {lot.totalSpots}</span>
                  <span>מפלסים: {lot.levels}</span>
                </div>

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

      <CarsModal 
        isOpen={showCars}
        onClose={() => setShowCars(false)}
        lotName={selectedLotNameForCars}
        sessions={parkingLots.find((l) => l.name === selectedLotNameForCars)?.sessions || []}
      />
    </div>
  );
}
