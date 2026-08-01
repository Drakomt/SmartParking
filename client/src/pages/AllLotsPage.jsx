import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ParkingLotCard from "../components/ParkingLotCard";

export default function AllLotsPage() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // We will implement the fetch logic later once the backend route is ready.
    // For now, it stays empty as requested by the user.
    setLoading(false);
  }, []);

  return (
    <main className="flex-grow pt-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer"
          title="חזור"
        >
          <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }}>arrow_back</span>
        </button>
        <h1 className="text-3xl font-black text-primary">כל החניונים</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-error-container text-error p-6 rounded-2xl font-bold text-center">
          {error}
        </div>
      ) : lots.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant text-lg">
          לא קיימים חניונים להצגה (או שהבקשה לשרת טרם נבנתה).
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lots.map((lot) => (
            <ParkingLotCard
              key={lot._id}
              lot={lot}
              isFavorite={false}
              onToggleFavorite={() => {}}
              onClick={() => {}} 
            />
          ))}
        </div>
      )}
    </main>
  );
}
