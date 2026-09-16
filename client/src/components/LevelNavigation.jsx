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
    <nav className="flex max-w-full items-center justify-center gap-1" aria-label="ניווט בין מפלסים" dir="ltr">
      
      <button
        onClick={() => onLevelChange(currentLevel - 1)}
        disabled={currentLevel === 1}
        aria-label="מפלס קודם"
        className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 py-2 text-sm font-bold sm:px-3
                   border border-transparent text-on-surface-variant
                   hover:bg-primary/10 hover:text-primary
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
      >
        <ChevronLeftIcon />
        <span className="hidden sm:inline">הקודם</span>
      </button>

      <ul className="flex items-center gap-1 list-none m-0 p-0">
        {pages.map((page, i) =>
          typeof page === "string" ? (
            <li key={`ellipsis-${i}`}>
              <span className="flex h-11 w-8 items-center justify-center text-on-surface-variant opacity-70 sm:w-9">
                <MoreHorizontalIcon />
              </span>
            </li>
          ) : (
            <li key={page}>
              <button
                onClick={() => onLevelChange(page)}
                aria-current={page === currentLevel ? "page" : undefined}
                className={`h-11 min-w-11 rounded-lg border px-1.5 text-sm font-bold transition-colors
                  ${page === currentLevel
                    ? "bg-primary text-on-primary border-transparent shadow-md" 
                    : "text-on-surface border-transparent hover:bg-primary/10 hover:text-primary"
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
        className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 py-2 text-sm font-bold sm:px-3
                   border border-transparent text-on-surface-variant
                   hover:bg-primary/10 hover:text-primary
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
      >
        <span className="hidden sm:inline">הבא</span>
        <ChevronRightIcon />
      </button>
    </nav>
  );
}
