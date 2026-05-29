import { useState } from "react";

export default function LoginForm() {
  const [fields, setFields] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(fields);
    
    setFields({ username: "", password: "" })
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
                htmlFor="username"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                שם משתמש
              </label>
              <input
                name="username"
                type="text"
                id="username"
                value={fields.username}
                onChange={handleInputChange}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="הזן שם משתמש"
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
              />
            </div>
            {error && (
              <div className="mb-6 p-3 rounded-lg text-red-400 text-sm">
                שגיאה: {error}
              </div>
            )}
            <div className="pt-2 flex justify-start">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                onClick={handleSubmit}
              >
                התחבר
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
