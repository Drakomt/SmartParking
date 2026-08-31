import ExitCountdown from "./ExitCountdown";

export default function NoPaymentRequired({ sessionData, expiresAt, onExpired, onReset }) {
  const isPaidGracePeriod = sessionData?.checkoutStatus === "paid";
  const isExemptVehicle = sessionData?.checkoutStatus === "pass";

  const title = isPaidGracePeriod
    ? "התשלום כבר בוצע"
    : isExemptVehicle
      ? "הרכב פטור מתשלום"
      : "אין כרגע חוב לתשלום";

  const description = isPaidGracePeriod
    ? "ניתן לצאת מהחניון ללא תשלום נוסף כל עוד הטיימר פעיל."
    : isExemptVehicle
      ? "לוחית הרישוי נמצאת ברשימת הרכבים הפטורים של החניון."
      : "לפי נתוני החניון, אין כרגע יתרה לתשלום עבור לוחית זו.";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8 text-center animate-fade-in-up">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-5xl" aria-hidden="true">verified</span>
      </div>
      <h2 className="mb-2 text-3xl font-black text-primary">{title}</h2>
      <p className="mb-6 text-lg leading-7 text-on-surface-variant">{description}</p>

      {isPaidGracePeriod && expiresAt && (
        <ExitCountdown expiresAt={expiresAt} onExpired={onExpired} />
      )}

      {isPaidGracePeriod && !expiresAt && (
        <div className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 text-on-surface-variant">
          זמן היציאה המדויק יופיע לאחר שהשרת יחזיר את מועד סיום חלון היציאה.
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-6 min-h-11 w-full cursor-pointer rounded-xl bg-surface-container-high px-6 font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
      >
        בדיקת לוחית אחרת
      </button>
    </div>
  );
}
