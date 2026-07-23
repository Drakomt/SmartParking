import { useState, useEffect } from "react";
import { useUserParkingLots } from "../hooks/useUserParkingLots";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
  const { parkingLots, loading, error } = useUserParkingLots();
  const [view, setView] = useState("list");
  const [user] = useState(() => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.log(e);
      return null;
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div
      className="relative min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full overflow-hidden"
      dir="rtl"
    >
      {/* Background Image (same as Hero/Login) */}
      <div className="absolute inset-0 w-full h-full -z-10 fixed">
        <div
          className="bg-cover bg-center w-full h-full opacity-80"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA64VTqgTggEVtFrsRgJck0iW18vOJttvc0fJ-PZDM9McmLGlqp2qKjlZBLTy4u5Vlv055HUKsgsJwYCU89Ng2HvTlFlsq8CLHZMdTcrt0dlelz3ltdBh0k_svvmmJtqS50PdgxXNDyZu50r7Ggm2-e4eV5Jg5Xh73QKGXZkjxi_IM57b3Qr7d09ifYTEamtTTD8Xjn9XUhNg4QXDpKMojtZxtbAl0LsAoWbtv_XLKB1XdYxZuc5P8Mw0TnKwxhUz2Hy--sEYsKeA")',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_20px_40px_-10px_rgba(30,41,59,0.15)] border border-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline-lg font-bold text-primary">
              שלום, {user.fullName}
            </h1>
          </div>

          <button
            onClick={() => setView(view === "list" ? "create" : "list")}
            className="bg-primary text-on-primary hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 font-headline-sm font-bold py-3 px-6 rounded-xl transition-all duration-300 focus:outline-none shadow-md"
          >
            {view === "list" ? "יצירת חניון חדש" : "חזרה לרשימה"}
          </button>
        </div>

        {/* Content Section */}
        {view === "list" ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary mr-2">
              החניונים שלי
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="bg-error-container/80 backdrop-blur-md border border-error/20 rounded-2xl p-6 text-center">
                <p className="text-on-error-container text-body-lg">{error}</p>
              </div>
            ) : parkingLots.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-12 shadow-sm border border-white/40 text-center">
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  אין לך עדיין חניונים
                </h3>
                <p className="text-on-surface-variant mb-6">
                  לחץ על כפתור "יצירת חניון חדש" כדי להתחיל
                </p>
                <button
                  onClick={() => setView("create")}
                  className="bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 font-bold py-2 px-6 rounded-lg transition-all"
                >
                  צור את החניון הראשון שלך
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parkingLots.map((lot) => (
                  <div
                    key={lot._id}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-md border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-on-surface">
                        {lot.name}
                      </h3>
                    </div>
                    <div className="space-y-2 text-on-surface-variant text-body-md">
                      <p>
                        <span className="font-medium text-on-surface">
                          כתובת:
                        </span>{" "}
                        {lot.address}
                      </p>
                      <p>
                        {" "}
                        <span className="font-medium text-on-surface">
                          סך הכל חניות:
                        </span>{" "}
                        {lot.totalSpots}
                      </p>
                      <p>
                        {" "}
                        <span className="font-medium text-on-surface">
                          מפלסים:
                        </span>{" "}
                        {lot.levels}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-end">
                      <button className="text-primary hover:text-primary/80 font-bold text-label-lg transition-colors">
                        ניהול חניון ←
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_40px_-10px_rgba(30,41,59,0.15)] border border-white/50 min-h-[60vh] flex flex-col">
            <h2 className="text-2xl font-bold text-primary mb-6">
              קנבס ליצירת חניון חדש
            </h2>

            <div className="flex-grow border-2 border-dashed border-outline rounded-2xl bg-surface-container-lowest/50 flex flex-col items-center justify-center p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">🗺️</div>
              <h3 className="text-xl font-bold text-on-surface mb-2">
                אזור עיצוב החניון בבנייה
              </h3>
              <p className="text-on-surface-variant max-w-md">
                כאן יוצג קנבס מתקדם שיאפשר לך למקם את החניות בצורה חזותית על גבי
                מפה או תרשים. (פיצ'ר עתידי)
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setView("list")}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface font-bold py-3 px-6 rounded-xl transition-all"
              >
                ביטול
              </button>
              <button
                disabled
                className="bg-primary/50 text-on-primary font-bold py-3 px-8 rounded-xl cursor-not-allowed"
              >
                שמור חניון
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
