import { useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginForm() {
  const [fields, setFields] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

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
      const response = await api.post(
        "/api/auth/login",
        {
          email: fields.email,
          password: fields.password,
        },
      );

      login(response.data);
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
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-3 pb-6 pt-20 sm:px-4">
      <div className="absolute inset-0 w-full h-full -z-10">
        <div
          className="bg-cover bg-center w-full h-full opacity-80"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA64VTqgTggEVtFrsRgJck0iW18vOJttvc0fJ-PZDM9McmLGlqp2qKjlZBLTy4u5Vlv055HUKsgsJwYCU89Ng2HvTlFlsq8CLHZMdTcrt0dlelz3ltdBh0k_svvmmJtqS50PdgxXNDyZu50r7Ggm2-e4eV5Jg5Xh73QKGXZkjxi_IM57b3Qr7d09ifYTEamtTTD8Xjn9XUhNg4QXDpKMojtZxtbAl0LsAoWbtv_XLKB1XdYxZuc5P8Mw0TnKwxhUz2Hy--sEYsKeA")',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background"></div>
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface/90 shadow-[0_20px_40px_-10px_rgba(30,41,59,0.15)] backdrop-blur-2xl sm:rounded-3xl">
        <div className="p-5 sm:p-8">
          <div className="mb-6 text-right">
            <h2 className="text-3xl font-headline-lg font-bold text-primary mb-2">
              כניסה למערכת
            </h2>
            <p className="text-body-md text-on-surface-variant">
              הכניסה למורשים בלבד!
            </p>
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
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className="text-right">
              <label
                htmlFor="password"
                className="block text-label-md text-on-surface mb-2"
              >
                סיסמה
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={fields.password}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl pr-4 pl-12 py-3 text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                  placeholder="הזן סיסמה"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-1 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
                  title={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                  aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
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
                className={`flex min-h-12 w-full items-center justify-center rounded-xl px-8 py-3 font-bold shadow-md transition-all duration-300 focus:outline-none sm:w-auto
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
