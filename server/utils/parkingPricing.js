export const MINUTES_PER_DAY = 24 * 60;
export const PAID_EXIT_GRACE_MINUTES = 15;

const getCompletedSessionPayments = (session, payments) => payments.filter((payment) => (
  payment.paypalPaymentStatus === 'COMPLETED'
  && String(payment.parkingSession?._id || payment.parkingSession) === String(session._id)
));

// Shared by pricing and lookup so the displayed deadline matches the billing cutoff.
export const getPaidExitGracePeriod = ({ session, payments = [] }) => {
  if (!session || session.checkoutStatus !== 'paid') return null;

  const paymentTimes = getCompletedSessionPayments(session, payments)
    .filter((payment) => payment.paidAt != null)
    .map((payment) => new Date(payment.paidAt).getTime())
    .filter(Number.isFinite);
  if (paymentTimes.length === 0) return null;

  const latestPaymentTime = Math.max(...paymentTimes);
  return {
    paidAt: new Date(latestPaymentTime),
    graceExpiresAt: new Date(latestPaymentTime + PAID_EXIT_GRACE_MINUTES * 60_000),
  };
};

const toFiniteNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const calculateParkingPriceForLot = (lot, totalMinutes) => {
  if (!lot || !Number.isFinite(Number(totalMinutes)) || Number(totalMinutes) <= 0) {
    return 0;
  }

  const pricing = lot.pricing ?? lot;
  const minutes = Math.max(0, Number(totalMinutes));
  if (pricing.isFree) {
    return 0;
  }

  const legacyFlatFeeMinor = Number.isFinite(Number(pricing.parkingFeeMinor))
    ? Math.max(0, Math.round(Number(pricing.parkingFeeMinor)))
    : 0;

  const freeFirstHours = Math.max(0, toFiniteNumber(pricing.freeFirstHours, 0));
  const pricePerMinute = Math.max(0, toFiniteNumber(pricing.pricePerMinute, 0));
  const fullDayPriceMinor = Math.max(0, Math.round(toFiniteNumber(pricing.fullDayPriceMinor, 0)));

  const hasLegacyFlatFee = (
    legacyFlatFeeMinor > 0
    && freeFirstHours === 0
    && pricePerMinute === 0
    && fullDayPriceMinor === 0
  );

  if (hasLegacyFlatFee) {
    return legacyFlatFeeMinor;
  }

  const freeMinutes = freeFirstHours * 60;
  const minutesAfterFree = Math.max(0, minutes - freeMinutes);
  let remainingMinutes = minutesAfterFree;
  let totalMinor = 0;

  if (minutesAfterFree > MINUTES_PER_DAY && fullDayPriceMinor > 0) {
    const fullDays = Math.floor(minutesAfterFree / MINUTES_PER_DAY);
    totalMinor += fullDays * fullDayPriceMinor;
    remainingMinutes = minutesAfterFree % MINUTES_PER_DAY;
  }

  if (remainingMinutes > 0 && pricePerMinute > 0) {
    const amountPerMinuteMinor = Math.round(pricePerMinute * 100);
    totalMinor += Math.round(remainingMinutes * amountPerMinuteMinor);
  }

  return Math.max(0, Math.round(totalMinor));
};

export const calculateParkingPriceByLicensePlate = ({
  session,
  payments = [],
  now = () => Date.now(),
}) => {
  if (!session || !session.parkingLot) {
    return 0;
  }

  if (session.checkoutStatus === 'pass') return 0;

  const currentTime = new Date(now()).getTime();
  const completedPayments = getCompletedSessionPayments(session, payments);
  const gracePeriod = getPaidExitGracePeriod({ session, payments: completedPayments });

  if (
    gracePeriod
    && currentTime >= gracePeriod.paidAt.getTime()
    && currentTime < gracePeriod.graceExpiresAt.getTime()
  ) {
    return 0;
  }

  const entryTime = session.entryTime ? new Date(session.entryTime).getTime() : currentTime;
  const elapsedMinutes = Math.max(0, (currentTime - entryTime) / 60_000);
  const totalPrice = calculateParkingPriceForLot(session.parkingLot, elapsedMinutes);
  const amountAlreadyPaid = completedPayments.reduce((total, payment) => (
    total + (Number.isSafeInteger(payment.amountMinor) && payment.amountMinor > 0
      ? payment.amountMinor : 0)
  ), 0);
  return Math.max(0, totalPrice - amountAlreadyPaid);
};
