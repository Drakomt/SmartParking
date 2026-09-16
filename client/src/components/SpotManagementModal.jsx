import { useState } from "react";
import api from "../lib/api";

export default function SpotManagementModal({ spot, lotId, onClose, onUpdate }) {
  // The API uses "block" while the UI keeps the clearer "blocked" label/value.
  const initialStatus =
    spot.status === "block" ? "blocked" : spot.status || "free";
  const [status, setStatus] = useState(initialStatus);
  const [type, setType] = useState(spot.type || 'regular');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    const apiStatus = status === "blocked" ? "block" : status;
    try {
      if (spot.isNew) {
        await api.post(`/api/parking/${lotId}/spots`, {
          status: apiStatus,
          type: type,
          level: spot.level,
          spotNumber: spot.spotNumber
        });
        onUpdate();
      } else {
        const response = await api.put(`/api/parking/spots/${spot._id}`, {
          status: apiStatus,
          type: type
        });
        onUpdate(response.data);
      }
      
      onClose();
    } catch (err) {
      console.error("Failed to save spot", err);
      setError("שגיאה בשמירת החניה. ייתכן ואין לך הרשאות או שהנתונים לא חוקיים.");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/parking/spots/${spot._id}`);
      
      onUpdate(null);
      onClose();
    } catch (err) {
      console.error("Failed to delete spot", err);
      setError("שגיאה במחיקת החניה. ייתכן ואין לך הרשאות.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mobile-sheet-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
      <section className="mobile-sheet relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-surface-container-lowest p-5 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="spot-management-title">
        <button type="button" onClick={onClose} className="absolute left-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error" aria-label="סגירת ניהול החניה">&times;</button>
        <h3 id="spot-management-title" className="mb-5 pl-10 text-xl font-bold text-primary sm:mb-6 sm:text-2xl">
          {spot.isNew ? "יצירת חניה חדשה" : `ניהול חניה ${spot.spotNumber}`}
        </h3>
        
        {error && <p className="text-error mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3 text-on-surface">בחר סטטוס חניה:</label>
            <div className="space-y-2">
              {[
                { val: 'free', label: 'פנוי' },
                { val: 'occupied', label: 'תפוס' },
                { val: 'blocked', label: 'חסום ' }
              ].map(opt => (
                <label key={opt.val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${status === opt.val ? 'border-primary bg-primary/10' : 'border-outline-variant hover:border-primary/50'}`}>
                  <input 
                    type="radio" 
                    name="status" 
                    value={opt.val} 
                    checked={status === opt.val} 
                    onChange={() => setStatus(opt.val)} 
                    className="w-4 h-4 text-primary"
                  />
                  <span className="font-medium text-on-surface">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3 text-on-surface">בחר סוג חניה:</label>
            <div className="space-y-2">
              {[
                { val: 'regular', label: 'רגילה' },
                { val: 'disabled', label: 'נכה' },
                { val: 'dean', label: 'דיקן' }
              ].map(opt => (
                <label key={opt.val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${type === opt.val ? 'border-secondary bg-secondary/10' : 'border-outline-variant hover:border-secondary/50'}`}>
                  <input 
                    type="radio" 
                    name="type" 
                    value={opt.val} 
                    checked={type === opt.val} 
                    onChange={() => setType(opt.val)} 
                    className="w-4 h-4 text-secondary"
                  />
                  <span className="font-medium text-on-surface">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col-reverse gap-3 pt-2 min-[360px]:flex-row">
            {!spot.isNew && (
              <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving || isDeleting} className="min-h-12 rounded-xl bg-error/10 px-6 py-3 font-bold text-error transition-colors hover:bg-error hover:text-white disabled:opacity-50">
                מחק חניה
              </button>
            )}
            <button type="submit" disabled={isSaving || isDeleting || (!spot.isNew && status === initialStatus && type === spot.type)} className="min-h-12 flex-1 rounded-xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50">
              {isSaving ? "שומר..." : spot.isNew ? "צור חניה" : "עדכן"}
            </button>
          </div>
        </form>

        {/* Custom Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm rounded-3xl animate-in fade-in zoom-in duration-200">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xl text-center w-[90%] border border-outline-variant/20">
              <div className="w-12 h-12 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h4 className="text-lg font-bold text-on-surface mb-2">מחיקת חניה</h4>
              <p className="text-sm text-on-surface-variant mb-5">
                האם אתה בטוח שברצונך למחוק לצמיתות את חניה {spot.spotNumber}? 
              </p>
              
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="min-h-11 flex-1 rounded-xl border border-outline-variant py-2 text-sm font-bold transition-colors hover:bg-surface-container disabled:opacity-50"
                >
                  ביטול
                </button>
                <button 
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-error py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-error/90 disabled:opacity-50"
                >
                  {isDeleting ? "מוחק..." : "כן, מחק"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
