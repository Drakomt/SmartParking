import { Link } from "react-router-dom";

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="סגירת התפריט"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          className="fixed inset-0 z-[60] cursor-default transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-[70] flex h-[100dvh] w-[min(20rem,88vw)] flex-col bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="p-6 flex items-center justify-between border-b border-outline-variant/20">
          <h2 className="text-xl font-bold text-primary">תפריט</h2>
          <button
            onClick={onClose}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            aria-label="סגירת התפריט"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link
            to="/all-lots"
            onClick={onClose}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 font-medium text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <span className="material-symbols-outlined">local_parking</span>
            כל החניונים שלנו
          </Link>
          <Link
            to="/payment"
            onClick={onClose}
            className="mt-1 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 font-medium text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <span className="material-symbols-outlined">credit_card</span>
            תשלום לחניון
          </Link>
          <Link
            to="/price-list"
            onClick={onClose}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 font-medium text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <span className="material-symbols-outlined">sell</span>
            מחירון חניונים
          </Link>
        </nav>

        <div className="p-4 border-t border-outline-variant/20 flex flex-col gap-2">
          <Link
            to="/settings"
            onClick={onClose}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
          >
            <span className="material-symbols-outlined">settings</span>
            הגדרות
          </Link>
          <Link
            to="/about"
            onClick={onClose}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
          >
            <span className="material-symbols-outlined">info</span>
            אודות
          </Link>
        </div>
      </div>
    </>
  );
}
