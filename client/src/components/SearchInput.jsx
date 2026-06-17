import { useState } from "react";

export default function SearchInput({ onSearch, availableCities = [] }) {
  const [inputValue, setInputValue] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setActiveIndex(-1);

    if (value.trim() !== "") {
      const filtered = availableCities.filter((city) =>
        city.name.startsWith(value)
      );
      setFilteredCities(filtered);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (city) => {
    setInputValue(city.name);
    setIsOpen(false);
    setActiveIndex(-1);
    
    onSearch(city.name); 
  };

  const handleKeyDown = (e) => {
    if (!isOpen || filteredCities.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredCities.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < filteredCities.length) {
        e.preventDefault();
        handleSuggestionClick(filteredCities[activeIndex]);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== "") {
      setIsOpen(false);
      setActiveIndex(-1);
      onSearch(inputValue.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full mb-6">
      <div className="flex gap-3 w-full">
        <input
          type="text"
          placeholder="חפש עיר (לדוגמה: חולון)..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full bg-slate-700/50 text-white placeholder-slate-400 px-5 py-3 rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300"
        />

        <button
          type="submit"
          className="cursor-pointer px-5 py-2 bg-transparent border border-slate-600 hover:border-sky-400 hover:bg-sky-400/10 text-slate-300 hover:text-sky-400 rounded-xl transition-all duration-300 font-medium z-10 shrink-0"
        >
          חפש
        </button>
      </div>

      {isOpen && (
        <ul className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto text-right pr-0">
          {filteredCities.length > 0 ? (
            filteredCities.map((city, index) => {
              const isActive = index === activeIndex;

              return (
                <li
                  key={city._id || index}
                  onClick={() => handleSuggestionClick(city)}
                  className={`cursor-pointer px-5 py-3 transition-colors border-b border-slate-700/50 last:border-none font-medium
                    ${isActive ? "bg-slate-600 text-white" : "text-slate-200 hover:bg-slate-600 hover:text-white"}
                  `}
                >
                  {city.name}
                </li>
              );
            })
          ) : (
            <li className="px-5 py-4 text-slate-400 text-center">
              לא נמצאו ערים במאגר
            </li>
          )}
        </ul>
      )}
    </form>
  );
}