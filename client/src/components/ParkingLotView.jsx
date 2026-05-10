import ParkingSlot from "./ParkingSlot";

export default function ParkingLotView({ parkings, onBack }) {
  if (!parkings || parkings.length === 0) {
    return (
      <div className="text-center text-slate-400 p-8">אין מידע על חניות</div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700 w-full max-w-2xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-8 relative">
        <button
          onClick={onBack}
          className="px-5 py-2 bg-transparent border border-slate-600 hover:border-sky-400 hover:bg-sky-400/10 text-slate-300 hover:text-sky-400 rounded-xl transition-all duration-300 font-medium z-10"
        >
          חזור
        </button>

        <h2 className="text-2xl text-sky-400 font-bold tracking-wide absolute left-0 right-0 text-center pointer-events-none">
          מצב חניון
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:gap-6" dir="ltr">
        {parkings.map((slot) => (
          <ParkingSlot
            id={slot.id}
            type={slot.type}
            isAvilable={slot.isAvilable}
            key={slot.id}
          />
        ))}
      </div>
      <div className="flex justify-between mt-8 mb-0">
        <button className="px-5 py-2 bg-transparent border border-slate-600 hover:border-sky-400 hover:bg-sky-400/10 text-slate-300 hover:text-sky-400 rounded-xl transition-all duration-300 font-medium z-10">
          המפלס הקודם
        </button>
        <button className="px-5 py-2 bg-transparent border border-slate-600 hover:border-sky-400 hover:bg-sky-400/10 text-slate-300 hover:text-sky-400 rounded-xl transition-all duration-300 font-medium z-10">
          המפלס הבא
        </button>
      </div>
    </div>
  );
}
