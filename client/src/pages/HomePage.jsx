import { useState, useEffect } from "react";
import api from "../lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import ParkingLotView from "../components/ParkingLotView";
import useParkingLots from "../hooks/useParkingLots";
import SearchInput from "../components/SearchInput";
import useCities from "../hooks/useCities";
import useParkingData from "../hooks/useParkingData";
import ParkingLotCard from "../components/ParkingLotCard";

export default function HomePage() {
  const [submittedCity, setSubmittedCity] = useState("");
  const { parkingLotsCity, loading, error, refreshLots } = useParkingLots(submittedCity);
  const citiesInDatabase = useCities();

  const [selectedParkingLotId, setSelectedParkingLotId] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showFavorites, setShowFavorites] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const storedSearches = localStorage.getItem("smartParking_recentSearches");
    if (storedSearches) {
      return JSON.parse(storedSearches);
    }
    return [];
  });
  const [favoriteLots, setFavoriteLots] = useState(() => {
    const storedFavorites = localStorage.getItem("smartParking_favorites");
    if (storedFavorites) {
      return JSON.parse(storedFavorites);
    }
    return [];
  });

  const location = useLocation();
  const navigate = useNavigate();

  const [isLocating, setIsLocating] = useState(false);
  const [nearbyError, setNearbyError] = useState(null);
  const [nearbyLots, setNearbyLots] = useState(null);
  const [allNearbyLots, setAllNearbyLots] = useState(null);
  const [searchRadius, setSearchRadius] = useState(2);

  const handleFindNearMe = (showError = true) => {
    if (!navigator.geolocation) {
      if (showError === true) setNearbyError("הדפדפן שלך לא תומך בשירותי מיקום.");
      return;
    }

    setIsLocating(true);
    setNearbyError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await api.get("/api/parking/nearby", {
            params: { lat: latitude, lng: longitude },
          });
          setAllNearbyLots(res.data);
          
          let initialRadius = 2;
          let withinRadius = res.data.filter(lot => lot.distanceKm <= initialRadius);
          
          if (withinRadius.length === 0 && res.data.length > 0) {
            withinRadius = res.data.slice(0, 2);
            initialRadius = Math.ceil(withinRadius[withinRadius.length - 1].distanceKm);
          }
          
          setSearchRadius(initialRadius);
          setNearbyLots(withinRadius);
          setSubmittedCity("");
        } catch (err) {
          console.error("Nearby API error:", err);
          if (showError === true) setNearbyError("תקלה בעת הזיהוי חניונים קרובים.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (showError === true) {
          if (error.code === error.PERMISSION_DENIED) {
            setNearbyError("אנא אשר גישה למיקום בדפדפן כדי למצוא חניונים קרובים.");
          } else {
            setNearbyError("שגיאה באיתור המיקום שלך.");
          }
        }
      }
    );
  };

  const handleShowMoreNearby = () => {
    if (allNearbyLots) {
      const nextLot = allNearbyLots.find(lot => lot.distanceKm > searchRadius);
      if (nextLot) {
        const jumpRadius = Math.ceil(nextLot.distanceKm);
        const newRadius = Math.max(searchRadius + 2, jumpRadius);
        
        setSearchRadius(newRadius);
        const withinRadius = allNearbyLots.filter(lot => lot.distanceKm <= newRadius);
        setNearbyLots(withinRadius);
      }
    }
  };

  useEffect(() => {
    if (!location.state?.selectedAdminLot && !location.state?.showFavorites && !submittedCity) {
      handleFindNearMe(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.state?.showFavorites) {
      setShowFavorites(true);
      navigate(".", { replace: true, state: {} });
    } else if (location.state?.selectedAdminLot) {
      setSelectedParkingLotId(location.state.selectedAdminLot);
      if (location.state.cityName) {
        setSubmittedCity(location.state.cityName);
      }
    }
  }, [location.state, navigate]);

  const toggleFavorite = (e, lot) => {
    e.stopPropagation();
    setFavoriteLots((prevFavorites) => {
      let newFavorites;
      const exists = prevFavorites.some((fav) => fav._id === lot._id);
      if (exists) {
        newFavorites = prevFavorites.filter((fav) => fav._id !== lot._id);
      } else {
        const { _id, name, address, city, totalSpots, spots } = lot;
        newFavorites = [
          ...prevFavorites,
          { _id, name, address, city, totalSpots, spots },
        ];
      }
      localStorage.setItem(
        "smartParking_favorites",
        JSON.stringify(newFavorites),
      );
      return newFavorites;
    });
  };

  const onBack = () => {
    if (location.state?.adminMode) {
      navigate("/dashboard", {
        state: { selectedCityId: location.state.selectedCityId },
      });
    } else {
      setSelectedParkingLotId(null);
      setCurrentLevel(1);
    }
  };

  useEffect(() => {
    const handleReset = () => {
      setSelectedParkingLotId(null);
      setCurrentLevel(1);
      setShowFavorites(false);
      setNearbyLots(null);
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
    setNearbyLots(null);
    setSubmittedCity(city);
    if (city && city.trim() !== "") {
      const newSearches = [
        city,
        ...recentSearches.filter((s) => s !== city),
      ].slice(0, 5);
      setRecentSearches(newSearches);
      localStorage.setItem(
        "smartParking_recentSearches",
        JSON.stringify(newSearches),
      );
    }
  };

  const {
    parkings,
    totalLevels,
    isLoading: isLoadingSlots,
    error: slotsError,
    refreshData,
  } = useParkingData(selectedParkingLotId, currentLevel, submittedCity);

  const handleUpdateLocation = (lotId) => {
    setSelectedParkingLotId(lotId);
    setCurrentLevel(1);
  };

  const selectedLot = 
    nearbyLots?.find((lot) => lot._id === selectedParkingLotId) ||
    parkingLotsCity?.find((lot) => lot._id === selectedParkingLotId) ||
    favoriteLots?.find((lot) => lot._id === selectedParkingLotId) ||
    null;

  const selectedLotName =
    location.state?.lotName ||
    selectedLot?.name ||
    "";

  return (
    <main className="flex-grow pt-16">
      {selectedParkingLotId ? (
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-3 py-6 sm:px-6 sm:py-10">
          {isLoadingSlots ? (
            <div className="text-center p-8 bg-surface-container-highest rounded-3xl shadow-xl border border-outline-variant/20 w-full max-w-lg mt-6">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-primary text-lg">טוען נתוני חניון...</p>
            </div>
          ) : slotsError ? (
            <div className="text-center p-8 bg-error-container rounded-3xl shadow-xl border border-error/50 w-full max-w-lg mt-6">
              <p className="text-error text-lg mb-4">שגיאה: {slotsError}</p>
              <button
                onClick={onBack}
                className="cursor-pointer px-5 py-2 border border-error text-error hover:bg-error/10 rounded-xl transition-all"
              >
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
              lotLocation={selectedLot?.location}
              isAdmin={location.state?.adminMode || false}
              lotId={selectedParkingLotId}
              onSpotsChanged={(targetLevel) => {
                if (targetLevel !== undefined) {
                  setCurrentLevel(targetLevel);
                  refreshData(targetLevel);
                } else {
                  refreshData();
                }
                refreshLots();
                if (nearbyLots) {
                  handleFindNearMe(false);
                }
              }}
            />
          )}
        </div>
      ) : showFavorites ? (
        <div className="mx-auto mt-4 flex w-full max-w-7xl flex-col gap-6 px-3 py-6 sm:mt-8 sm:gap-10 sm:px-6 sm:py-10">
          <section className="flex flex-col w-full">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex min-w-0 items-center gap-2 text-xl font-bold text-primary sm:text-2xl">
                <span className="material-symbols-outlined text-yellow-500">
                  star
                </span>
                חניונים שמורים
              </h2>
              {favoriteLots.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("האם אתה בטוח שברצונך למחוק את כל החניונים השמורים?")) {
                      setFavoriteLots([]);
                      localStorage.removeItem("smartParking_favorites");
                    }
                  }}
                  className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-error/50 px-3 py-2 font-medium text-error transition-colors hover:border-error hover:bg-error/10 sm:px-4"
                  title="נקה מועדפים"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span className="hidden sm:inline">נקה הכל</span>
                </button>
              )}
            </div>
            <div className="min-h-[260px] flex-grow rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] sm:min-h-[300px] sm:p-6">
              {favoriteLots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteLots.map((lot) => {
                    const isFav = favoriteLots.some(
                      (fav) => fav._id === lot._id,
                    );
                    return (
                      <ParkingLotCard
                        key={lot._id}
                        lot={lot}
                        isFavorite={isFav}
                        onClick={() => handleUpdateLocation(lot._id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-on-surface-variant font-body-md py-10 flex flex-col items-center justify-center gap-4 text-center h-full">
                  <span className="material-symbols-outlined text-6xl text-outline-variant/50">
                    star
                  </span>
                  עדיין לא שמרת חניונים מועדפים.
                  <br />
                  חפש עיר ולחץ על הכוכב ליד חניון כדי לשמור אותו כאן.
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-start">
              <button
                onClick={() => setShowFavorites(false)}
                className="cursor-pointer px-4 py-2 bg-transparent border border-outline-variant/50 hover:border-primary hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-xl transition-all duration-300 font-medium flex items-center gap-2"
              >
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ transform: "rotate(180deg)" }}
                >
                  arrow_back
                </span>
                חזור
              </button>
            </div>
          </section>
        </div>
      ) : (
        <>
          <section className="relative flex min-h-[540px] w-full items-center justify-center overflow-hidden py-12 sm:h-[60vh] sm:min-h-[500px] sm:py-0">
            <div className="absolute inset-0 w-full h-full">
              <div
                className="bg-cover bg-center w-full h-full opacity-80"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA64VTqgTggEVtFrsRgJck0iW18vOJttvc0fJ-PZDM9McmLGlqp2qKjlZBLTy4u5Vlv055HUKsgsJwYCU89Ng2HvTlFlsq8CLHZMdTcrt0dlelz3ltdBh0k_svvmmJtqS50PdgxXNDyZu50r7Ggm2-e4eV5Jg5Xh73QKGXZkjxi_IM57b3Qr7d09ifYTEamtTTD8Xjn9XUhNg4QXDpKMojtZxtbAl0LsAoWbtv_XLKB1XdYxZuc5P8Mw0TnKwxhUz2Hy--sEYsKeA")',
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background"></div>
            </div>
            <div className="relative z-10 w-full max-w-4xl px-4 text-right sm:px-6">
              <h1 className="mb-4 max-w-2xl text-3xl font-black leading-tight tracking-tight text-primary drop-shadow-lg sm:mb-6 sm:text-5xl md:text-4xl">
                מצא את החניה המושלמת בעיר שלך
              </h1>
              <p className="mb-7 max-w-2xl text-base leading-7 text-on-surface-variant sm:mb-10 sm:text-lg">
                מערכת ניהול חניונים מתקדמת ופשוטה לשימוש. הזן את שם העיר כדי
                למצוא זמינות בזמן אמת.
              </p>
              <div className="relative z-[999]">
                <SearchInput
                  onSearch={handleSearchSubmit}
                  availableCities={citiesInDatabase}
                />
              </div>
              <div className="relative z-0 mr-0 mt-7 flex w-full max-w-3xl flex-col items-center sm:mt-10">
                <button
                  onClick={() => handleFindNearMe(true)}
                  disabled={isLocating}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-surface-container-highest/90 px-5 py-3 font-bold text-primary shadow-lg backdrop-blur-sm transition-colors hover:bg-primary/20 disabled:opacity-50 sm:w-auto sm:px-6"
                >
                  {isLocating ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="material-symbols-outlined">my_location</span>
                  )}
                  {isLocating ? "מאתר את מיקומך..." : "מצא חניונים קרובים אליי"}
                </button>
                {nearbyError && (
                  <p className="text-error bg-error-container/80 backdrop-blur-sm px-4 py-2 rounded-lg mt-3 font-bold text-sm shadow-sm">
                    {nearbyError}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-7 sm:gap-10 sm:px-6 sm:py-10">
            <div className="flex w-full flex-col gap-6 sm:gap-10">
              <section className="flex flex-col w-full">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-primary sm:text-2xl">
                  <span className="material-symbols-outlined text-primary">
                    local_parking
                  </span>
                  {nearbyLots 
                    ? "חניונים קרובים אליך"
                    : submittedCity
                    ? `תוצאות חיפוש עבור "${submittedCity}"`
                    : "חניונים מומלצים"}
                </h2>

                <div className="flex-grow rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] sm:p-6">
                  {submittedCity && loading && (
                    <div className="text-primary mb-4 font-body-md">
                      מחפש חניונים...
                    </div>
                  )}
                  {submittedCity && error && (
                    <div className="text-error mb-4 font-body-md">
                      שגיאה: {error}
                    </div>
                  )}

                  {(nearbyLots && nearbyLots.length > 0) || (submittedCity && !loading && parkingLotsCity && parkingLotsCity.length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(nearbyLots || parkingLotsCity).map((lot) => {
                        const isFav = favoriteLots.some(
                          (fav) => fav._id === lot._id,
                        );
                        return (
                          <div key={lot._id} className="animate-fade-in-up h-full">
                            <ParkingLotCard
                              lot={lot}
                              isFavorite={isFav}
                              onClick={() => handleUpdateLocation(lot._id)}
                              onToggleFavorite={toggleFavorite}
                              fallbackCityName={lot.city?.name || submittedCity || "קרובים אליי"}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    (nearbyLots && nearbyLots.length === 0) ? (
                      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 text-center shadow-inner">
                        <p className="text-on-surface-variant text-lg">
                          לא נמצאו חניונים ברדיוס הקרוב אליך
                        </p>
                      </div>
                    ) : (submittedCity && !loading) ? (
                      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 text-center shadow-inner">
                        <p className="text-on-surface-variant text-lg">
                          לא נמצאו חניונים בעיר "{submittedCity}"
                        </p>
                      </div>
                    ) : null
                  )}

                  {!submittedCity && !nearbyLots && (
                    <div className="text-on-surface-variant font-body-md py-4 text-center">
                      הזן שם עיר (לדוגמה חולון) בתיבת החיפוש, בחר מהחיפושים האחרונים, או השתמש במיקום שלך כדי לראות חניונים זמינים.
                    </div>
                  )}
                </div>
              </section>

              {nearbyLots && allNearbyLots && nearbyLots.length < allNearbyLots.length && (
                <div className="flex justify-center mb-6">
                  <button
                    onClick={handleShowMoreNearby}
                    className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl px-6 py-3 transition-colors flex items-center gap-2 border border-primary/20"
                  >
                    <span className="material-symbols-outlined">expand_more</span>
                    הצג עוד
                  </button>
                </div>
              )}

              {recentSearches.length > 0 && (
                <section className="flex w-full flex-col rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-primary sm:text-2xl">
                    <span className="material-symbols-outlined text-primary">
                      history
                    </span>
                    חיפושים אחרונים
                  </h2>
                  <ul className="flex flex-col sm:flex-row gap-4 sm:flex-wrap">
                    {recentSearches.map((city) => (
                      <li
                        key={city}
                        onClick={() => handleSearchSubmit(city)}
                        className="group flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-surface-container-low p-3 transition-colors hover:bg-outline-variant/30"
                      >
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-sm">
                          history
                        </span>
                        <span className="font-body-md text-body-md text-on-surface">
                          {city}
                        </span>
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
