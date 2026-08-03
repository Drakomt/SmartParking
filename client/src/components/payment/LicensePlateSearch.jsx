import React, { useState } from "react";

export default function LicensePlateSearch({ onSearch }) {
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!plate || plate.trim().length < 6) {
      setError("אנא הזן מספר רישוי תקין (לפחות 6 ספרות).");
      return;
    }
    setError("");
    onSearch(plate);
  };

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in-up max-w-md mx-auto py-8">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-5xl text-primary">directions_car</span>
      </div>
      
      <h2 className="text-2xl font-bold text-on-surface mb-2 text-center">הזן מספר רישוי</h2>
      <p className="text-on-surface-variant text-center mb-8">
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
            className="w-full text-center text-3xl font-black tracking-widest bg-surface border-2 border-outline-variant/50 rounded-xl py-4 px-6 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all text-on-surface"
          />
        </div>

        {error && (
          <p className="text-error text-sm text-center font-medium bg-error-container/50 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>המשך לתשלום</span>
          <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }}>arrow_forward</span>
        </button>
      </form>
    </div>
  );
}
