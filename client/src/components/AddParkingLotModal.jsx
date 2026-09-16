import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function AddParkingLotModal({ isOpen, onClose, cityId, cityName, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    locationLat: "",
    locationLng: "",
    isFree: false,
    freeFirstHours: 0,
    pricePerMinute: 20,
    fullDayPrice: 30,
    levels: 1,
    totalSpots: 10,
    distributionMode: "equal", // "equal" or "custom"
  });

  const [customSpots, setCustomSpots] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const scrollContainerRef = useRef(null);

  // Auto-scroll to top when error occurs
  useEffect(() => {
    if (error && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Helper to verify that Nominatim actually returned a real street/building and not just the city center
  const isValidNominatimResult = (item) => {
    if (!item) return false;

    // Reject if it only matched the city boundary, region or country
    const invalidTypes = ['administrative', 'city', 'town', 'village', 'municipality', 'county', 'state', 'country'];
    if (invalidTypes.includes(item.type) || item.class === 'boundary') {
      return false;
    }

    // Accept if it matched a road, building, house number, or specific amenity/place
    if (item.address && (item.address.road || item.address.pedestrian || item.address.building || item.address.house_number || item.address.amenity)) {
      return true;
    }

    if (['highway', 'building', 'amenity'].includes(item.class)) {
      return true;
    }

    return false;
  };

  // Auto-geocode address when user finishes typing
  useEffect(() => {
    // Require at least 3 chars and a house number
    if (!formData.address || formData.address.length < 3) {
      setLocationSuccess(false);
      setFormData(prev => ({ ...prev, locationLat: 0, locationLng: 0 }));
      return;
    }

    if (!/\d+/.test(formData.address)) {
      setLocationSuccess(false);
      setFormData(prev => ({ ...prev, locationLat: 0, locationLng: 0 }));
      return;
    }

    const handler = setTimeout(async () => {
      setIsFetchingLocation(true);
      setLocationSuccess(false);
      try {
        const query = `${formData.address}${cityName ? `, ${cityName}` : ''}, Israel`;
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}`);
        
        const validResult = res.data?.find(isValidNominatimResult);
        if (validResult) {
          const lat = parseFloat(validResult.lat);
          const lon = parseFloat(validResult.lon);
          setFormData(prev => ({
            ...prev,
            locationLat: lat,
            locationLng: lon
          }));
          setLocationSuccess(true);
        } else {
          // If nominatim fails with city, try without city
          const fallbackRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(formData.address + ", Israel")}`);
          const fallbackValid = fallbackRes.data?.find(isValidNominatimResult);
          if (fallbackValid) {
            const lat = parseFloat(fallbackValid.lat);
            const lon = parseFloat(fallbackValid.lon);
            setFormData(prev => ({
              ...prev,
              locationLat: lat,
              locationLng: lon
            }));
            setLocationSuccess(true);
          } else {
            setFormData(prev => ({
              ...prev,
              locationLat: 0,
              locationLng: 0
            }));
            setLocationSuccess(false);
          }
        }
      } catch (err) {
        console.error("Geocoding failed", err);
        setFormData(prev => ({ ...prev, locationLat: 0, locationLng: 0 }));
        setLocationSuccess(false);
      } finally {
        setIsFetchingLocation(false);
      }
    }, 800); // 0.8 second debounce

    return () => clearTimeout(handler);
  }, [formData.address, cityName]);

  // Initialize or reset custom spots when levels/totalSpots change
  useEffect(() => {
    if (formData.distributionMode === "custom") {
      setCustomSpots((previous) => {
        const next = { ...previous };
        let changed = false;
        for (let i = 1; i <= formData.levels; i++) {
          if (next[i] === undefined) {
            next[i] = Math.floor(formData.totalSpots / formData.levels);
            changed = true;
          }
        }
        return changed ? next : previous;
      });
    }
  }, [formData.levels, formData.totalSpots, formData.distributionMode]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCustomSpotChange = (level, value) => {
    setCustomSpots((prev) => ({
      ...prev,
      [level]: Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!formData.name || !formData.address) {
      setError("נא למלא שם וכתובת.");
      return;
    }

    if (!/\d+/.test(formData.address)) {
      setError("נא להזין כתובת מלאה הכוללת שם רחוב ומספר בית (לדוגמה: ויצמן 12).");
      return;
    }

    let levelsDistribution = {};
    
    if (formData.distributionMode === "equal") {
      const perLevel = Math.floor(formData.totalSpots / formData.levels);
      let remainder = formData.totalSpots % formData.levels;
      
      for (let i = 1; i <= formData.levels; i++) {
        levelsDistribution[i] = perLevel + (remainder > 0 ? 1 : 0);
        remainder--;
      }
    } else {
      let sum = 0;
      for (let i = 1; i <= formData.levels; i++) {
        const val = customSpots[i] || 0;
        if (val > 32) {
          setError(`שגיאה: במפלס ${i} יש יותר מ-32 חניות. המספר המקסימלי למפלס הוא 32.`);
          return;
        }
        sum += val;
        levelsDistribution[i] = val;
      }
      if (sum !== Number(formData.totalSpots)) {
        setError(`שגיאה: סך החניות שהוזנו במפלסים (${sum}) לא תואם לסך החניות הכללי (${formData.totalSpots}).`);
        return;
      }
    }

    // Check equal distribution > 32
    if (formData.distributionMode === "equal") {
      for (let i = 1; i <= formData.levels; i++) {
        if (levelsDistribution[i] > 32) {
          setError(`שגיאה: חלוקה שווה יצרה מפלס עם יותר מ-32 חניות. נא להוסיף מפלסים או להקטין כמות חניות.`);
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      
      let lat = Number(formData.locationLat) || 0;
      let lng = Number(formData.locationLng) || 0;

      // If coordinates weren't resolved yet (e.g. user submitted immediately before debounce), try geocode now
      if (lat === 0 || lng === 0) {
        try {
          const query = `${formData.address}${cityName ? `, ${cityName}` : ''}, Israel`;
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}`);
          const validResult = res.data?.find(isValidNominatimResult);
          if (validResult) {
            lat = parseFloat(validResult.lat);
            lng = parseFloat(validResult.lon);
          } else {
            const fallbackRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(formData.address + ", Israel")}`);
            const fallbackValid = fallbackRes.data?.find(isValidNominatimResult);
            if (fallbackValid) {
              lat = parseFloat(fallbackValid.lat);
              lng = parseFloat(fallbackValid.lon);
            }
          }
        } catch (geoErr) {
          console.warn("Background geocoding on submit error", geoErr);
        }
      }

      // If still not found, block submission and show clear error!
      if (lat === 0 || lng === 0) {
        setError("הכתובת שהוזנה לא נמצאה במפה. אנא ודא ששם הרחוב ומספר הבית קיימים ונכונים.");
        setIsSubmitting(false);
        return;
      }

      const rawPricePerMinute = Number(formData.pricePerMinute) || 0;
      // If entered as Agorot (e.g. 20), convert to Shekels (0.20), otherwise if already decimal (0.20) keep it
      const normalizedPricePerMinute = rawPricePerMinute >= 1 ? rawPricePerMinute / 100 : rawPricePerMinute;
      const fullDayPriceInShekels = Number(formData.fullDayPrice) || 0;
      const fullDayPriceMinor = Math.round(fullDayPriceInShekels * 100);

      const lotPayload = {
        name: formData.name,
        address: formData.address,
        city: cityId,
        location: {
          lat: lat,
          lng: lng,
        },
        pricing: {
          isFree: formData.isFree,
          freeFirstHours: formData.isFree ? 0 : Number(formData.freeFirstHours) || 0,
          pricePerMinute: formData.isFree ? 0 : normalizedPricePerMinute,
          fullDayPriceMinor: formData.isFree ? 0 : fullDayPriceMinor,
          parkingFeeMinor: formData.isFree ? 0 : fullDayPriceMinor,
        },
        levels: Number(formData.levels),
        totalSpots: Number(formData.totalSpots),
      };

      await onSave(lotPayload, levelsDistribution);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "שגיאה ביצירת החניון");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-sheet-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <section className="mobile-sheet flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-3xl bg-surface-container-lowest shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="add-lot-title">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/30 p-4 sm:p-6">
          <h2 id="add-lot-title" className="text-xl font-black text-primary sm:text-2xl">הוספת חניון חדש</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
            aria-label="סגירת חלון הוספת החניון"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div ref={scrollContainerRef} className="overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-6 p-4 bg-error/10 text-error rounded-xl border border-error/20 flex items-start gap-3">
              <span className="material-symbols-outlined shrink-0 mt-0.5">error</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form id="add-lot-form" onSubmit={handleSubmit} className="space-y-8">
            {/* General Details */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-on-surface border-b border-outline-variant/30 pb-2">פרטים כלליים</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">שם החניון</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1 flex items-center justify-between">
                    <span>כתובת</span>
                    {isFetchingLocation && (
                      <span className="text-xs text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                        מאמת כתובת...
                      </span>
                    )}
                    {!isFetchingLocation && formData.address && formData.address.length >= 2 && !/\d+/.test(formData.address) && (
                      <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        נא להוסיף מספר בית
                      </span>
                    )}
                    {!isFetchingLocation && locationSuccess && /\d+/.test(formData.address) && (
                      <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        כתובת אומתה במפה!
                      </span>
                    )}
                    {!isFetchingLocation && !locationSuccess && formData.address && formData.address.length >= 3 && /\d+/.test(formData.address) && (
                      <span className="text-xs text-error font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                        כתובת לא נמצאה במפה
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="לדוגמה: סוקולוב 15"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-on-surface border-b border-outline-variant/30 pb-2">תמחור</h3>
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-surface rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors w-fit">
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
                  />
                  <span className="font-bold text-on-surface">חניון חינמי</span>
                </label>
              </div>
              
              {!formData.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">
                      שעות ראשונות חינם
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      name="freeFirstHours"
                      placeholder="0"
                      value={formData.freeFirstHours}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                    />
                    <span className="text-xs text-on-surface-variant mt-1 block">
                      הזן 0 אם אין שעות בחינם
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">
                      מחיר לדקה (אגורות)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      name="pricePerMinute"
                      placeholder="לדוגמה: 20"
                      value={formData.pricePerMinute}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                    />
                    <span className="text-xs text-on-surface-variant mt-1 block">
                      {Number(formData.pricePerMinute) > 0 ? (
                        Number(formData.pricePerMinute) >= 1 ? (
                          `${(Number(formData.pricePerMinute) / 100).toFixed(2)} ₪ לדקה`
                        ) : (
                          `${(Number(formData.pricePerMinute) * 100).toFixed(0)} אג' לדקה`
                        )
                      ) : "הזן מחיר באגורות"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">
                      תקרה יומית (₪)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      name="fullDayPrice"
                      placeholder="לדוגמה: 30"
                      value={formData.fullDayPrice}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                    />
                    <span className="text-xs text-on-surface-variant mt-1 block">
                      מקסימום ליום (0 אם אין תקרה)
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* Structure & Spots */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-on-surface border-b border-outline-variant/30 pb-2">מבנה וחניות</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">מספר מפלסים</label>
                  <input
                    type="number"
                    min="1"
                    name="levels"
                    value={formData.levels}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">סך הכל חניות</label>
                  <input
                    type="number"
                    min="1"
                    name="totalSpots"
                    value={formData.totalSpots}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all font-bold text-lg"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                <h4 className="font-bold text-primary mb-3">אופן חלוקת החניות במפלסים</h4>
                <div className="mb-4 flex flex-col gap-2 min-[360px]:flex-row min-[360px]:gap-6">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="distributionMode"
                      value="equal"
                      checked={formData.distributionMode === "equal"}
                      onChange={handleChange}
                      className="text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-sm font-medium">חלוקה שווה</span>
                  </label>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="distributionMode"
                      value="custom"
                      checked={formData.distributionMode === "custom"}
                      onChange={handleChange}
                      className="text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-sm font-medium">חלוקה ידנית</span>
                  </label>
                </div>

                {formData.distributionMode === "custom" && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-primary/20">
                    {Array.from({ length: Number(formData.levels) }).map((_, idx) => (
                      <div key={idx} className="bg-surface p-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1">
                        <label className="text-xs font-bold text-on-surface-variant">מפלס {idx + 1}</label>
                        <input
                          type="number"
                          min="0"
                          max="32"
                          value={customSpots[idx + 1] || ""}
                          onChange={(e) => handleCustomSpotChange(idx + 1, e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-outline-variant/50 focus:border-primary outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-on-surface-variant mt-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  מקסימום 32 חניות למפלס.
                </p>
              </div>
            </section>
          </form>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 rounded-b-3xl border-t border-outline-variant/30 bg-surface-container-lowest p-4 min-[360px]:flex-row min-[360px]:justify-end sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-11 rounded-xl border border-outline-variant px-6 py-2.5 text-sm font-bold transition-colors hover:bg-surface-container disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            type="submit"
            form="add-lot-form"
            disabled={isSubmitting}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                יוצר...
              </>
            ) : (
              "צור חניון וחניות"
            )}
          </button>
        </div>
      </section>

    </div>
  );
}
