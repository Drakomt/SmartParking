import { useEffect, useRef, useState } from "react";

const getRemainingSeconds = (expiresAt) => Math.max(
  0,
  Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
);

export default function ExitCountdown({ expiresAt, onExpired }) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(expiresAt));
  const hasExpired = useRef(false);

  useEffect(() => {
    hasExpired.current = false;

    const timerId = window.setInterval(() => {
      const nextRemaining = getRemainingSeconds(expiresAt);
      setRemainingSeconds(nextRemaining);

      if (nextRemaining === 0) {
        window.clearInterval(timerId);
        if (!hasExpired.current) {
          hasExpired.current = true;
          onExpired?.();
        }
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = Math.min(100, (remainingSeconds / (15 * 60)) * 100);

  return (
    <div className="w-full rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
      <p className="mb-2 font-bold text-on-surface">הזמן שנותר ליציאה מהחניון</p>
      <p
        className="font-mono text-5xl font-black tracking-wider text-primary"
        dir="ltr"
        role="timer"
        aria-label={`${minutes} דקות ו-${seconds} שניות נותרו ליציאה`}
      >
        {formattedTime}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container-high" aria-hidden="true">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">
        לאחר סיום הזמן, החיוב יתחיל להצטבר מחדש בהתאם לתעריף החניון.
      </p>
    </div>
  );
}
