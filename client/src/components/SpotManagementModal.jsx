import { useState } from "react";
import axios from "axios";

export default function SpotManagementModal({ spot, onClose, onUpdate }) {
  const [status, setStatus] = useState(spot.status);
  const [type, setType] = useState(spot.type || 'regular');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/parking/spots/${spot._id}`, {
        status: status,
        type: type
      }, {
        withCredentials: true,
      });
      
      onUpdate(response.data);
      onClose();
    } catch (err) {
      console.error("Failed to update spot", err);
      setError("שגיאה בעדכון החניה. ייתכן ואין לך הרשאות או שהנתונים לא חוקיים.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-2xl text-on-surface-variant hover:text-error transition-colors">&times;</button>
        <h3 className="text-2xl font-bold mb-6 text-primary">ניהול חניה {spot.spotNumber}</h3>
        
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
            <button type="submit" disabled={isSaving || (status === spot.status && type === spot.type)} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50">
              {isSaving ? "שומר..." : "עדכן"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
