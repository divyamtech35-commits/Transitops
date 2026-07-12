import { useState, useEffect } from 'react';

const FuelModal = ({ isOpen, onClose, onSave, vehicles }) => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    liters: '',
    cost: '',
    date: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        vehicleId: vehicles.length > 0 ? vehicles[0].$id : '',
        liters: '',
        cost: '',
        date: new Date().toISOString().split('T')[0]
      });
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, vehicles]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedLiters = parseFloat(formData.liters);
    const parsedCost = parseFloat(formData.cost);

    if (isNaN(parsedLiters) || parsedLiters <= 0) {
      setError('Liters must be a positive number.');
      return;
    }
    if (isNaN(parsedCost) || parsedCost < 0) {
      setError('Cost must be a valid non-negative number.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        date: new Date(formData.date).toISOString()
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to log fuel');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Log Fuel</h2>
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
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle</label>
            <select
              required
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-semibold cursor-pointer appearance-none"
            >
              {vehicles.length === 0 ? <option value="">No vehicles found</option> : null}
              {vehicles.map(v => (
                <option key={v.$id} value={v.$id}>
                  {v.registrationNumber} - {v.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Date</label>
            <input
              required
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Liters (L)</label>
              <input
                required
                type="number"
                name="liters"
                value={formData.liters}
                onChange={handleChange}
                min="0.1"
                step="0.1"
                placeholder="e.g. 50"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Fuel Cost (₹)</label>
              <input
                required
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g. 100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
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
              disabled={isSubmitting || vehicles.length === 0}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Fuel Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelModal;
