import { useState, useEffect } from 'react';

const TripModal = ({ isOpen, onClose, onSave, vehicles, drivers }) => {
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: '',
    plannedStartTime: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        source: '',
        destination: '',
        vehicleId: vehicles.length > 0 ? vehicles[0].$id : '',
        driverId: drivers.length > 0 ? drivers[0].$id : '',
        cargoWeight: '',
        plannedDistance: '',
        plannedStartTime: ''
      });
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, vehicles, drivers]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Cargo Weight Validation
    const selectedVehicle = vehicles.find(v => v.$id === formData.vehicleId);
    if (!selectedVehicle) {
      setError('Please select a valid vehicle.');
      return;
    }

    if (parseFloat(formData.cargoWeight) > selectedVehicle.maxLoad) {
      setError(`Cargo weight (${formData.cargoWeight} kg) exceeds the maximum load capacity of the selected vehicle (${selectedVehicle.maxLoad} kg).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        cargoWeight: parseFloat(formData.cargoWeight),
        plannedDistance: parseFloat(formData.plannedDistance),
        plannedStartTime: formData.plannedStartTime ? new Date(formData.plannedStartTime).toISOString() : new Date().toISOString()
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create trip');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto pt-20 pb-10">
      <div className="bg-[#121212] border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 mt-auto mb-auto">
        <h2 className="text-2xl font-semibold mb-6 text-white">Create New Trip (Draft)</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Source</label>
              <input
                required
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Destination</label>
              <input
                required
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

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
                  {v.registrationNumber} - {v.model} (Max: {v.maxLoad}kg)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Driver (Available Only)</label>
            <select
              required
              name="driverId"
              value={formData.driverId}
              onChange={handleChange}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {drivers.length === 0 ? <option value="">No drivers available</option> : null}
              {drivers.map(d => (
                <option key={d.$id} value={d.$id}>
                  {d.name} ({d.licenseCategory})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Cargo Weight (kg)</label>
              <input
                required
                type="number"
                name="cargoWeight"
                value={formData.cargoWeight}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Planned Dist. (km)</label>
              <input
                required
                type="number"
                name="plannedDistance"
                value={formData.plannedDistance}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Planned Start Time</label>
            <input
              required
              type="datetime-local"
              name="plannedStartTime"
              value={formData.plannedStartTime}
              onChange={handleChange}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 [color-scheme:dark]"
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
              disabled={isSubmitting || vehicles.length === 0 || drivers.length === 0}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripModal;
