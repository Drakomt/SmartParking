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

  const renderHighlightedText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^(${escapedHighlight})`, 'i');
    const parts = text.split(regex);
    return (
      <span className="font-body-md text-on-surface">
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="font-bold">{part}</span> : part
        )}
      </span>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-5 w-full sm:mb-6">
      <div className="mr-0 flex max-w-3xl items-center gap-2 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-[0_20px_40px_-10px_rgba(30,41,59,0.15)] backdrop-blur-2xl transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        
        <div className="flex-grow relative">
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            id="city-search-input"
            type="text"
            placeholder="הזן שם עיר (לדוגמה: חולון)"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="min-h-12 w-full border-none bg-transparent py-3 pl-2 pr-11 text-right text-base text-on-surface outline-none focus:outline-none focus:ring-0 focus:border-transparent placeholder:text-outline sm:py-4 sm:pl-4 sm:pr-12 sm:text-lg"
            style={{ outline: 'none', boxShadow: 'none' }}
            aria-label="שם עיר לחיפוש חניה"
          />

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_-10px_rgba(30,41,59,0.15)] border border-outline-variant/20 overflow-hidden z-50">
              <ul className="flex flex-col m-0 p-0">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city, index) => {
                    const isActive = index === activeIndex;

                    return (
                      <li
                        key={city._id || index}
                        onClick={() => handleSuggestionClick(city)}
                        className={`min-h-12 px-4 py-3 cursor-pointer transition-colors border-b border-outline-variant/10 last:border-none
                          ${isActive ? "bg-surface-container-low" : "hover:bg-surface-container-low"}
                        `}
                      >
                        <div className="flex items-center gap-2 text-right w-full">
                          <span className="material-symbols-outlined text-outline text-sm">location_on</span>
                          {renderHighlightedText(city.name, inputValue)}
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="px-5 py-4 text-on-surface-variant text-center">
                    לא נמצאו ערים במאגר
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="min-h-12 shrink-0 cursor-pointer rounded-xl bg-primary px-4 py-3 font-bold text-on-primary shadow-md transition-colors hover:bg-primary-container hover:text-on-primary-container sm:px-6 sm:py-4"
        >
          חפש
        </button>
      </div>
    </form>
  );
}
