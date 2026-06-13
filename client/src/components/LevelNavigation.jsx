import { usePagination } from "../hooks/usePagination";

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const MoreHorizontalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);

export default function LevelNavigation({ currentLevel, totalLevels, onLevelChange }) {
  const pages = usePagination({ 
    totalPages: totalLevels, 
    currentPage: currentLevel 
  });

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination" dir="ltr">
      
      <button
        onClick={() => onLevelChange(currentLevel - 1)}
        disabled={currentLevel === 1}
        aria-label="מפלס קודם"
        className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium
                   border border-transparent text-slate-300
                   hover:bg-slate-700 hover:text-white
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
      >
        <ChevronLeftIcon />
        הקודם
      </button>

      <ul className="flex items-center gap-1 list-none m-0 p-0">
        {pages.map((page, i) =>
          typeof page === "string" ? (
            <li key={`ellipsis-${i}`}>
              <span className="flex items-center justify-center w-9 h-9 text-slate-500">
                <MoreHorizontalIcon />
              </span>
            </li>
          ) : (
            <li key={page}>
              <button
                onClick={() => onLevelChange(page)}
                aria-current={page === currentLevel ? "page" : undefined}
                className={`min-w-9 h-9 px-1.5 rounded-md text-sm font-medium border transition-colors
                  ${page === currentLevel
                    ? "bg-sky-500 text-slate-900 border-transparent shadow-sm" 
                    : "text-slate-300 border-transparent hover:bg-slate-700 hover:text-white"
                  }`}
              >
                {page}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        onClick={() => onLevelChange(currentLevel + 1)}
        disabled={currentLevel === totalLevels}
        aria-label="מפלס הבא"
        className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium
                   border border-transparent text-slate-300
                   hover:bg-slate-700 hover:text-white
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
      >
        הבא
        <ChevronRightIcon />
      </button>
    </nav>
  );
}