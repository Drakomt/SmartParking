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
      <nav className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex flex-row-reverse justify-between items-center px-gutter h-16">
      <div className="flex items-center gap-4">
        <NavLink
          to="/"
          onClick={() => window.dispatchEvent(new CustomEvent("reset-home"))}
        >
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-primary-fixed">
            SMART PARKING
          </span>
        </NavLink>
      </div>
      <div className="flex flex-row-reverse items-center gap-4 sm:gap-6">
        <button
          onClick={() => {
            if (window.location.pathname !== "/") {
              navigate("/", { state: { showFavorites: true } });
            } else {
              window.dispatchEvent(new CustomEvent("show-favorites"));
            }
          }}
          className="cursor-pointer text-on-surface hover:bg-yellow-500/10 transition-colors font-headline-sm text-headline-sm rounded-lg px-3 sm:px-4 py-2 flex items-center justify-center gap-1 sm:gap-2"
          title="חניונים שמורים"
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
              className="cursor-pointer text-primary bg-primary/10 hover:bg-primary/20 transition-colors font-headline-sm text-headline-sm rounded-lg px-3 sm:px-4 py-2 flex items-center justify-center"
            >
              איזור אישי
            </button>
            <button
              onClick={() => {
                logout();
                window.dispatchEvent(new CustomEvent("reset-home"));
                navigate("/", { replace: true, state: {} });
              }}
              className="cursor-pointer text-error hover:bg-error/10 transition-colors font-headline-sm text-headline-sm border border-error/30 rounded-lg px-3 sm:px-4 py-2 flex items-center justify-center"
            >
              התנתק
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="cursor-pointer text-secondary dark:text-secondary-fixed-dim hover:bg-secondary-container/10 transition-colors font-headline-sm text-headline-sm border border-secondary/30 rounded-lg px-3 sm:px-4 py-2 flex items-center justify-center"
          >
            כניסה למורשים
          </button>
        )}

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="cursor-pointer text-on-surface hover:bg-surface-container-high transition-colors rounded-lg p-2 flex items-center justify-center"
          title="תפריט"
        >
          <span className="material-symbols-outlined text-3xl">menu</span>
        </button>
      </div>

      </nav>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
