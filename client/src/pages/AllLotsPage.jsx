import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import axios from "axios";
import api from "../lib/api";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
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

function MapController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && target.center) {
      map.flyTo(target.center, target.zoom || 14, { duration: 1.5 });
    }
  }, [target, map]);
  return null;
}

export default function AllLotsPage() {
  const navigate = useNavigate();
  const { isColorBlindMode } = useSettings();
  const [lots, setLots] = useState([]);
  const [groupedLots, setGroupedLots] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const israelCenter = [32.0, 34.8];
  const [mapTarget, setMapTarget] = useState({ center: israelCenter, zoom: 8 });
  const [openCity, setOpenCity] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [cityBoundary, setCityBoundary] = useState(null);
  const boundaryCache = React.useRef({});

  useEffect(() => {
    if (!openCity) {
      setCityBoundary(null);
      return;
    }

    setCityBoundary(null);

    if (boundaryCache.current[openCity]) {
      setCityBoundary(boundaryCache.current[openCity]);
      return;
    }

    const fetchBoundary = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(openCity + ', ישראל')}&polygon_geojson=1&format=json&limit=1`;
        const res = await axios.get(url);
        
        if (res.data && res.data.length > 0 && res.data[0].geojson) {
          const geojsonData = res.data[0].geojson;
          boundaryCache.current[openCity] = geojsonData;
          setCityBoundary(geojsonData);
        } else {
          setCityBoundary(null);
        }
      } catch (err) {
        console.error("Failed to fetch city boundary", err);
        setCityBoundary(null);
      }
    };

    fetchBoundary();
  }, [openCity]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lotsRes, citiesRes] = await Promise.all([
          api.get("/api/parking/all"),
          api.get("/api/parking/cities")
        ]);
        
        const lotsData = lotsRes.data;
        const citiesData = citiesRes.data;
        
        setLots(lotsData);
        
        const cityIdToName = {};
        citiesData.forEach(c => {
          cityIdToName[c._id] = c.name;
        });
        
        const grouped = {};
        lotsData.forEach(lot => {
          let cityName = "אחר";
          
          if (lot.city && typeof lot.city === 'object' && lot.city.name) {
            cityName = lot.city.name;
          } else if (lot.city && typeof lot.city === 'string' && cityIdToName[lot.city]) {
            cityName = cityIdToName[lot.city];
          }
          
          if (!grouped[cityName]) grouped[cityName] = [];
          grouped[cityName].push(lot);
        });
        
        const sortedGrouped = {};
        Object.keys(grouped).sort().forEach(key => {
          sortedGrouped[key] = grouped[key];
        });
        
        setGroupedLots(sortedGrouped);
      } catch (err) {
        console.error("Error fetching lots and cities:", err);
        setError("שגיאה בטעינת הנתונים. אנא נסה שוב.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCityClick = (cityName, cityLots) => {
    if (openCity === cityName) {
      setOpenCity(null);
      setMapTarget({ center: israelCenter, zoom: 8 });
      return;
    }
    
    setOpenCity(cityName);
    // Calculate average center of the city based on its lots
    const validLots = cityLots.filter(l => l.location?.lat && l.location?.lng);
    if (validLots.length > 0) {
      const avgLat = validLots.reduce((sum, l) => sum + l.location.lat, 0) / validLots.length;
      const avgLng = validLots.reduce((sum, l) => sum + l.location.lng, 0) / validLots.length;
      setMapTarget({ center: [avgLat, avgLng], zoom: 13 });
    }
  };

  const handleLotClick = (lot) => {
    if (lot.location?.lat && lot.location?.lng) {
      setMapTarget({ center: [lot.location.lat, lot.location.lng], zoom: 16 });
    }
  };

  const filteredGroupedLots = Object.entries(groupedLots).reduce((acc, [cityName, cityLots]) => {
    if (!searchTerm) {
      acc[cityName] = cityLots;
      return acc;
    }

    if (cityName.includes(searchTerm)) {
      acc[cityName] = cityLots;
      return acc;
    }

    const matchingLots = cityLots.filter(lot => 
      lot.name.includes(searchTerm) || (lot.address && lot.address.includes(searchTerm))
    );

    if (matchingLots.length > 0) {
      acc[cityName] = matchingLots;
    }

    return acc;
  }, {});

  return (
    <div className="pt-24 pb-8 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col h-[100dvh]">
      <div className="flex items-center justify-start gap-2 mb-6 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer"
          title="חזור"
        >
          <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }}>arrow_back</span>
        </button>
        <h1 className="text-3xl font-black text-primary">כל החניונים שלנו</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-grow min-h-0 pb-4">
        <div className="w-full md:w-1/3 lg:w-1/4 bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden shrink-0 h-[40vh] md:h-full">
          <div className="p-4 bg-primary/5 border-b border-outline-variant/20 shadow-sm z-10 flex flex-col gap-3">
            <h2 className="font-bold text-primary text-lg flex items-center gap-2">
              <span className="material-symbols-outlined">location_city</span>
              בחר עיר
            </h2>
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant text-sm">search</span>
              <input
                type="text"
                placeholder="חיפוש עיר או חניון..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-outline-variant/30 rounded-xl py-2 pr-9 pl-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-grow p-3 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-error p-4 text-center text-sm">{error}</div>
            ) : Object.keys(filteredGroupedLots).length === 0 ? (
              <div className="text-on-surface-variant p-4 text-center">לא נמצאו תוצאות לחיפוש</div>
            ) : (
              Object.entries(filteredGroupedLots).map(([cityName, cityLots]) => {
                const isOpen = openCity === cityName;
                return (
                  <div key={cityName} className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-surface">
                    <button 
                      onClick={() => handleCityClick(cityName, cityLots)}
                      className={`w-full text-right p-4 flex items-center justify-between transition-colors cursor-pointer ${isOpen ? 'bg-primary text-on-primary' : 'hover:bg-primary/5 text-on-surface'}`}
                    >
                      <span className="font-bold text-lg">{cityName} ({cityLots.length})</span>
                      <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                    </button>
                    
                    {isOpen && (
                      <div className="bg-surface-container-lowest animate-fade-in-up">
                        {cityLots.map(lot => {
                          const freeSpots = lot.spots ? lot.spots.filter(s => s.status === 'free').length : 0;
                          return (
                            <div 
                              key={lot._id} 
                              onClick={() => handleLotClick(lot)}
                              className="p-3 border-b border-outline-variant/10 last:border-0 hover:bg-primary/10 cursor-pointer transition-colors group"
                            >
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-primary text-[15px]">{lot.name}</h3>
                                <div className={`text-xs px-2 py-0.5 rounded font-bold ${freeSpots > 0 ? 'bg-blue-100 text-blue-900' : 'bg-error-container text-error'}`}>
                                  {freeSpots} פנויים
                                </div>
                              </div>
                              <p className="text-[13px] text-on-surface-variant mt-1 truncate">{lot.address || 'כתובת לא ידועה'}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="w-full md:w-2/3 lg:w-3/4 rounded-3xl overflow-hidden shadow-lg border border-outline-variant/30 relative flex-grow min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex justify-center items-center bg-surface-container-lowest z-10">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <MapContainer center={mapTarget.center} zoom={mapTarget.zoom} scrollWheelZoom={true} className="w-full h-full z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController target={mapTarget} />
              
              {cityBoundary && (
                <GeoJSON 
                  key={`${openCity}-${isColorBlindMode ? 'colorblind' : 'normal'}`}
                  data={cityBoundary} 
                  pathOptions={{ 
                    color: isColorBlindMode ? '#d97706' : '#ef4444', 
                    weight: 3, 
                    fillOpacity: 0.15, 
                    fillColor: isColorBlindMode ? '#d97706' : '#ef4444' 
                  }} 
                />
              )}

              {lots.map((lot) => {
                if (lot.location?.lat && lot.location?.lng) {
                  const freeSpots = lot.spots ? lot.spots.filter(s => s.status === 'free').length : 0;
                  
                  return (
                    <Marker key={lot._id} position={[lot.location.lat, lot.location.lng]}>
                      <Popup className="font-sans text-center" dir="rtl">
                        <div className="flex flex-col items-center gap-2 p-1">
                          <strong className="text-lg text-primary">{lot.name}</strong>
                          <span className="text-sm font-medium text-on-surface flex items-center justify-center">
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
    </div>
  );
}
