import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";

export default function NavBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <nav className="app-navbar fixed top-0 z-50 flex w-full flex-row-reverse items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-3 shadow-sm backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center">
        <NavLink
          to="/"
          onClick={() => window.dispatchEvent(new CustomEvent("reset-home"))}
          className="flex min-h-11 min-w-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Smart Parking - דף הבית"
        >
          <span className="whitespace-nowrap text-[clamp(1rem,4.5vw,1.35rem)] font-black tracking-tight text-primary dark:text-primary-fixed sm:text-3xl">
            SMART PARKING
          </span>
        </NavLink>
      </div>
      <div className="flex shrink-0 flex-row-reverse items-center gap-1 sm:gap-4">
        <button
          onClick={() => {
            if (window.location.pathname !== "/") {
              navigate("/", { state: { showFavorites: true } });
            } else {
              window.dispatchEvent(new CustomEvent("show-favorites"));
            }
          }}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-on-surface transition-colors hover:bg-yellow-500/10 sm:px-4"
          title="חניונים שמורים"
          aria-label="חניונים שמורים"
        >
          <span className="material-symbols-outlined text-yellow-500 text-lg sm:text-xl">
            star
          </span>
          <span className="hidden sm:inline">חניונים שמורים</span>
        </button>

        {user ? (
          <>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary/10 p-2 font-bold text-primary transition-colors hover:bg-primary/20 sm:px-4"
              aria-label="אזור אישי"
            >
              <span className="material-symbols-outlined" aria-hidden="true">account_circle</span>
              <span className="hidden sm:inline">אזור אישי</span>
            </button>
            <button
              onClick={() => {
                logout();
                window.dispatchEvent(new CustomEvent("reset-home"));
                navigate("/", { replace: true, state: {} });
              }}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-error/30 p-2 font-bold text-error transition-colors hover:bg-error/10 sm:px-4"
              aria-label="התנתקות"
            >
              <span className="material-symbols-outlined" aria-hidden="true">logout</span>
              <span className="hidden sm:inline">התנתק</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-2.5 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-3"
            title="כניסה למנהלים"
          >
            <span className="material-symbols-outlined text-[19px]" aria-hidden="true">login</span>
            <span className="hidden sm:inline">כניסה למורשים</span>
          </button>
        )}

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl p-2 text-on-surface transition-colors hover:bg-surface-container-high"
          title="תפריט"
          aria-label="פתיחת תפריט"
        >
          <span className="material-symbols-outlined text-3xl">menu</span>
        </button>
      </div>

      </nav>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
