import { useState } from "react";
import api from "../../lib/api";

export default function LicensePlateSearch({ onSearch }) {
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plate || plate.trim().length < 6) {
      setError("אנא הזן מספר רישוי תקין (לפחות 6 ספרות).");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await api.get("/api/parking/session/lookup", { params: { plate } });
      onSearch(plate, response.data);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה באיתור הרכב. ייתכן שאין חוב פעיל או שהרכב לא נמצא.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-5 animate-fade-in-up sm:py-8">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 sm:mb-6 sm:h-24 sm:w-24">
        <span className="material-symbols-outlined text-4xl text-primary sm:text-5xl" aria-hidden="true">directions_car</span>
      </div>
      
      <h2 className="text-2xl font-bold text-on-surface mb-2 text-center">הזן מספר רישוי</h2>
      <p className="mb-6 text-center leading-7 text-on-surface-variant sm:mb-8">
        הזן את מספר הרישוי של הרכב כדי לבדוק האם קיימת יתרת חובה לתשלום בחניוני הרשת.
      </p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            dir="ltr"
            placeholder="12-345-67"
            value={plate}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9-]/g, '');
              setPlate(val);
              if (error) setError("");
            }}
            className="min-h-14 w-full rounded-xl border-2 border-outline-variant/50 bg-surface px-3 py-3 text-center text-2xl font-black tracking-widest text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary sm:px-6 sm:py-4 sm:text-3xl"
            inputMode="numeric"
            autoComplete="off"
            aria-label="מספר רישוי"
          />
        </div>

        {error && (
          <p className="text-error text-sm text-center font-medium bg-error-container/50 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-on-primary shadow-md transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-4 sm:py-4"
        >
          {loading ? (
             <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <>
              <span>המשך לתשלום</span>
              <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }}>arrow_forward</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
