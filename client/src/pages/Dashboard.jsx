import { useState, useEffect } from "react";
import api from "../lib/api";
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
          api.get("/api/parking/authorized/cities"),
          api.get("/api/parking/authorized/lots"),
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
          if (lot._id !== updatedSpot.parkingLot?.id) return lot;

          let newSpots = lot.spots ? [...lot.spots] : [];
          if (updatedSpot.action === 'created') {
            newSpots.push({ ...updatedSpot.spot, _id: updatedSpot.spot.id });
          } else if (updatedSpot.action === 'deleted') {
            newSpots = newSpots.filter((s) => s._id !== updatedSpot.spot.id);
          } else {
            newSpots = newSpots.map((spot) =>
              spot._id === updatedSpot.spot?.id
                ? { ...spot, status: updatedSpot.spot.status, type: updatedSpot.spot.type }
                : spot,
            );
          }

          return {
            ...lot,
            totalSpots: updatedSpot.parkingLot.totalSpots ?? lot.totalSpots,
            spots: newSpots,
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
    await api.put(`/api/parking/${lotId}`, formData);
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
      await api.delete(`/api/parking/${lotToDelete._id}`);
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
    const spots = [];
    for (const [levelStr, numSpots] of Object.entries(levelsDistribution)) {
      const level = Number(levelStr);
      for (let index = 1; index <= numSpots; index += 1) {
        spots.push({
          spotNumber: level * 100 + index,
          level,
          status: "free",
          type: "regular",
        });
      }
    }

    const { data: newLot } = await api.post(
      "/api/parking/with-spots",
      { ...lotPayload, spots },
    );

    setParkingLots((prev) => [...prev, newLot]);
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
    <div className="mx-auto max-w-6xl px-3 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24" dir="rtl">
      <div className="mb-5 flex items-center justify-between sm:mb-8">
        <h1 className="text-2xl font-black text-primary sm:text-4xl">
          אזור אישי - מנהל מערכת
        </h1>
      </div>

      <div className="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:mb-8 sm:p-6">
        <h2 className="text-xl font-bold mb-2">שלום</h2>
        <p className="text-on-surface-variant">
          הערים שבאחריותך:{" "}
          {cities.map((c) => c.name).join(", ") || "אין ערים מוגדרות"}
        </p>
      </div>

      {!selectedCityId ? (
        <>
          <h3 className="mb-4 text-xl font-bold sm:text-2xl">בחר עיר לניהול</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
            {cities.map((city) => {
              const cityLotsCount = parkingLots.filter((lot) => {
                const lotCityId = typeof lot.city === 'object' && lot.city !== null ? lot.city._id : lot.city;
                return lotCityId === city._id;
              }).length;
              return (
                <button
                  type="button"
                  key={city._id}
                  onClick={() => setSelectedCityId(city._id)}
                  className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 text-center shadow transition-all hover:border-primary hover:shadow-md sm:p-8"
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
                </button>
              );
            })}
            {cities.length === 0 && (
              <p className="text-on-surface-variant">לא נמצאו ערים באחריותך.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3 sm:mb-6 sm:gap-4">
            <button
              onClick={() => setSelectedCityId(null)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-primary transition-colors hover:bg-primary/10"
              title="חזור לרשימת הערים"
              aria-label="חזרה לרשימת הערים"
            >
              <span
                className="material-symbols-outlined"
                style={{ transform: "rotate(180deg)" }}
              >
                arrow_back
              </span>
            </button>
            <div className="flex-1">
              <h3 className="text-xl font-bold sm:text-2xl">
                ניהול חניונים - {selectedCityName}
              </h3>
            </div>
            <button
              onClick={() => setIsAddingLot(true)}
              className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow transition-colors hover:bg-primary/90"
            >
              <span className="material-symbols-outlined">add</span>
              הוסף חניון
            </button>
          </div>

          {error && <p className="text-error">{error}</p>}

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lotsToDisplay.map((lot) => (
              <div
                key={lot._id}
                className="relative flex h-full flex-col rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow transition-all hover:border-primary sm:p-6"
              >
                <div className="absolute top-4 left-4 flex gap-2">
                  <button
                    onClick={() => setEditingLot(lot)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
                    title="ערוך חניון"
                    aria-label={`עריכת חניון ${lot.name}`}
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
                  className="mb-3 flex min-h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-outline-variant/30 px-3 py-2 text-sm font-bold text-on-surface transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
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
                    className="min-h-12 w-full rounded-xl bg-primary/10 py-2 font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary"
                  >
                    נהל סטטוס חניות
                  </button>
                  <button
                    onClick={() => loadCarsForLot(lot)}
                    className="min-h-12 w-full rounded-xl bg-primary/10 py-2 font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary"
                  >
                    צפה ברכבים חונים
                  </button>
                  <button
                    onClick={() => setLotToDelete(lot)}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-error/10 py-2 font-bold text-error transition-colors hover:bg-error hover:!text-white"
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
        <div className="mobile-sheet-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" dir="rtl">
          <div className="mobile-sheet w-full max-w-sm rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 text-center shadow-xl sm:p-8">
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
