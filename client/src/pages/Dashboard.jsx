import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [parkingLots, setParkingLots] = useState([]); // All lots with details (spots, sessions)
  const [cities, setCities] = useState([]); // Authorized cities
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Lot Modal State
  const [editingLot, setEditingLot] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", address: "" });
  const [isSaving, setIsSaving] = useState(false);

  // License Plates View State
  const [showCars, setShowCars] = useState(false);
  const [parkedCars, setParkedCars] = useState([]);
  const [selectedLotNameForCars, setSelectedLotNameForCars] = useState("");

  // City filtering
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
          axios.get("http://localhost:3000/api/parking/authorized/cities", {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get("http://localhost:3000/api/parking/authorized/lots", {
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

  // Handle live socket updates
  useEffect(() => {
    if (!user) return;

    const socket = io("http://localhost:3000", {
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

  const calculateCarData = (session, lotName) => {
    const entryDate = new Date(session.entryTime);
    const now = new Date();
    const diffMs = now - entryDate;
    let durationStr = "-";
    if (!isNaN(diffMs) && diffMs >= 0) {
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (hours > 0) durationStr = `${hours} שעות ו-${mins} דקות`;
      else durationStr = `${mins} דקות`;
    }

    return {
      lotName,
      licensePlate: session.carLicensePlate || "לא הוזן",
      entryTime: entryDate.toLocaleString("he-IL", {
        dateStyle: "short",
        timeStyle: "short",
      }),
      duration: durationStr,
    };
  };

  useEffect(() => {
    // If cars modal is open, we should update the parkedCars list when parkingLots changes
    if (showCars && selectedLotNameForCars) {
      const currentLot = parkingLots.find(
        (l) => l.name === selectedLotNameForCars,
      );
      if (currentLot && currentLot.sessions) {
        const allCars = currentLot.sessions.map((session) => calculateCarData(session, currentLot.name));
        setParkedCars(allCars);
      }
    }
  }, [parkingLots, showCars, selectedLotNameForCars]);

  const handleEditClick = (lot) => {
    setEditingLot(lot);
    setEditForm({ name: lot.name, address: lot.address });
  };

  const handleSaveLot = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.put(
        `http://localhost:3000/api/parking/${editingLot._id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        },
      );
      setParkingLots((prev) =>
        prev.map((lot) =>
          lot._id === editingLot._id ? { ...lot, ...editForm } : lot,
        ),
      );
      setEditingLot(null);
    } catch (err) {
      console.error("Failed to update lot", err);
      alert("שגיאה בעדכון החניון");
    } finally {
      setIsSaving(false);
    }
  };

  const loadCarsForLot = (lot) => {
    if (!lot.sessions) {
      alert(
        "הנתונים המלאים של החניון טרם נטענו מהשרת, או שקיימת שגיאה. אנא ודא שהשרת התרפרש ושאין בו שגיאות.",
      );
      return;
    }

    const allCars = lot.sessions.map((session) => calculateCarData(session, lot.name));

    setParkedCars(allCars);
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
                  onClick={() => handleEditClick(lot)}
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

      {/* Editing Modal */}
      {editingLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setEditingLot(null)}
              className="absolute top-4 left-4 text-2xl text-on-surface-variant hover:text-error transition-colors"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6 text-primary">
              ערוך פרטי חניון
            </h3>

            <form onSubmit={handleSaveLot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-on-surface">
                  שם חניון
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-on-surface">
                  כתובת
                </label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-right"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? "שומר..." : "שמור שינויים"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cars Modal */}
      {showCars && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] shadow-2xl relative flex flex-col">
            <button
              onClick={() => setShowCars(false)}
              className="absolute top-4 left-4 text-2xl text-on-surface-variant hover:text-error transition-colors"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6 text-primary border-b pb-4">
              רכבים חונים - {selectedLotNameForCars}
            </h3>

            <div className="overflow-y-auto flex-1 relative rounded-xl border border-outline-variant/30">
              <table className="w-full text-right border-collapse">
                <thead className="bg-surface-container-highest text-on-surface font-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-3 px-4 rounded-tr-xl">לוחית רישוי</th>
                    <th className="py-3 px-4">זמן כניסה</th>
                    <th className="py-3 px-4 rounded-tl-xl">משך שהייה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {parkedCars.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center py-8 text-on-surface-variant"
                      >
                        אין רכבים חונים בחניון זה כרגע.
                      </td>
                    </tr>
                  ) : (
                    parkedCars.map((car, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-surface-container/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          {car.licensePlate === "לא הוזן" ? (
                            <span className="text-on-surface-variant italic opacity-70">
                              לא הוזן
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-lg text-primary">
                              {car.licensePlate}
                            </span>
                          )}
                        </td>
                        <td
                          className="py-4 px-4 font-bold text-on-surface-variant"
                          dir="ltr"
                        >
                          {car.entryTime}
                        </td>
                        <td className="py-4 px-4 font-bold text-primary">
                          {car.duration}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCars(false)}
                className="bg-surface-container-highest px-6 py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-highest/80 transition-all"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
