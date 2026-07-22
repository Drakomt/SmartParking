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
    <div className="relative flex flex-col items-center justify-center min-h-screen pt-16 w-full overflow-hidden">
      {/* Background Image (same as Hero) */}
      <div className="absolute inset-0 w-full h-full -z-10">
        <div className="bg-cover bg-center w-full h-full opacity-80" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA64VTqgTggEVtFrsRgJck0iW18vOJttvc0fJ-PZDM9McmLGlqp2qKjlZBLTy4u5Vlv055HUKsgsJwYCU89Ng2HvTlFlsq8CLHZMdTcrt0dlelz3ltdBh0k_svvmmJtqS50PdgxXNDyZu50r7Ggm2-e4eV5Jg5Xh73QKGXZkjxi_IM57b3Qr7d09ifYTEamtTTD8Xjn9XUhNg4QXDpKMojtZxtbAl0LsAoWbtv_XLKB1XdYxZuc5P8Mw0TnKwxhUz2Hy--sEYsKeA")' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background"></div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_40px_-10px_rgba(30,41,59,0.15)] border border-white/50 overflow-hidden m-4 relative z-10">
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-right">
            <h2 className="text-3xl font-headline-lg font-bold text-primary mb-2">כניסה למערכת</h2>
            <p className="text-body-md text-on-surface-variant">הכניסה למורשים בלבד!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-right">
              <label
                htmlFor="email"
                className="block text-label-md text-on-surface mb-2"
              >
                אימייל
              </label>
              <input
                name="email"
                type="email"
                id="email"
                value={fields.email}
                onChange={handleInputChange}
                className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                placeholder="הזן אימייל"
                disabled={isLoading}
              />
            </div>

            <div className="text-right">
              <label
                htmlFor="password"
                className="block text-label-md text-on-surface mb-2"
              >
                סיסמה
              </label>
              <input
                name="password"
                type="password"
                id="password"
                value={fields.password}
                onChange={handleInputChange}
                className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                placeholder="הזן סיסמה"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="p-4 bg-error-container/80 border border-error/20 rounded-xl text-on-error-container text-body-md font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="pt-4 flex justify-start">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex justify-center items-center w-full sm:w-auto font-headline-sm font-bold py-3 px-8 rounded-xl transition-all duration-300 focus:outline-none shadow-md
                  ${isLoading ? "bg-primary-container text-on-primary-container cursor-not-allowed opacity-70" : "bg-primary text-on-primary hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"}`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></div>
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