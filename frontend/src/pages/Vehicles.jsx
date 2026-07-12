import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api/vehicles';
import VehicleModal from '../components/VehicleModal';

const Vehicles = () => {
  const { role } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // RBAC Flags
  const canManageVehicles = role === 'FleetManager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getVehicles();
      setVehicles(data.documents);
    } catch (err) {
      setError('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to retire this vehicle?')) {
      try {
        await deleteVehicle(id);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to retire vehicle');
      }
    }
  };

  const handleSaveModal = async (formData) => {
    try {
      if (selectedVehicle) {
        await updateVehicle(selectedVehicle.$id, formData);
      } else {
        await createVehicle(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save vehicle');
    }
  };

  if (loading) return <div className="text-white p-6">Loading vehicles...</div>;
  if (error) return <div className="text-red-500 p-6">{error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vehicles Registry</h1>
          <p className="text-gray-400 text-sm">Manage fleet vehicles and track their statuses.</p>
        </div>
        {canManageVehicles && (
          <button 
            onClick={handleAddClick}
            className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-amber-900/20"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">Reg Number</th>
                <th className="px-6 py-4 font-medium">Model</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Max Load</th>
                <th className="px-6 py-4 font-medium">Odometer</th>
                <th className="px-6 py-4 font-medium">Status</th>
                {canManageVehicles && <th className="px-6 py-4 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No vehicles found in the registry.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.$id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{v.registrationNumber}</td>
                    <td className="px-6 py-4">{v.model}</td>
                    <td className="px-6 py-4">{v.type}</td>
                    <td className="px-6 py-4">{v.maxLoad} kg</td>
                    <td className="px-6 py-4">{v.odometer} km</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                        ${v.status === 'Available' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                          v.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                          v.status === 'In Shop' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                          'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}
                      >
                        {v.status}
                      </span>
                    </td>
                    {canManageVehicles && (
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEditClick(v)} className="text-amber-500 hover:text-amber-400 mr-4 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteClick(v.$id)} className="text-red-500 hover:text-red-400 transition-colors">Retire</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <VehicleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        vehicle={selectedVehicle}
      />
    </div>
  );
};

export default Vehicles;
