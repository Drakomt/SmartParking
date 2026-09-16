import React, { useState, useEffect } from "react";

export default function EditLotModal({ isOpen, onClose, lot, onSave }) {
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    pricing: {
      isFree: false,
      freeFirstHours: 0,
      pricePerMinute: 0,
      fullDayPrice: 0,
      parkingFeeMinor: 0,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (lot) {
      const pricing = lot.pricing ?? {};
      setEditForm({
        name: lot.name,
        address: lot.address,
        pricing: {
          isFree: Boolean(pricing.isFree),
          freeFirstHours: Number(pricing.freeFirstHours) || 0,
          pricePerMinute: Number(pricing.pricePerMinute) || 0,
          fullDayPrice: (Number(pricing.fullDayPriceMinor) || 0) / 100,
          parkingFeeMinor: Number(pricing.parkingFeeMinor) || 0,
        },
      });
      setSaveError("");
    }
  }, [lot]);

  const updatePricing = (field, value) => {
    setEditForm((current) => ({
      ...current,
      pricing: { ...current.pricing, [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");

    const { pricing } = editForm;
    const freeFirstHours = Number(pricing.freeFirstHours);
    const pricePerMinute = Number(pricing.pricePerMinute);
    const fullDayPrice = Number(pricing.fullDayPrice);

    if (
      !pricing.isFree
      && (!Number.isFinite(pricePerMinute) || pricePerMinute <= 0)
    ) {
      setSaveError("יש להזין מחיר לדקה הגדול מאפס, או לסמן שהחניון בחינם.");
      return;
    }

    if (
      !Number.isFinite(freeFirstHours)
      || freeFirstHours < 0
      || !Number.isFinite(fullDayPrice)
      || fullDayPrice < 0
    ) {
      setSaveError("שעות החינם והתקרה היומית חייבות להיות מספרים שאינם שליליים.");
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      address: editForm.address.trim(),
      pricing: {
        isFree: pricing.isFree,
        freeFirstHours: pricing.isFree ? 0 : freeFirstHours,
        pricePerMinute: pricing.isFree ? 0 : pricePerMinute,
        fullDayPriceMinor: pricing.isFree ? 0 : Math.round(fullDayPrice * 100),
        parkingFeeMinor: pricing.isFree ? 0 : pricing.parkingFeeMinor,
      },
    };

    setIsSaving(true);
    try {
      await onSave(lot._id, payload);
      onClose();
    } catch (err) {
      console.error("Failed to update lot", err);
      setSaveError("לא הצלחנו לעדכן את החניון. בדקו את ההרשאות ונסו שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !lot) return null;

  return (
    <div className="mobile-sheet-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" dir="rtl">
      <section className="mobile-sheet relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface-container-lowest p-5 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="edit-lot-title">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error sm:left-4 sm:top-4"
          aria-label="סגירת חלון עריכת החניון"
        >
          &times;
        </button>
        <h3 id="edit-lot-title" className="mb-6 pl-10 text-xl font-bold text-primary sm:text-2xl">עריכת חניון ותעריף</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-on-surface">
              שם חניון
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-on-surface">
              כתובת
            </label>
            <input
              type="text"
              required
              value={editForm.address}
              onChange={(e) =>
                setEditForm({ ...editForm, address: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-right"
            />
          </div>

          <fieldset className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
            <legend className="px-2 text-lg font-bold text-primary">הגדרות תעריף</legend>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-surface-container-lowest p-3">
              <span>
                <span className="block font-bold text-on-surface">חניון ללא תשלום</span>
                <span className="block text-sm text-on-surface-variant">כל החניה בחניון תהיה בחינם</span>
              </span>
              <input
                type="checkbox"
                checked={editForm.pricing.isFree}
                onChange={(e) => updatePricing("isFree", e.target.checked)}
                className="h-5 w-5 cursor-pointer accent-primary"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-on-surface">שעות ראשונות חינם</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  disabled={editForm.pricing.isFree}
                  value={editForm.pricing.freeFirstHours}
                  onChange={(e) => updatePricing("freeFirstHours", e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface p-3 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-on-surface">מחיר לדקה (₪)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  disabled={editForm.pricing.isFree}
                  value={editForm.pricing.pricePerMinute}
                  onChange={(e) => updatePricing("pricePerMinute", e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface p-3 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  required={!editForm.pricing.isFree}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-on-surface">תקרה יומית (₪)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={editForm.pricing.isFree}
                value={editForm.pricing.fullDayPrice}
                onChange={(e) => updatePricing("fullDayPrice", e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface p-3 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span className="mt-1 block text-xs text-on-surface-variant">הזינו 0 אם אין תקרה יומית.</span>
            </label>
          </fieldset>

          {saveError && (
            <p className="rounded-xl bg-error-container p-3 text-sm font-medium text-on-error-container" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-12 flex-1 rounded-xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
