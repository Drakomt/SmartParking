import { useState, useMemo } from "react";

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
    <div className="mobile-sheet-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <section className="mobile-sheet relative flex max-h-[90dvh] w-full max-w-4xl flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="parked-cars-title" dir="rtl">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error sm:left-4 sm:top-4"
          aria-label="סגירת רשימת הרכבים"
        >
          &times;
        </button>
        <h3 id="parked-cars-title" className="mb-4 border-b pb-4 pl-10 text-xl font-bold text-primary sm:mb-6 sm:text-2xl">
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
            className="min-h-12 w-full rounded-xl border border-outline-variant bg-surface py-2 pl-4 pr-10 text-base outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary sm:w-1/2"
            aria-label="חיפוש רכב לפי לוחית רישוי"
            dir="rtl"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-3 sm:hidden">
            {filteredCars.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-outline-variant/40 p-6 text-center text-on-surface-variant">
                {carSearchQuery
                  ? "לא נמצאו רכבים תואמים לחיפוש."
                  : "אין רכבים חונים בחניון זה כרגע."}
              </p>
            ) : (
              filteredCars.map((car, idx) => (
                <article
                  key={`${car.licensePlate}-${car.entryTime}-${idx}`}
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
                    <span className="text-sm font-bold text-on-surface-variant">לוחית רישוי</span>
                    {car.licensePlate === "לא הוזן" ? (
                      <span className="italic text-on-surface-variant opacity-70">לא הוזן</span>
                    ) : (
                      <span className="font-mono text-lg font-black tracking-wide text-primary" dir="ltr">
                        {car.licensePlate}
                      </span>
                    )}
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="shrink-0 text-on-surface-variant">זמן כניסה</dt>
                      <dd className="text-left font-bold text-on-surface" dir="ltr">{car.entryTime}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-on-surface-variant">משך שהייה</dt>
                      <dd className="font-bold text-primary">{car.duration}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-auto rounded-xl border border-outline-variant/30 sm:block">
          <table className="w-full min-w-[36rem] border-collapse text-right">
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
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-11 rounded-xl bg-surface-container-highest px-6 py-3 font-bold text-on-surface transition-all hover:bg-surface-container-highest/80"
          >
            סגור
          </button>
        </div>
      </section>
    </div>
  );
}
