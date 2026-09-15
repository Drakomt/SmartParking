import { useEffect, useState } from "react";

const normalizeLicensePlate = (value) => String(value ?? "")
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "");

const displayLicensePlate = (plate) => (
  /^\d{7,8}$/.test(plate)
    ? plate.replace(/^(\d{2,3})(\d{3})(\d{2})$/, "$1-$2-$3")
    : plate
);

export default function AuthorizedVehiclesModal({ isOpen, lot, onClose, onSave }) {
  const [plates, setPlates] = useState([]);
  const [newPlate, setNewPlate] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lot) {
      setPlates(lot.authorizedVehicles ?? []);
      setNewPlate("");
      setError("");
    }
  }, [lot]);

  const handleAddPlate = (event) => {
    event.preventDefault();
    const normalizedPlate = normalizeLicensePlate(newPlate);

    if (!normalizedPlate) {
      setError("יש להזין לוחית רישוי תקינה.");
      return;
    }

    if (plates.includes(normalizedPlate)) {
      setError("לוחית הרישוי כבר נמצאת ברשימה.");
      return;
    }

    setPlates((current) => [...current, normalizedPlate]);
    setNewPlate("");
    setError("");
  };

  const handleRemovePlate = (plateToRemove) => {
    setPlates((current) => current.filter((plate) => plate !== plateToRemove));
    setError("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      await onSave(lot._id, { authorizedVehicles: plates });
      onClose();
    } catch (saveError) {
      console.error("Failed to update exempt vehicles", saveError);
      setError("לא הצלחנו לשמור את הרשימה. בדקו את ההרשאות ונסו שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !lot) return null;

  return (
    <div className="mobile-sheet-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" dir="rtl">
      <section
        className="mobile-sheet relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="authorized-vehicles-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error sm:left-4 sm:top-4"
          aria-label="סגירת רשימת הרכבים הפטורים"
        >
          &times;
        </button>

        <div className="mb-5 border-b border-outline-variant/30 pb-4 pl-10">
          <h3 id="authorized-vehicles-title" className="text-2xl font-bold text-primary">רכבים פטורים מתשלום</h3>
          <p className="mt-1 text-sm text-on-surface-variant">{lot.name}</p>
        </div>

        <form onSubmit={handleAddPlate} className="mb-4">
          <label htmlFor="authorized-plate" className="mb-2 block text-sm font-bold text-on-surface">
            הוספת לוחית רישוי
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="authorized-plate"
              type="text"
              value={newPlate}
              onChange={(event) => setNewPlate(event.target.value)}
              placeholder="לדוגמה: 12-345-67"
              autoComplete="off"
              dir="ltr"
              className="min-h-11 flex-1 rounded-xl border border-outline-variant bg-surface px-4 text-center font-mono text-lg tracking-wider outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="min-h-11 cursor-pointer rounded-xl bg-primary px-5 font-bold text-on-primary transition-colors hover:bg-primary/90"
            >
              הוסף לרשימה
            </button>
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">ניתן להקליד עם או בלי מקפים.</p>
        </form>

        {error && (
          <p className="mb-4 rounded-xl bg-error-container p-3 text-sm font-medium text-on-error-container" role="alert">
            {error}
          </p>
        )}

        <div className="mb-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant/30">
          <div className="flex items-center justify-between bg-surface-container-low px-4 py-3">
            <h4 className="font-bold text-on-surface">לוחיות ברשימה</h4>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{plates.length}</span>
          </div>

          <div className="min-h-28 overflow-y-auto p-3">
            {plates.length === 0 ? (
              <p className="py-8 text-center text-on-surface-variant">לא הוגדרו רכבים פטורים בחניון זה.</p>
            ) : (
              <ul className="space-y-2">
                {plates.map((plate) => (
                  <li key={plate} className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
                    <span className="font-mono text-lg font-bold tracking-wider text-on-surface" dir="ltr">
                      {displayLicensePlate(plate)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlate(plate)}
                    className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-error transition-colors hover:bg-error/10"
                      aria-label={`הסרת לוחית ${displayLicensePlate(plate)} מהרשימה`}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="min-h-11 cursor-pointer rounded-xl border border-outline-variant px-5 font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="min-h-11 cursor-pointer rounded-xl bg-primary px-6 font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "שומר..." : "שמור רשימה"}
          </button>
        </div>
      </section>
    </div>
  );
}
