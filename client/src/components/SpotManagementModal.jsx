import { useState } from "react";
import axios from "axios";

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
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/parking/${lotId}/spots`, {
          status: apiStatus,
          type: type,
          level: spot.level,
          spotNumber: spot.spotNumber
        }, {
          withCredentials: true,
        });
        onUpdate();
      } else {
        const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/parking/spots/${spot._id}`, {
          status: apiStatus,
          type: type
        }, {
          withCredentials: true,
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
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/parking/spots/${spot._id}`, {
        withCredentials: true,
      });
      
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-2xl text-on-surface-variant hover:text-error transition-colors">&times;</button>
        <h3 className="text-2xl font-bold mb-6 text-primary">
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
          
          <div className="flex gap-4 pt-2">
            {!spot.isNew && (
              <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving || isDeleting} className="px-6 bg-error/10 text-error py-3 rounded-xl font-bold hover:bg-error hover:text-white disabled:opacity-50 transition-colors">
                מחק חניה
              </button>
            )}
            <button type="submit" disabled={isSaving || isDeleting || (!spot.isNew && status === initialStatus && type === spot.type)} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50">
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
                  className="flex-1 py-2 rounded-xl text-sm font-bold border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  ביטול
                </button>
                <button 
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-error text-white hover:bg-error/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? "מוחק..." : "כן, מחק"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
