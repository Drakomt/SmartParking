import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 

export default function LoginForm() {
  const [fields, setFields] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate(); 

  const handleInputChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fields.email || !fields.password) {
      setError("אנא הזן אימייל וסיסמה.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:3000/api/auth/login", {
        email: fields.email,
        password: fields.password
      });

      console.log("התחברות בהצלחה:", response.data);
      
      setFields({ email: "", password: "" });
      
      navigate("/dashboard");
      
    } catch (err) {
      console.error("שגיאת התחברות:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("אירעה שגיאה בחיבור לשרת. נסה שוב מאוחר יותר.");
      }
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans text-slate-200"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="mb-8 text-right">
            <h2 className="text-2xl font-bold text-white mb-2">כניסה למערכת</h2>
            <p className="text-sm text-slate-400">הכניסה למורשים בלבד!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-right">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                אימייל
              </label>
              <input
                name="email"
                type="email"
                id="email"
                value={fields.email}
                onChange={handleInputChange}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="הזן אימייל"
                disabled={isLoading}
              />
            </div>

            <div className="text-right">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                סיסמה
              </label>
              <input
                name="password"
                type="password"
                id="password"
                value={fields.password}
                onChange={handleInputChange}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="הזן סיסמה"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="pt-2 flex justify-start">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex justify-center items-center text-white font-medium py-2.5 px-8 min-w-[120px] rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800
                  ${isLoading ? "bg-blue-800 cursor-not-allowed opacity-70" : "bg-blue-600 hover:bg-blue-500"}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "התחבר"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}