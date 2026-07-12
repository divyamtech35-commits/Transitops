import { useState, useEffect } from 'react';

const VehicleModal = ({ isOpen, onClose, onSave, vehicle }) => {
  const [formData, setFormData] = useState({
    registrationNumber: '',
    model: '',
    type: 'Truck',
    maxLoad: '',
    odometer: '',
    acquisitionCost: '',
    status: 'Available'
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        registrationNumber: vehicle.registrationNumber || '',
        model: vehicle.model || '',
        type: vehicle.type || 'Truck',
        maxLoad: vehicle.maxLoad || '',
        odometer: vehicle.odometer || '',
        acquisitionCost: vehicle.acquisitionCost || '',
        status: vehicle.status || 'Available'
      });
    } else {
      setFormData({
        registrationNumber: '',
        model: '',
        type: 'Truck',
        maxLoad: '',
        odometer: '',
        acquisitionCost: '',
        status: 'Available'
      });
    }
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      maxLoad: parseInt(formData.maxLoad),
      odometer: parseFloat(formData.odometer),
      acquisitionCost: parseFloat(formData.acquisitionCost)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{vehicle ? 'Edit Vehicle' : 'Register New Vehicle'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Registration Number</label>
            <input
              required
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              disabled={!!vehicle}
              placeholder="e.g. MH-12-AB-1234"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Model</label>
            <input
              required
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g. Tata Prima 4025.S"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-semibold cursor-pointer appearance-none"
              >
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Car">Car</option>
                <option value="Motorcycle">Motorcycle</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-semibold cursor-pointer appearance-none"
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Max Load (kg)</label>
              <input
                required
                type="number"
                name="maxLoad"
                value={formData.maxLoad}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 5000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Odometer (km)</label>
              <input
                required
                type="number"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="e.g. 15000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Acquisition Cost (₹)</label>
            <input
              required
              type="number"
              name="acquisitionCost"
              value={formData.acquisitionCost}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="e.g. 45000"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-500/10"
            >
              {vehicle ? 'Update Vehicle' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleModal;
