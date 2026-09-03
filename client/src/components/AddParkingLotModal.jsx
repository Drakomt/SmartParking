import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function AddParkingLotModal({ isOpen, onClose, cityId, cityName, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    locationLat: "",
    locationLng: "",
    isFree: false,
    pricePerMinute: 0,
    parkingFeeMinor: 0,
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

  // Auto-geocode address when user finishes typing
  useEffect(() => {
    if (!formData.address || formData.address.length < 3) {
      setLocationSuccess(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsFetchingLocation(true);
      setLocationSuccess(false);
      try {
        const query = `${formData.address}${cityName ? `, ${cityName}` : ''}, Israel`;
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        
        if (res.data && res.data.length > 0) {
          const lat = parseFloat(res.data[0].lat);
          const lon = parseFloat(res.data[0].lon);
          setFormData(prev => ({
            ...prev,
            locationLat: lat,
            locationLng: lon
          }));
          setLocationSuccess(true);
        } else {
          // If nominatim fails to find, maybe try without city
          const fallbackRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address + ", Israel")}`);
          if (fallbackRes.data && fallbackRes.data.length > 0) {
            const lat = parseFloat(fallbackRes.data[0].lat);
            const lon = parseFloat(fallbackRes.data[0].lon);
            setFormData(prev => ({
              ...prev,
              locationLat: lat,
              locationLng: lon
            }));
            setLocationSuccess(true);
          }
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      } finally {
        setIsFetchingLocation(false);
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(handler);
  }, [formData.address, cityName]);

  // Initialize or reset custom spots when levels/totalSpots change
  useEffect(() => {
    if (formData.distributionMode === "custom") {
      const newCustom = { ...customSpots };
      for (let i = 1; i <= formData.levels; i++) {
        if (newCustom[i] === undefined) {
          newCustom[i] = Math.floor(formData.totalSpots / formData.levels);
        }
      }
      setCustomSpots(newCustom);
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

    if (!formData.locationLat || !formData.locationLng || Number(formData.locationLat) === 0) {
      setError("לא זוהה מיקום במפה. אנא בדוק שהכתובת שהזנת חוקית");
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
      
      const lotPayload = {
        name: formData.name,
        address: formData.address,
        city: cityId,
        location: {
          lat: Number(formData.locationLat) || 0,
          lng: Number(formData.locationLng) || 0,
        },
        pricing: {
          isFree: formData.isFree,
          pricePerMinute: Number(formData.pricePerMinute),
          parkingFeeMinor: Number(formData.parkingFeeMinor),
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-black text-primary">הוספת חניון חדש</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div ref={scrollContainerRef} className="p-6 overflow-y-auto">
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
                        מאתר מיקום...
                      </span>
                    )}
                    {!isFetchingLocation && locationSuccess && (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        מיקום אותר!
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">קו רוחב (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    name="locationLat"
                    value={formData.locationLat}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">קו אורך (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    name="locationLng"
                    value={formData.locationLng}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                    dir="ltr"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">מחיר לדקה (₪)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="pricePerMinute"
                      value={formData.pricePerMinute}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">מחיר יומי (אגורות)</label>
                    <input
                      type="number"
                      min="0"
                      name="parkingFeeMinor"
                      value={formData.parkingFeeMinor}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface transition-all"
                    />
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

              <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20">
                <h4 className="font-bold text-primary mb-3">אופן חלוקת החניות במפלסים</h4>
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
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
                  <label className="flex items-center gap-2 cursor-pointer">
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

        <div className="p-6 border-t border-outline-variant/30 bg-surface-container-lowest shrink-0 flex gap-3 justify-end rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            type="submit"
            form="add-lot-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow transition-colors disabled:opacity-50 flex items-center gap-2"
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
      </div>

    </div>
  );
}
