import { LogIn } from "lucide-react";
import { NavLink, Router, useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
export default function NavBar() {
  const navigate = useNavigate();
  return (
    
    <nav className="flex items-center justify-between px-8 h-[68px] bg-slate-900/95 border-b border-sky-400/15 relative">
      
      <div className="absolute inset-0 bg-gradient-to-r from-sky-400/5 to-transparent pointer-events-none" />
      
      <NavLink className="flex items-center gap-3 z-10" to="/">
        <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-teal-400 bg-clip-text text-transparent tracking-tight">
          Smart Parking
        </span>
      </NavLink>

      <div className="flex items-center gap-6 z-10">
        
        <div className="flex gap-6 flex-row-reverse">
          <NavLink to="/" className="text-sm text-slate-400 hover:text-sky-400 transition-colors duration-200 no-underline">
            אודות
          </NavLink>
        </div>

        <button onClick={()=>{navigate("/login")}} className="flex items-center gap-2 px-4 py-2 bg-transparent border border-sky-400/50 hover:border-sky-400 hover:bg-sky-400/10 rounded-lg text-sky-400 text-sm font-medium transition-all duration-200">
           כניסה למורשים 
        </button>
      </div>

    </nav>
  );
}