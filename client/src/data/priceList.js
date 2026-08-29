// Temporary data source for the price list. When the backend endpoint is ready,
// replace this array with a request here and keep the page component unchanged.
const mockPriceList = [
  { id: "h-m", lotName: "חניון המדיטק", city: "חולון", address: "גולדה מאיר 6", feeMinor: 2000, currency: "ILS" },
  { id: "h-c", lotName: "חניון העירייה", city: "חולון", address: "ויצמן 58", feeMinor: 1800, currency: "ILS" },
  { id: "h-mall", lotName: "חניון קניון חולון", city: "חולון", address: "שדרות ירושלים 62", feeMinor: 2200, currency: "ILS" },
  { id: "ta-az", lotName: "חניון עזריאלי", city: "תל אביב", address: "דרך מנחם בגין 132", feeMinor: 3500, currency: "ILS" },
  { id: "ta-r", lotName: "חניון רוטשילד", city: "תל אביב", address: "שדרות רוטשילד 1", feeMinor: 3000, currency: "ILS" },
  { id: "ta-d", lotName: "חניון דיזנגוף סנטר", city: "תל אביב", address: "דיזנגוף 50", feeMinor: 3200, currency: "ILS" },
  { id: "rg-b", lotName: "חניון הבורסה", city: "רמת גן", address: "תובל 11", feeMinor: 2800, currency: "ILS" },
  { id: "hf-cn", lotName: "חניון מרכז הכרמל", city: "חיפה", address: "שדרות הנשיא 124", feeMinor: 2200, currency: "ILS" },
  { id: "hf-hr", lotName: "חניון הנמל", city: "חיפה", address: "שדרות פל-ים 8", feeMinor: 1800, currency: "ILS" },
  { id: "bs-m", lotName: "חניון באר שבע מרכז", city: "באר שבע", address: "שדרות הנשיא 1", feeMinor: 1500, currency: "ILS" },
];

export async function getPriceList() {
  // Backend integration point:
  // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/parking/prices`);
  // if (!response.ok) throw new Error("Failed to load price list");
  // return (await response.json()).map(normalizePriceItem);
  return mockPriceList;
}

export function formatParkingFee(feeMinor, currency = "ILS") {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(feeMinor / 100);
}

// Expected backend item shape: { _id, name, city: { name } | string, address,
// parkingFeeMinor, currency }. Add normalizePriceItem here if the returned field names differ.
