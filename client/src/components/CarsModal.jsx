import React, { useState, useMemo } from "react";

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

export default function CarsModal({ isOpen, onClose, lotName, sessions = [] }) {
  const [carSearchQuery, setCarSearchQuery] = useState("");

  const parkedCars = useMemo(() => {
    return sessions.map((session) => calculateCarData(session, lotName));
  }, [sessions, lotName]);

  const filteredCars = parkedCars.filter((car) =>
    car.licensePlate.includes(carSearchQuery)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] shadow-2xl relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-2xl text-on-surface-variant hover:text-error transition-colors"
        >
          &times;
        </button>
        <h3 className="text-2xl font-bold mb-6 text-primary border-b pb-4">
          רכבים חונים - {lotName}
        </h3>

        <div className="mb-4 relative">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="חיפוש לפי לוחית רישוי..."
            value={carSearchQuery}
            onChange={(e) => setCarSearchQuery(e.target.value)}
            className="w-full sm:w-1/2 pl-4 pr-10 py-2 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            dir="rtl"
          />
        </div>

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
              {filteredCars.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="text-center py-8 text-on-surface-variant"
                  >
                    {carSearchQuery
                      ? "לא נמצאו רכבים תואמים לחיפוש."
                      : "אין רכבים חונים בחניון זה כרגע."}
                  </td>
                </tr>
              ) : (
                filteredCars.map((car, idx) => (
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
            onClick={onClose}
            className="bg-surface-container-highest px-6 py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-highest/80 transition-all"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
