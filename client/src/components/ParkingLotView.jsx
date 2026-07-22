import LevelNavigation from "./LevelNavigation";
import ParkingSlot from "./ParkingSlot";
import { useMemo } from "react";

export default function ParkingLotView({ 
  parkings, 
  onBack,
  currentLevel,
  totalLevels,
  onLevelChange,
  lotName
}) {
  // Generate a stable array of random car image indexes (1-8) once per component mount
  const randomCarIndexes = useMemo(() => {
    return Array.from({ length: 16 }).map(() => Math.floor(Math.random() * 8) + 1);
  }, []);

  // Check if it's the Mediatheque lot
  const isMediatheque = lotName && (lotName.includes("מדיטק") || lotName.toLowerCase().includes("mediatheque"));

  return (
    <div className={`bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] border border-outline-variant/20 w-full mx-auto mt-6 ${isMediatheque ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="flex items-center justify-between mb-8 relative">
        <button
          onClick={onBack}
          className="cursor-pointer px-5 py-2 bg-transparent border border-outline-variant/50 hover:border-primary hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-xl transition-all duration-300 font-medium z-10"
        >
          חזור
        </button>

        <h2 className="text-2xl text-primary font-bold tracking-wide absolute left-0 right-0 text-center pointer-events-none">
          {lotName ? `מצב חניון: ${lotName}` : "מצב חניון"}
        </h2>
      </div>

      {(!parkings || parkings.length === 0) ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-center text-on-surface-variant text-lg font-bold">אין מידע על חניות במפלס זה</p>
        </div>
      ) : isMediatheque ? (
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-[1.8/1] rounded-2xl overflow-hidden border-2 border-outline-variant/30 shadow-inner bg-surface-container">
             <img src="/parking-bg.jpg" alt="Parking Background" className="absolute inset-0 w-full h-full object-cover opacity-90" />
             <div className="absolute inset-0 px-[2%] py-[3%] grid grid-cols-8 grid-rows-2" dir="ltr">
               {Array.from({ length: 16 }).map((_, index) => {
                 const slot = parkings[index] || { _id: `dummy-${index}`, status: 'occupied', isDummy: true };
                 const spotNum = index + 1;
                 const carImageIndex = randomCarIndexes[index];
                 
                 // Icons for special spots (large, centered, no colors for the spot itself)
                 let typeIcon = null;
                 const isOccupied = slot.status !== 'free';
                 const svgClass = isOccupied 
                   ? "w-6 h-6 sm:w-8 sm:h-8 opacity-90 drop-shadow-md" 
                   : "w-10 h-10 sm:w-14 sm:h-14 opacity-40";

                 if (slot.type === 'disabled') {
                   typeIcon = (
                     <svg className={`${svgClass} text-blue-500`} fill="currentColor" viewBox="0 0 512 512">
                       <circle cx="221.912" cy="66.088" r="34.088" />
                       <path d="m460.12 360.478l-47.943 11.985L393 282.971A24.126 24.126 0 0 0 369.533 264h-88.705l-6.462-56H384v-32H270.674l-4.134-35.826a24 24 0 0 0-26.593-21.091l-39.736 4.585L220.1 296h142.97l24.758 115.537l80.057-20.015Z" />
                       <path d="M224 448a120 120 0 0 1-45.248-231.135l-3.779-32.75C115.143 204.558 72 261.334 72 328c0 83.813 68.187 152 152 152a152.06 152.06 0 0 0 130.044-73.378L344 360c-16 48-61.4 88-120 88" />
                     </svg>
                   );
                 } else if (slot.type === 'dean') {
                   typeIcon = (
                     <svg className={`${svgClass} text-black`} fill="currentColor" viewBox="0 0 24 24">
                       <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 14.72l5-2.45v3.72z" />
                     </svg>
                   );
                 }

                 return (
                   <div key={slot._id} className="relative w-full h-full flex flex-col items-center justify-center p-1 sm:p-2">
                     {/* Dynamic background/floating icon for all special spots */}
                     {typeIcon && (
                       <div 
                         className={`absolute pointer-events-none z-20 flex justify-center transition-all duration-300
                           ${isOccupied ? "top-0 sm:top-1 items-start" : "inset-0 items-center"}
                         `} 
                         style={{ mixBlendMode: isOccupied ? 'normal' : 'multiply' }}
                       >
                         {typeIcon}
                       </div>
                     )}

                     {slot.status === 'free' ? (
                       <span className="absolute bottom-5 sm:bottom-7 text-sm sm:text-lg font-extrabold text-green-600 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] z-10">
                         פנוי
                       </span>
                     ) : (
                       <img 
                         src={`/cars/${carImageIndex}.png`} 
                         alt="Parked car" 
                         className="w-[70%] h-[80%] object-contain"
                         style={{ mixBlendMode: 'multiply' }}
                       />
                     )}

                     {/* Spot number always at the bottom, hidden for dummy spots */}
                     {!slot.isDummy && (
                       <span className="absolute bottom-1 sm:bottom-2 text-xs sm:text-sm font-bold text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10">
                         {spotNum}
                       </span>
                     )}
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:gap-6" dir="ltr">
          {parkings.map((slot) => (
            <ParkingSlot
              id={slot.spotNumber}
              type={slot.type}
              isAvilable={slot.status === 'free'}
              key={slot._id}
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center w-full border-t border-outline-variant/20 pt-6" dir="rtl">
        <LevelNavigation 
          currentLevel={currentLevel}
          totalLevels={totalLevels}
          onLevelChange={onLevelChange}
        />
      </div>
    </div>
  );
}