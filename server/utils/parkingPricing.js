export const MINUTES_PER_DAY = 24 * 60;

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
  const isFree = Boolean(pricing.isFree);
  if (isFree) {
    return 0;
  }

  const legacyFlatFeeMinor = Number.isFinite(Number(pricing.parkingFeeMinor))
    ? Math.max(0, Math.round(Number(pricing.parkingFeeMinor)))
    : 0;

  const freeFirstHours = Math.max(0, toFiniteNumber(pricing.freeFirstHours, 0));
  const pricePerMinute = Math.max(0, toFiniteNumber(pricing.pricePerMinute, 0));
  const fullDayPriceMinor = Math.max(0, Math.round(toFiniteNumber(pricing.fullDayPriceMinor, 0)));

  if (legacyFlatFeeMinor > 0 && freeFirstHours === 0 && pricePerMinute === 0 && fullDayPriceMinor === 0) {
    return legacyFlatFeeMinor;
  }

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
  now = () => Date.now(),
}) => {
  if (!session || !session.parkingLot) {
    return 0;
  }

  const entryTime = session.entryTime ? new Date(session.entryTime).getTime() : now();
  const elapsedMinutes = Math.max(0, (now() - entryTime) / 60_000);
  return calculateParkingPriceForLot(session.parkingLot, elapsedMinutes);
};
