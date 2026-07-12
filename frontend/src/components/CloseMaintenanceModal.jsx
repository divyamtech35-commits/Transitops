import { useState, useEffect } from 'react';

const CloseMaintenanceModal = ({ isOpen, onClose, onSave, log, vehicleName }) => {
  const [cost, setCost] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCost('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !log) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      setError('Cost must be a valid non-negative number.');
      return;
    }

    if (window.confirm('Are you sure you want to finish this repair? This will mark the vehicle as Available again.')) {
      try {
        setIsSubmitting(true);
        await onSave(log.$id, { cost: parsedCost });
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to close log');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Finish Repair</h2>
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
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">Vehicle: <span className="text-slate-850 font-bold">{vehicleName}</span></p>
            <p className="text-xs text-slate-500 font-medium">Issue: <span className="text-slate-850 font-medium">{log.description}</span></p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Final Cost ($)</label>
            <input
              required
              type="number"
              value={cost}
              onChange={(e) => { setCost(e.target.value); setError(''); }}
              min="0"
              step="0.01"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              placeholder="0.00"
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
              {isSubmitting ? 'Processing...' : 'Finish Repair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloseMaintenanceModal;
