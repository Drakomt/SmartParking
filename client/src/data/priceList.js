import api from "../lib/api";

const asNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

function normalizePriceItem(lot, cityNames) {
  const pricing = lot.pricing ?? lot;
  const cityId = typeof lot.city === "string" ? lot.city : lot.city?._id;
  const city = lot.city?.name ?? cityNames.get(cityId) ?? "לא צוין";

  return {
    id: lot._id,
    lotName: lot.name,
    city,
    address: lot.address || "כתובת לא צוינה",
    currency: lot.currency || "ILS",
    isFree: Boolean(pricing.isFree),
    freeFirstHours: asNumber(pricing.freeFirstHours),
    pricePerMinute: asNumber(pricing.pricePerMinute),
    fullDayPriceMinor: asNumber(pricing.fullDayPriceMinor),
    parkingFeeMinor: asNumber(pricing.parkingFeeMinor),
  };
}

export async function getPriceList() {
  const [lotsResponse, citiesResponse] = await Promise.all([
    api.get("/api/parking/all"),
    api.get("/api/parking/cities"),
  ]);

  const [lots, cities] = [lotsResponse.data, citiesResponse.data];
  const cityNames = new Map(cities.map((city) => [city._id, city.name]));

  return lots.map((lot) => normalizePriceItem(lot, cityNames));
}

export function formatParkingFee(feeMinor, currency = "ILS") {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(feeMinor / 100);
}

export function formatParkingRate(lot) {
  if (lot.isFree) return "חינם";
  if (lot.pricePerMinute > 0) {
    return `${formatParkingFee(Math.round(lot.pricePerMinute * 100), lot.currency)} לדקה`;
  }
  if (lot.parkingFeeMinor > 0) return formatParkingFee(lot.parkingFeeMinor, lot.currency);
  return "לא פורסם תעריף";
}

export function getParkingPricingDetails(lot) {
  if (lot.isFree) return "חניה ללא עלות";

  const details = [];
  if (lot.freeFirstHours > 0) details.push(`${lot.freeFirstHours} שעות ראשונות חינם`);
  if (lot.fullDayPriceMinor > 0) details.push(`תקרה יומית ${formatParkingFee(lot.fullDayPriceMinor, lot.currency)}`);
  return details.join(" · ") || "ללא תנאים מיוחדים";
}
