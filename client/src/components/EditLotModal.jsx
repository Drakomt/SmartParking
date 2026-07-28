import React, { useState, useEffect } from "react";

export default function EditLotModal({ isOpen, onClose, lot, onSave }) {
  const [editForm, setEditForm] = useState({ name: "", address: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lot) {
      setEditForm({ name: lot.name, address: lot.address });
    }
  }, [lot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(lot._id, editForm);
      onClose();
    } catch (err) {
      console.error("Failed to update lot", err);
      alert("שגיאה בעדכון החניון");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !lot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-2xl text-on-surface-variant hover:text-error transition-colors"
        >
          &times;
        </button>
        <h3 className="text-2xl font-bold mb-6 text-primary">ערוך פרטי חניון</h3>

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

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
