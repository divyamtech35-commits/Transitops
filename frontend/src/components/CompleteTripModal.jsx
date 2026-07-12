import { useState, useEffect } from 'react';

const CompleteTripModal = ({ isOpen, onClose, onSave, trip }) => {
  const [formData, setFormData] = useState({
    finalOdometer: '',
    fuelConsumed: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && trip) {
      setFormData({
        finalOdometer: trip.initialOdometer || '',
        fuelConsumed: ''
      });
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, trip]);

  if (!isOpen || !trip) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (parseFloat(formData.finalOdometer) < trip.initialOdometer) {
      setError(`Final odometer (${formData.finalOdometer}) cannot be less than initial odometer (${trip.initialOdometer}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(trip.$id, {
        finalOdometer: parseFloat(formData.finalOdometer),
        fuelConsumed: formData.fuelConsumed ? parseFloat(formData.fuelConsumed) : null
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to complete trip');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Complete Trip Log</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <p className="text-xs text-slate-500 font-medium">Trip ID: <span className="text-slate-850 font-bold">{trip.$id}</span></p>
            <p className="text-xs text-slate-500 font-medium">Initial Odometer: <span className="text-slate-850 font-bold">{trip.initialOdometer} km</span></p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Final Odometer (km)</label>
            <input
              required
              type="number"
              name="finalOdometer"
              value={formData.finalOdometer}
              onChange={handleChange}
              min={trip.initialOdometer}
              step="0.1"
              placeholder="e.g. 15250"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Fuel Consumed (Liters) - Optional</label>
            <input
              type="number"
              name="fuelConsumed"
              value={formData.fuelConsumed}
              onChange={handleChange}
              min="0"
              step="0.1"
              placeholder="e.g. 45"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md shadow-green-500/10 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Complete Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteTripModal;
