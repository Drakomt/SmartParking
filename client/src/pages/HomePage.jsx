import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ParkingLotView from "../components/ParkingLotView";
import useParkingLots from "../hooks/useParkingLots";
import SearchInput from "../components/SearchInput";
import useCities from "../hooks/useCities";
import useParkingData from "../hooks/useParkingData";

export default function HomePage() {
  const [submittedCity, setSubmittedCity] = useState("");
  const { parkingLotsCity, loading, error } = useParkingLots(submittedCity);
  const citiesInDatabase = useCities();

  const [selectedParkingLotId, setSelectedParkingLotId] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [favoriteLots, setFavoriteLots] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.showFavorites) {
      setShowFavorites(true);
      navigate(".", { replace: true, state: {} });
    } else if (location.state?.selectedAdminLot) {
      setSelectedParkingLotId(location.state.selectedAdminLot);
      // We don't clear the state here because we need adminMode to persist while they are in the lot
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const storedSearches = localStorage.getItem("smartParking_recentSearches");
    if (storedSearches) {
      try {
        setRecentSearches(JSON.parse(storedSearches));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }

    const storedFavorites = localStorage.getItem("smartParking_favorites");
    if (storedFavorites) {
      try {
        setFavoriteLots(JSON.parse(storedFavorites));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  const toggleFavorite = (e, lot) => {
    e.stopPropagation(); // Prevent opening the parking lot
    setFavoriteLots(prevFavorites => {
      let newFavorites;
      const exists = prevFavorites.some(fav => fav._id === lot._id);
      if (exists) {
        newFavorites = prevFavorites.filter(fav => fav._id !== lot._id);
      } else {
        // Store just enough info to render the card
        const { _id, name, address, city, totalSpots, spots } = lot;
        newFavorites = [...prevFavorites, { _id, name, address, city, totalSpots, spots }];
      }
      localStorage.setItem("smartParking_favorites", JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const onBack = () => {
    if (location.state?.adminMode) {
      navigate('/dashboard', { state: { selectedCityId: location.state.selectedCityId } });
    } else {
      setSelectedParkingLotId(null);
      setCurrentLevel(1); 
    }
  };

  // Listen for custom navigation events
  useEffect(() => {
    const handleReset = () => {
      setSelectedParkingLotId(null);
      setCurrentLevel(1);
      setShowFavorites(false);
    };
    const handleShowFavorites = () => {
      setSelectedParkingLotId(null);
      setCurrentLevel(1);
      setShowFavorites(true);
    };
    
    window.addEventListener("reset-home", handleReset);
    window.addEventListener("show-favorites", handleShowFavorites);
    
    return () => {
      window.removeEventListener("reset-home", handleReset);
      window.removeEventListener("show-favorites", handleShowFavorites);
    };
  }, []);

  const handleSearchSubmit = (city) => {
    setSubmittedCity(city);
    if (city && city.trim() !== "") {
      const newSearches = [city, ...recentSearches.filter(s => s !== city)].slice(0, 5);
      setRecentSearches(newSearches);
      localStorage.setItem("smartParking_recentSearches", JSON.stringify(newSearches));
    }
  };

  const { 
    parkings, 
    totalLevels, 
    isLoading: isLoadingSlots, 
    error: slotsError 
  } = useParkingData(selectedParkingLotId, currentLevel, submittedCity);

  // Removed duplicate onBack

  const handleUpdateLocation = (lotId) => {
    setSelectedParkingLotId(lotId);
    setCurrentLevel(1); 
  };

  const selectedLotName = 
    parkingLotsCity?.find(lot => lot._id === selectedParkingLotId)?.name || 
    favoriteLots?.find(lot => lot._id === selectedParkingLotId)?.name || 
    "";

  return (
    <main className="flex-grow pt-16">
      {selectedParkingLotId ? (
        <div className="w-full max-w-7xl mx-auto px-container-padding py-section-margin flex flex-col items-center">
          {isLoadingSlots ? (
            <div className="text-center p-8 bg-surface-container-highest rounded-3xl shadow-xl border border-outline-variant/20 w-full max-w-lg mt-6">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-primary text-lg">טוען נתוני חניון...</p>
            </div>
          ) : slotsError ? (
            <div className="text-center p-8 bg-error-container rounded-3xl shadow-xl border border-error/50 w-full max-w-lg mt-6">
              <p className="text-error text-lg mb-4">שגיאה: {slotsError}</p>
              <button onClick={onBack} className="cursor-pointer px-5 py-2 border border-error text-error hover:bg-error/10 rounded-xl transition-all">
                חזור
              </button>
            </div>
          ) : (
            <ParkingLotView 
              parkings={parkings} 
              onBack={onBack} 
              currentLevel={currentLevel}
              totalLevels={totalLevels}
              onLevelChange={setCurrentLevel}
              lotName={selectedLotName}
              isAdmin={location.state?.adminMode || false}
              lotId={selectedParkingLotId}
            />
          )}
        </div>
      ) : showFavorites ? (
        <div className="max-w-7xl mx-auto px-container-padding py-section-margin w-full flex flex-col gap-section-margin mt-8">
          <section className="flex flex-col w-full">
            <h2 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-500">star</span>
              חניונים שמורים
            </h2>
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] border border-outline-variant/20 flex-grow min-h-[300px]">
              {favoriteLots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteLots.map((lot) => {
                    const isFav = favoriteLots.some(fav => fav._id === lot._id);
                    return (
                      <button
                        key={lot._id}
                        onClick={() => handleUpdateLocation(lot._id)}
                        className="cursor-pointer bg-surface-container-lowest hover:bg-primary/5 transition-all duration-300 p-5 rounded-2xl border border-outline-variant/40 hover:border-primary shadow-sm hover:shadow-lg hover:-translate-y-1 text-right flex flex-col gap-3 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="flex justify-between items-start w-full">
                          <div className="flex flex-col gap-1 text-right">
                            <span className="font-headline-sm text-primary group-hover:text-primary-container transition-colors">{lot.name}</span>
                            <div className="flex items-center gap-1 text-on-surface-variant font-body-md justify-start">
                              <span className="material-symbols-outlined text-sm">location_on</span>
                              <span>{lot.address || lot.city?.name}</span>
                            </div>
                          </div>
                          
                          <div className="bg-primary/10 text-primary p-2 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                          </div>
                        </div>
                        
                        <div className="w-full pt-3 mt-1 border-t border-outline-variant/20 flex justify-between items-center gap-2">
                           <div className="flex gap-2">
                             {lot.totalSpots && (
                                <span className="bg-surface-container-high px-2 py-1 rounded-md text-label-sm text-on-surface font-bold group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                  {lot.totalSpots} סה"כ חניות
                                </span>
                             )}
                             {lot.spots && (
                               <span className={`px-2 py-1 rounded-md text-label-sm transition-colors ${lot.spots.filter(s => s.status === 'free').length > 0 ? 'bg-blue-100/80 text-slate-900 font-extrabold group-hover:bg-blue-200 group-hover:text-black' : 'bg-error-container text-on-error-container font-bold'}`}>
                                 {lot.spots.filter(s => s.status === 'free').length} פנויים
                               </span>
                             )}
                           </div>
                           <div 
                             onClick={(e) => toggleFavorite(e, lot)}
                             className={`p-2 rounded-full transition-colors flex items-center justify-center hover:bg-yellow-500/10 ${isFav ? 'text-yellow-500' : 'text-outline-variant hover:text-yellow-500'}`}
                             title="שמור למועדפים"
                           >
                             <span className="material-symbols-outlined" style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                           </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-on-surface-variant font-body-md py-10 flex flex-col items-center justify-center gap-4 text-center h-full">
                  <span className="material-symbols-outlined text-6xl text-outline-variant/50">star</span>
                  עדיין לא שמרת חניונים מועדפים.<br/>חפש עיר ולחץ על הכוכב ליד חניון כדי לשמור אותו כאן.
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-start">
              <button
                onClick={() => setShowFavorites(false)}
                className="cursor-pointer px-4 py-2 bg-transparent border border-outline-variant/50 hover:border-primary hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-xl transition-all duration-300 font-medium flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm" style={{ transform: "rotate(180deg)" }}>arrow_back</span>
                חזור
              </button>
            </div>
          </section>
        </div>
      ) : (
        <>
          <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-full h-full">
              <div className="bg-cover bg-center w-full h-full opacity-80" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA64VTqgTggEVtFrsRgJck0iW18vOJttvc0fJ-PZDM9McmLGlqp2qKjlZBLTy4u5Vlv055HUKsgsJwYCU89Ng2HvTlFlsq8CLHZMdTcrt0dlelz3ltdBh0k_svvmmJtqS50PdgxXNDyZu50r7Ggm2-e4eV5Jg5Xh73QKGXZkjxi_IM57b3Qr7d09ifYTEamtTTD8Xjn9XUhNg4QXDpKMojtZxtbAl0LsAoWbtv_XLKB1XdYxZuc5P8Mw0TnKwxhUz2Hy--sEYsKeA")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background"></div>
            </div>
            <div className="relative z-10 w-full max-w-4xl px-container-padding text-right">
              <h1 className="text-4xl sm:text-5xl md:text-3xl font-black text-primary mb-6 drop-shadow-lg tracking-tight">
                  מצא את החניה המושלמת בעיר שלך
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl">
                  מערכת ניהול חניונים מתקדמת ופשוטה לשימוש. הזן את שם העיר כדי למצוא זמינות בזמן אמת.
              </p>
              <SearchInput 
                onSearch={handleSearchSubmit} 
                availableCities={citiesInDatabase}
              />
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-container-padding py-section-margin w-full flex flex-col gap-section-margin">
            <div className="flex flex-col gap-section-margin w-full">
              <section className="flex flex-col w-full">
                <h2 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_parking</span>
                  {submittedCity ? `תוצאות חיפוש עבור "${submittedCity}"` : "חניונים מומלצים"}
                </h2>
                
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] border border-outline-variant/20 flex-grow">
                  {submittedCity && loading && <div className="text-primary mb-4 font-body-md">מחפש חניונים...</div>}
                  {submittedCity && error && <div className="text-error mb-4 font-body-md">שגיאה: {error}</div>}

                  {submittedCity && !loading && parkingLotsCity && parkingLotsCity.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {parkingLotsCity.map((lot) => {
                        const isFav = favoriteLots.some(fav => fav._id === lot._id);
                        return (
                          <button
                            key={lot._id}
                            onClick={() => handleUpdateLocation(lot._id)}
                            className="cursor-pointer bg-surface-container-lowest hover:bg-primary/5 transition-all duration-300 p-5 rounded-2xl border border-outline-variant/40 hover:border-primary shadow-sm hover:shadow-lg hover:-translate-y-1 text-right flex flex-col gap-3 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label={`הצג את חניון ${lot.name}`}
                          >
                            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="flex justify-between items-start w-full">
                              <div className="flex flex-col gap-1 text-right">
                                <span className="font-headline-sm text-primary group-hover:text-primary-container transition-colors">{lot.name}</span>
                                <div className="flex items-center gap-1 text-on-surface-variant font-body-md justify-start">
                                  <span className="material-symbols-outlined text-sm">location_on</span>
                                  <span>{lot.address || lot.city?.name || submittedCity}</span>
                                </div>
                              </div>
                              
                              <div className="bg-primary/10 text-primary p-2 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                              </div>
                            </div>
                            
                            <div className="w-full pt-3 mt-1 border-t border-outline-variant/20 flex justify-between items-center gap-2">
                               <div className="flex gap-2">
                                 {lot.totalSpots && (
                                    <span className="bg-surface-container-high px-2 py-1 rounded-md text-label-sm text-on-surface font-bold group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                      {lot.totalSpots} סה"כ מקומות
                                    </span>
                                 )}
                                 {lot.spots && (
                                   <span className={`px-2 py-1 rounded-md text-label-sm transition-colors ${lot.spots.filter(s => s.status === 'free').length > 0 ? 'bg-blue-100/80 text-slate-900 font-extrabold group-hover:bg-blue-200 group-hover:text-black' : 'bg-error-container text-on-error-container font-bold'}`}>
                                     {lot.spots.filter(s => s.status === 'free').length} פנויים
                                   </span>
                                 )}
                               </div>
                               <div 
                                 onClick={(e) => toggleFavorite(e, lot)}
                                 className={`p-2 rounded-full transition-colors flex items-center justify-center hover:bg-yellow-500/10 ${isFav ? 'text-yellow-500' : 'text-outline-variant hover:text-yellow-500'}`}
                                 title="שמור למועדפים"
                               >
                                 <span className="material-symbols-outlined" style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                               </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    submittedCity && !loading && (
                      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 text-center shadow-inner">
                        <p className="text-on-surface-variant text-lg">
                          לא נמצאו חניונים בעיר "{submittedCity}"
                        </p>
                      </div>
                    )
                  )}

                  {!submittedCity && (
                     <div className="text-on-surface-variant font-body-md py-4 text-center">
                       הזן שם עיר (לדוגמה חולון) בתיבת החיפוש או בחר מהחיפושים האחרונים כדי לראות חניונים זמינים.
                     </div>
                  )}
                </div>
              </section>

              {recentSearches.length > 0 && (
                <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] border border-outline-variant/20 flex flex-col w-full">
                  <h2 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">history</span>
                    חיפושים אחרונים
                  </h2>
                  <ul className="flex flex-col sm:flex-row gap-4 sm:flex-wrap">
                    {recentSearches.map(city => (
                      <li key={city} onClick={() => handleSearchSubmit(city)} className="flex items-center gap-2 p-3 rounded-lg bg-surface-container-low hover:bg-outline-variant/30 transition-colors cursor-pointer group">
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-sm">history</span>
                        <span className="font-body-md text-body-md text-on-surface">{city}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </main>

  );
}