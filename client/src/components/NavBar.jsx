import { NavLink, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-primary/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex flex-row-reverse justify-between items-center px-gutter h-16">
      <div className="flex items-center gap-4">
        <NavLink 
          to="/" 
          onClick={() => window.dispatchEvent(new CustomEvent("reset-home"))}
        >
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-primary-fixed">SMART PARKING</span>
        </NavLink>
      </div>
      <div className="flex flex-row-reverse items-center gap-4 sm:gap-6">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent("show-favorites"))} 
          className="cursor-pointer text-black hover:bg-yellow-500/10 transition-colors font-headline-sm text-headline-sm rounded-lg px-3 sm:px-4 py-2 flex items-center justify-center gap-1 sm:gap-2"
          title="חניונים שמורים"
        >
          <span className="hidden sm:inline">חניונים שמורים</span>
        </button>
        <button onClick={() => { navigate("/login") }} className="cursor-pointer text-secondary dark:text-secondary-fixed-dim hover:bg-secondary-container/10 transition-colors font-headline-sm text-headline-sm border border-secondary/30 rounded-lg px-3 sm:px-4 py-2 flex items-center justify-center">
          כניסה למורשים
        </button>
      </div>
    </nav>
  );
}