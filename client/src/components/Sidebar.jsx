import { Link } from "react-router-dom";

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          className="fixed inset-0 z-40 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      <div
        className={`fixed top-0 right-0 h-full w-64 bg-surface-container-lowest shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-outline-variant/20">
          <h2 className="text-xl font-bold text-primary">תפריט</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link
            to="/all-lots"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 text-on-surface hover:text-primary transition-colors font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined">local_parking</span>
            כל החניונים שלנו
          </Link>
        </nav>

        <div className="p-4 border-t border-outline-variant/20 flex flex-col gap-2">
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined">settings</span>
            הגדרות
          </Link>
          <Link
            to="/about"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined">info</span>
            אודות
          </Link>
        </div>
      </div>
    </>
  );
}
