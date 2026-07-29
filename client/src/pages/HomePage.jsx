import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import ParkingLotView from "../components/ParkingLotView";
import useParkingLots from "../hooks/useParkingLots";
import SearchInput from "../components/SearchInput";
import useCities from "../hooks/useCities";
import useParkingData from "../hooks/useParkingData";
import ParkingLotCard from "../components/ParkingLotCard";

export default function HomePage() {
  const [submittedCity, setSubmittedCity] = useState("");
  const { parkingLotsCity, loading, error } = useParkingLots(submittedCity);
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

  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      setNearbyError("הדפדפן שלך לא תומך בשירותי מיקום.");
      return;
    }

    setIsLocating(true);
    setNearbyError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/parking/nearby?lat=${latitude}&lng=${longitude}`
          );
          console.log("Nearby lots:", res.data);
          alert("חניונים קרובים נטענו (יש לעדכן את התצוגה בהתאם למבנה הנתונים).");
        } catch (err) {
          console.error("Nearby API error:", err);
          setNearbyError("תקלה בעת הזיהוי חניונים קרובים.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setNearbyError("אנא אשר גישה למיקום בדפדפן כדי למצוא חניונים קרובים.");
        } else {
          setNearbyError("שגיאה באיתור המיקום שלך.");
        }
      }
    );
  };

  useEffect(() => {
    if (location.state?.showFavorites) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowFavorites(true);
      navigate(".", { replace: true, state: {} });
    } else if (location.state?.selectedAdminLot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedParkingLotId(location.state.selectedAdminLot);
      if (location.state.cityName) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSubmittedCity(location.state.cityName);
      }
    }
  }, [location.state, navigate]);

  const toggleFavorite = (e, lot) => {
    e.stopPropagation(); // Prevent opening the parking lot
    setFavoriteLots((prevFavorites) => {
      let newFavorites;
      const exists = prevFavorites.some((fav) => fav._id === lot._id);
      if (exists) {
        newFavorites = prevFavorites.filter((fav) => fav._id !== lot._id);
      } else {
        // Store just enough info to render the card
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
  } = useParkingData(selectedParkingLotId, currentLevel, submittedCity);

  // Removed duplicate onBack

  const handleUpdateLocation = (lotId) => {
    setSelectedParkingLotId(lotId);
    setCurrentLevel(1);
  };

  const selectedLotName =
    parkingLotsCity?.find((lot) => lot._id === selectedParkingLotId)?.name ||
    favoriteLots?.find((lot) => lot._id === selectedParkingLotId)?.name ||
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
              isAdmin={location.state?.adminMode || false}
              lotId={selectedParkingLotId}
            />
          )}
        </div>
      ) : showFavorites ? (
        <div className="max-w-7xl mx-auto px-container-padding py-section-margin w-full flex flex-col gap-section-margin mt-8">
          <section className="flex flex-col w-full">
            <h2 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-500">
                star
              </span>
              חניונים שמורים
            </h2>
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] border border-outline-variant/20 flex-grow min-h-[300px]">
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
          <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
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
            <div className="relative z-10 w-full max-w-4xl px-container-padding text-right">
              <h1 className="text-4xl sm:text-5xl md:text-3xl font-black text-primary mb-6 drop-shadow-lg tracking-tight">
                מצא את החניה המושלמת בעיר שלך
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl">
                מערכת ניהול חניונים מתקדמת ופשוטה לשימוש. הזן את שם העיר כדי
                למצוא זמינות בזמן אמת.
              </p>
              <div className="relative z-[999]">
                <SearchInput
                  onSearch={handleSearchSubmit}
                  availableCities={citiesInDatabase}
                />
              </div>
              <div className="mt-6 flex flex-col items-center relative z-0">
                <button
                  onClick={handleFindNearMe}
                  disabled={isLocating}
                  className="bg-surface-container-highest/80 backdrop-blur-sm hover:bg-primary/20 text-primary font-bold py-3 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 border border-primary/30 disabled:opacity-50"
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

          <div className="max-w-7xl mx-auto px-container-padding py-section-margin w-full flex flex-col gap-section-margin">
            <div className="flex flex-col gap-section-margin w-full">
              <section className="flex flex-col w-full">
                <h2 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    local_parking
                  </span>
                  {submittedCity
                    ? `תוצאות חיפוש עבור "${submittedCity}"`
                    : "חניונים מומלצים"}
                </h2>

                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] border border-outline-variant/20 flex-grow">
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

                  {submittedCity &&
                  !loading &&
                  parkingLotsCity &&
                  parkingLotsCity.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {parkingLotsCity.map((lot) => {
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
                            fallbackCityName={submittedCity}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    submittedCity &&
                    !loading && (
                      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 text-center shadow-inner">
                        <p className="text-on-surface-variant text-lg">
                          לא נמצאו חניונים בעיר "{submittedCity}"
                        </p>
                      </div>
                    )
                  )}

                  {!submittedCity && (
                    <div className="text-on-surface-variant font-body-md py-4 text-center">
                      הזן שם עיר (לדוגמה חולון) בתיבת החיפוש או בחר מהחיפושים
                      האחרונים כדי לראות חניונים זמינים.
                    </div>
                  )}
                </div>
              </section>

              {recentSearches.length > 0 && (
                <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] border border-outline-variant/20 flex flex-col w-full">
                  <h2 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
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
                        className="flex items-center gap-2 p-3 rounded-lg bg-surface-container-low hover:bg-outline-variant/30 transition-colors cursor-pointer group"
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
