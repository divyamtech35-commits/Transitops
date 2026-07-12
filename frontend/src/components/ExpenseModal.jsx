import { useState, useEffect } from 'react';

const ExpenseModal = ({ isOpen, onClose, onSave, vehicles, trips }) => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'Toll',
    cost: '',
    date: '',
    tripId: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        vehicleId: vehicles.length > 0 ? vehicles[0].$id : '',
        type: 'Toll',
        cost: '',
        date: new Date().toISOString().split('T')[0],
        tripId: '',
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

    const parsedCost = parseFloat(formData.cost);

    if (isNaN(parsedCost) || parsedCost < 0) {
      setError('Cost must be a valid non-negative number.');
      return;
    }
    if (formData.type === 'Fuel') {
      setError('Fuel cannot be added here. Use the Fuel Log button.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        cost: parsedCost,
        date: new Date(formData.date).toISOString() // Appwrite expects ISO datetime
      };
      
      // Don't send empty tripId string if none selected
      if (!payload.tripId) delete payload.tripId;
      
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add expense');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto pt-20 pb-10">
      <div className="bg-[#121212] border border-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 m-4 mt-auto mb-auto">
        <h2 className="text-2xl font-semibold mb-6 text-white">Add General Expense</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Vehicle</label>
            <select
              required
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {vehicles.length === 0 ? <option value="">No vehicles found</option> : null}
              {vehicles.map(v => (
                <option key={v.$id} value={v.$id}>
                  {v.registrationNumber} - {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Type</label>
              <select
                required
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="Toll">Toll</option>
                <option value="Permit">Permit</option>
                <option value="Parts">Parts</option>
                <option value="Misc">Misc</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Cost (₹)</label>
              <input
                required
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Date</label>
            <input
              required
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Linked Trip (Optional)</label>
            <select
              name="tripId"
              value={formData.tripId}
              onChange={handleChange}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              <option value="">None</option>
              {trips.map(t => (
                <option key={t.$id} value={t.$id}>
                  {t.$id.slice(-6).toUpperCase()} - {t.source} to {t.destination}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="E.g., Highway A toll, Parking ticket..."
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
              disabled={isSubmitting || vehicles.length === 0}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
