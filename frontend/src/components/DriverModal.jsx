import { useState, useEffect } from 'react';

const DriverModal = ({ isOpen, onClose, onSave, driver }) => {
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'Standard',
    licenseExpiryDate: '',
    contactNumber: '',
    safetyScore: 5.0,
    status: 'Available'
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || '',
        licenseNumber: driver.licenseNumber || '',
        licenseCategory: driver.licenseCategory || 'Standard',
        licenseExpiryDate: driver.licenseExpiryDate ? driver.licenseExpiryDate.substring(0, 10) : '',
        contactNumber: driver.contactNumber || '',
        safetyScore: driver.safetyScore || 5.0,
        status: driver.status || 'Available'
      });
    } else {
      setFormData({
        name: '',
        licenseNumber: '',
        licenseCategory: 'Standard',
        licenseExpiryDate: '',
        contactNumber: '',
        safetyScore: 5.0,
        status: 'Available'
      });
    }
  }, [driver, isOpen]);

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
      safetyScore: parseFloat(formData.safetyScore),
      licenseExpiryDate: `${formData.licenseExpiryDate}T00:00:00.000Z`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{driver ? 'Edit Driver' : 'Register New Driver'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Alex Fernandes"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">License Number</label>
              <input
                required
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                disabled={!!driver} 
                placeholder="e.g. DL-1234567"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
              <select
                name="licenseCategory"
                value={formData.licenseCategory}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-semibold cursor-pointer appearance-none"
              >
                <option value="Standard">Standard</option>
                <option value="Commercial">Commercial</option>
                <option value="Heavy">Heavy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Expiry Date</label>
              <input
                required
                type="date"
                name="licenseExpiryDate"
                value={formData.licenseExpiryDate}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Contact Number</label>
              <input
                required
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Safety Score (1-5)</label>
              <input
                required
                type="number"
                name="safetyScore"
                value={formData.safetyScore}
                onChange={handleChange}
                min="1"
                max="5"
                step="0.1"
                placeholder="5.0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
              />
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
                <option value="Off Duty">Off Duty</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
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
              {driver ? 'Update Driver' : 'Save Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverModal;
