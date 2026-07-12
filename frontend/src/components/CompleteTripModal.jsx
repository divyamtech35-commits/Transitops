import { useState, useEffect } from 'react';

const CompleteTripModal = ({ isOpen, onClose, onSave, trip }) => {
  const [formData, setFormData] = useState({
    finalOdometer: '',
    fuelConsumed: '',
    revenue: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && trip) {
      setFormData({
        finalOdometer: trip.initialOdometer || '',
        fuelConsumed: '',
        revenue: ''
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
        fuelConsumed: formData.fuelConsumed ? parseFloat(formData.fuelConsumed) : null,
        revenue: formData.revenue ? parseFloat(formData.revenue) : 0
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to complete trip');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto pt-20 pb-10">
      <div className="bg-[#121212] border border-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 m-4 mt-auto mb-auto">
        <h2 className="text-2xl font-semibold mb-6 text-white">Complete Trip</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800 mb-4">
            <p className="text-sm text-gray-400">Trip ID: <span className="text-white">{trip.$id}</span></p>
            <p className="text-sm text-gray-400">Initial Odometer: <span className="text-white font-medium">{trip.initialOdometer} km</span></p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Final Odometer (km)</label>
            <input
              required
              type="number"
              name="finalOdometer"
              value={formData.finalOdometer}
              onChange={handleChange}
              min={trip.initialOdometer}
              step="0.1"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Fuel Consumed (Liters) - Optional</label>
            <input
              type="number"
              name="fuelConsumed"
              value={formData.fuelConsumed}
              onChange={handleChange}
              min="0"
              step="0.1"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Trip Revenue (₹) - For ROI Calculation</label>
            <input
              required
              type="number"
              name="revenue"
              value={formData.revenue}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
              {isSubmitting ? 'Processing...' : 'Complete Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteTripModal;
