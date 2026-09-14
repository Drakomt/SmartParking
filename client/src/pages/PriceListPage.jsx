import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatParkingRate, getParkingPricingDetails, getPriceList } from "../data/priceList";

export default function PriceListPage() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("הכול");

  useEffect(() => {
    getPriceList()
      .then(setLots)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(
    () => ["הכול", ...new Set(lots.map((lot) => lot.city))],
    [lots],
  );

  const filteredLots = useMemo(() => {
    const normalizedQuery = query.trim();
    return lots.filter((lot) => {
      const matchesCity = selectedCity === "הכול" || lot.city === selectedCity;
      const matchesQuery = !normalizedQuery
        || [lot.lotName, lot.city, lot.address].some((value) => value.includes(normalizedQuery));
      return matchesCity && matchesQuery;
    });
  }, [lots, query, selectedCity]);

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl flex-col px-3 pt-20 pb-8 sm:px-8 sm:pt-24 sm:pb-12"
      dir="rtl"
    >
      <div className="mb-5 flex items-center gap-3 sm:mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="חזרה לעמוד הקודם"
        >
          <span className="material-symbols-outlined" style={{ transform: "rotate(180deg)" }}>arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-black text-primary sm:text-3xl">מחירון חניונים</h1>
          <p className="mt-1 text-sm text-on-surface-variant">בדקו את מחיר החניה לפני ההגעה</p>
        </div>
      </div>

      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:rounded-3xl sm:p-6" aria-labelledby="price-list-heading">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="price-list-heading" className="text-xl font-bold text-primary">מחירים לפי חניון</h2>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">התעריפים ותנאי החניה מתעדכנים ישירות ממערכת החניונים.</p>
          </div>
          <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-bold text-primary" aria-live="polite">
            {loading ? "טוען מחירים..." : `${filteredLots.length} חניונים נמצאו`}
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <span className="sr-only">חיפוש חניון, עיר או כתובת</span>
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="חיפוש חניון, עיר או כתובת"
              className="min-h-12 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 pr-11 text-on-surface placeholder:text-on-surface-variant focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            />
          </label>
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined" aria-hidden="true">location_city</span>
            <span className="sr-only">סינון לפי עיר</span>
            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="min-w-32 flex-1 cursor-pointer bg-transparent font-bold text-on-surface focus:outline-none"
            >
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center p-10" role="status" aria-label="טוען מחירון">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-error/30 bg-error-container p-6 text-center text-on-error-container">
            לא הצלחנו לטעון את המחירון. נסו שוב מאוחר יותר.
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant/50 p-8 text-center text-on-surface-variant">
            לא נמצאו חניונים המתאימים לחיפוש.
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filteredLots.map((lot) => (
                <article key={lot.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-on-surface">{lot.lotName}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{lot.city} · {lot.address}</p>
                    </div>
                    <p className="shrink-0 text-lg font-black text-primary">{formatParkingRate(lot)}</p>
                  </div>
                  <p className="mt-3 border-t border-outline-variant/20 pt-3 text-sm text-on-surface-variant">{getParkingPricingDetails(lot)}</p>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-outline-variant/30 md:block">
              <table className="w-full min-w-160 text-right" dir="rtl">
                <caption className="sr-only">מחירי חניה לפי חניון</caption>
                <thead className="bg-surface-container-low text-sm text-on-surface-variant">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-bold">חניון</th>
                    <th scope="col" className="px-5 py-4 font-bold">עיר</th>
                    <th scope="col" className="px-5 py-4 font-bold">כתובת</th>
                    <th scope="col" className="px-5 py-4 text-right font-bold">מחיר</th>
                    <th scope="col" className="px-5 py-4 font-bold">תנאי תעריף</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredLots.map((lot) => (
                    <tr key={lot.id} className="transition-colors hover:bg-primary/5">
                      <th scope="row" className="px-5 py-4 font-bold text-on-surface">{lot.lotName}</th>
                      <td className="px-5 py-4 text-on-surface-variant">{lot.city}</td>
                      <td className="px-5 py-4 text-on-surface-variant">{lot.address}</td>
                      <td className="px-5 py-4 text-right text-lg font-black text-primary">{formatParkingRate(lot)}</td>
                      <td className="px-5 py-4 text-on-surface-variant">{getParkingPricingDetails(lot)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
