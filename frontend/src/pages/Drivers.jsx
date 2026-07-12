import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../api/drivers';
import DriverModal from '../components/DriverModal';

const Drivers = () => {
  const { role } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // RBAC Flags
  const canManageDrivers = role === 'FleetManager' || role === 'SafetyOfficer';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getDrivers();
      setDrivers(data.documents);
    } catch (err) {
      setError('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedDriver(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (driver) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to suspend this driver?')) {
      try {
        await deleteDriver(id);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to suspend driver');
      }
    }
  };

  const handleSaveModal = async (formData) => {
    try {
      if (selectedDriver) {
        await updateDriver(selectedDriver.$id, formData);
      } else {
        await createDriver(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save driver');
    }
  };

  if (loading) return <div className="text-white p-6">Loading drivers...</div>;
  if (error) return <div className="text-red-500 p-6">{error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Drivers Roster</h1>
          <p className="text-gray-400 text-sm">Manage driver profiles and track their safety scores.</p>
        </div>
        {canManageDrivers && (
          <button 
            onClick={handleAddClick}
            className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-amber-900/20"
          >
            + Add Driver
          </button>
        )}
      </div>

      <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">License No.</th>
                <th className="px-6 py-4 font-medium">Expiry</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Safety Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
                {canManageDrivers && <th className="px-6 py-4 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No drivers found in the roster.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.$id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{d.name}</td>
                    <td className="px-6 py-4">{d.licenseNumber} <span className="text-xs text-gray-500 ml-1">({d.licenseCategory})</span></td>
                    <td className="px-6 py-4">{new Date(d.licenseExpiryDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{d.contactNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${d.safetyScore >= 4 ? 'text-green-400' : d.safetyScore >= 3 ? 'text-amber-400' : 'text-red-400'}`}>
                        {d.safetyScore} / 5.0
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                        ${d.status === 'Available' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                          d.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                          d.status === 'Off Duty' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' : 
                          'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                      >
                        {d.status}
                      </span>
                    </td>
                    {canManageDrivers && (
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEditClick(d)} className="text-amber-500 hover:text-amber-400 mr-4 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteClick(d.$id)} className="text-red-500 hover:text-red-400 transition-colors">Suspend</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DriverModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        driver={selectedDriver}
      />
    </div>
  );
};

export default Drivers;
