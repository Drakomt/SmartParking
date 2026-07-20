import { NavLink, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-primary/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex flex-row-reverse justify-between items-center px-gutter h-16">
      <div className="flex items-center gap-4">
        <NavLink to="/">
          <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">SMART PARKING</span>
        </NavLink>
      </div>
      <div className="flex flex-row-reverse items-center gap-6">
        
        <button onClick={() => { navigate("/login") }} className="cursor-pointer text-secondary dark:text-secondary-fixed-dim hover:bg-secondary-container/10 transition-colors font-headline-sm text-headline-sm border border-secondary/30 rounded-lg px-4 py-2 flex items-center justify-center">
          כניסה למורשים
        </button>
      </div>
    </nav>
  );
}