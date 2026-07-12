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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto pt-20 pb-10">
      <div className="bg-[#121212] border border-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 m-4 mt-auto mb-auto">
        <h2 className="text-2xl font-semibold mb-6 text-white">Finish Repair</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800 mb-4">
            <p className="text-sm text-gray-400">Vehicle: <span className="text-white font-medium">{vehicleName}</span></p>
            <p className="text-sm text-gray-400 mt-1">Issue: <span className="text-white">{log.description}</span></p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Final Cost (₹)</label>
            <input
              required
              type="number"
              value={cost}
              onChange={(e) => { setCost(e.target.value); setError(''); }}
              min="0"
              step="0.01"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50"
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
