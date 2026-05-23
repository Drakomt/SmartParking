import { useState } from "react";

export default function SearchInput({ onSearch }) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (inputValue.trim() !== "") {
      onSearch(inputValue.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full mb-6">
      <input
        type="text"
        placeholder="חפש עיר (לדוגמה: חולון)..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-full bg-slate-700/50 text-white placeholder-slate-400 px-5 py-3 rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300"
      />

      <button
        type="submit"
        className="px-5 py-2 bg-transparent border border-slate-600 hover:border-sky-400 hover:bg-sky-400/10 text-slate-300 hover:text-sky-400 rounded-xl transition-all duration-300 font-medium z-10"
      >
        חפש
      </button>
    </form>
  );
}
