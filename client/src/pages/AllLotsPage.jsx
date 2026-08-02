import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function AllLotsPage() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/parking/all`);
        setLots(res.data);
      } catch (err) {
        console.error("Error fetching all lots:", err);
        setError("שגיאה בטעינת החניונים. אנא נסה שוב.");
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, []);

  const israelCenter = [32.0, 34.8];

  return (
    <div className="pt-24 pb-12 px-4 sm:px-8 max-w-2xl mx-auto w-full flex flex-col items-center">
      <div className="flex items-center justify-start gap-4 mb-4 w-full">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer"
          title="חזור"
        >
          <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }}>arrow_back</span>
        </button>
        <h1 className="text-3xl font-black text-primary">כל החניונים שלנו</h1>
      </div>

      <div className="w-full rounded-3xl overflow-hidden shadow-lg border border-outline-variant/30 mb-12 relative" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        {loading ? (
          <div className="absolute inset-0 flex justify-center items-center bg-surface-container-lowest z-10">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex justify-center items-center bg-error-container text-error p-6 font-bold text-center z-10">
            {error}
          </div>
        ) : (
          <MapContainer center={israelCenter} zoom={8} scrollWheelZoom={true} className="w-full h-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {lots.map((lot) => {
              if (lot.location?.lat && lot.location?.lng) {
                const freeSpots = lot.spots ? lot.spots.filter(s => s.status === 'free').length : 0;
                
                return (
                  <Marker key={lot._id} position={[lot.location.lat, lot.location.lng]}>
                    <Popup className="font-sans text-center" dir="rtl">
                      <div className="flex flex-col items-center gap-2 p-1">
                        <strong className="text-lg text-primary">{lot.name}</strong>
                        <span className="text-sm text-on-surface-variant flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm ml-1">location_on</span>
                          {lot.address || lot.city?.name || ""}
                        </span>
                        <div className="flex justify-center gap-2 text-sm mt-1 w-full">
                          <span className="bg-surface-container-high px-2 py-1 rounded-md text-on-surface whitespace-nowrap">{lot.totalSpots} סה"כ</span>
                          {lot.spots && (
                            <span className={freeSpots > 0 ? "bg-blue-100 text-blue-900 px-2 py-1 rounded-md font-bold whitespace-nowrap" : "bg-error-container text-error px-2 py-1 rounded-md font-bold whitespace-nowrap"}>
                              {freeSpots} פנויים
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => window.open(`https://waze.com/ul?ll=${lot.location.lat},${lot.location.lng}&navigate=yes`, '_blank')}
                          className="mt-2 flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg transition-colors cursor-pointer w-full"
                        >
                          <i className="fa-brands fa-waze text-lg"></i>
                          נווט לחניון
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
