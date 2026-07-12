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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Create New Trip (Draft)</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Source</label>
              <input
                required
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="e.g. Mumbai Port"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Destination</label>
              <input
                required
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g. Pune Hub"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle (Available Only)</label>
            <select
              required
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-semibold cursor-pointer appearance-none"
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
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Driver (Available Only)</label>
            <select
              required
              name="driverId"
              value={formData.driverId}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-semibold cursor-pointer appearance-none"
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
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Cargo Weight (kg)</label>
              <input
                required
                type="number"
                name="cargoWeight"
                value={formData.cargoWeight}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="e.g. 2500"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Planned Dist. (km)</label>
              <input
                required
                type="number"
                name="plannedDistance"
                value={formData.plannedDistance}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="e.g. 150"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Planned Start Time</label>
            <input
              required
              type="datetime-local"
              name="plannedStartTime"
              value={formData.plannedStartTime}
              onChange={handleChange}
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
              disabled={isSubmitting || vehicles.length === 0 || drivers.length === 0}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
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
