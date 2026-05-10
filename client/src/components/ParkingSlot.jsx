const roadMarkings = {
  regular: null,
  disabled: (
    <svg
      className="w-8 h-8 text-blue-400 opacity-80"
      fill="currentColor"
      viewBox="0 0 512 512"
    >
      <circle cx="221.912" cy="66.088" r="34.088" />
      <path d="m460.12 360.478l-47.943 11.985L393 282.971A24.126 24.126 0 0 0 369.533 264h-88.705l-6.462-56H384v-32H270.674l-4.134-35.826a24 24 0 0 0-26.593-21.091l-39.736 4.585L220.1 296h142.97l24.758 115.537l80.057-20.015Z" />
      <path d="M224 448a120 120 0 0 1-45.248-231.135l-3.779-32.75C115.143 204.558 72 261.334 72 328c0 83.813 68.187 152 152 152a152.06 152.06 0 0 0 130.044-73.378L344 360c-16 48-61.4 88-120 88" />
    </svg>
  ),
  dean: (
    <svg
      className="w-9 h-9 text-black opacity-80"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 14.72l5-2.45v3.72z" />
    </svg>
  ),
};

export default function ParkingSlot({ id, type = "regular", isAvilable }) {
  let paintedLines = "border-white/60";
  if (type === "disabled") paintedLines = "border-blue-400";
  if (type === "dean") paintedLines = "border-black";

  return (
    <div
      className={`
            relative h-32 sm:h-40 bg-slate-800/40 
            border-x-4 border-t-4 border-b-0 ${paintedLines} 
            flex flex-col items-center justify-start pt-2
            transition-all duration-300
        `}
    >
      <span className="text-slate-400 font-bold text-lg">{id}</span>

      <span className="mt-2">{roadMarkings[type]}</span>

      {!isAvilable ? (
        <div className="absolute bottom-4 flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full transition-all duration-500">
          <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]"></div>
          <span className="text-red-500 text-xs font-bold tracking-wider">
            תפוס
          </span>
        </div>
      ) : (
        <div className="absolute bottom-4 flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full transition-all duration-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></div>
          <span className="text-green-400 text-xs font-bold tracking-wider">
            פנוי
          </span>
        </div>
      )}
    </div>
  );
}
