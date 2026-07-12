import { useState, useEffect } from 'react';

const MaintenanceModal = ({ isOpen, onClose, onSave, vehicles }) => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        vehicleId: vehicles.length > 0 ? vehicles[0].$id : '',
        description: ''
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

    if (window.confirm('Are you sure you want to send this vehicle to maintenance? This will immediately pull it from the dispatch pool.')) {
      try {
        setIsSubmitting(true);
        await onSave(formData);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to create maintenance log');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto pt-20 pb-10">
      <div className="bg-[#121212] border border-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 m-4 mt-auto mb-auto">
        <h2 className="text-2xl font-semibold mb-6 text-white">Create Maintenance Log</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Vehicle (Available Only)</label>
            <select
              required
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {vehicles.length === 0 ? <option value="">No vehicles available</option> : null}
              {vehicles.map(v => (
                <option key={v.$id} value={v.$id}>
                  {v.registrationNumber} - {v.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Description of Issue/Service</label>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              placeholder="E.g., Engine making noise, regular oil change, etc."
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
              disabled={isSubmitting || vehicles.length === 0}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Send to Shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceModal;
