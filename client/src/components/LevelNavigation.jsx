export default function LevelNavigation() {
  return (
    <div className="flex items-center justify-between mt-8">
      <button className="cursor-pointer px-5 py-2 bg-transparent border border-slate-600 hover:border-sky-400 hover:bg-sky-400/10 text-slate-300 hover:text-sky-400 rounded-xl transition-all duration-300 font-medium disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-600 disabled:hover:bg-transparent disabled:hover:text-slate-300">
        המפלס הבא
      </button>
      {/* <div>1, 2, 3,.....</div> */}
      <button className="cursor-pointer px-5 py-2 bg-transparent border border-slate-600 hover:border-sky-400 hover:bg-sky-400/10 text-slate-300 hover:text-sky-400 rounded-xl transition-all duration-300 font-medium disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-600 disabled:hover:bg-transparent disabled:hover:text-slate-300">
        המפלס הקודם
      </button>
    </div>
  );
}
