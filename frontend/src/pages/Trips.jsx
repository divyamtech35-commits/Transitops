import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from '../api/trips';
import { getVehicles } from '../api/vehicles';
import { getDrivers } from '../api/drivers';
import TripModal from '../components/TripModal';
import CompleteTripModal from '../components/CompleteTripModal';

const Trips = () => {
  const { role } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores tripId being acted upon
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // RBAC Flags
  const canManageTrips = role === 'FleetManager' || role === 'Driver';

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [vehData, drvData] = await Promise.all([
        getVehicles(),
        getDrivers()
      ]);
      setVehicles(vehData.documents);
      setDrivers(drvData.documents);
      await fetchTrips();
    } catch (err) {
      setError('Failed to fetch initial data');
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      
      const data = await getTrips(filters);
      setTrips(data.documents);
    } catch (err) {
      setError('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSave = async (formData) => {
    await createTrip(formData);
    setIsCreateModalOpen(false);
    fetchTrips(); // Refresh
    // Refresh vehicles and drivers to get latest status
    const [vehData, drvData] = await Promise.all([getVehicles(), getDrivers()]);
    setVehicles(vehData.documents);
    setDrivers(drvData.documents);
  };

  const handleDispatch = async (id) => {
    if (window.confirm('Are you sure you want to DISPATCH this trip? This will lock the vehicle and driver.')) {
      try {
        setActionLoading(id);
        await dispatchTrip(id);
        await fetchTrips();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to dispatch trip');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to CANCEL this trip?')) {
      try {
        setActionLoading(id);
        await cancelTrip(id);
        await fetchTrips();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to cancel trip');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const openCompleteModal = (trip) => {
    setSelectedTrip(trip);
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSave = async (id, data) => {
    await completeTrip(id, data);
    setIsCompleteModalOpen(false);
    fetchTrips();
  };

  // Helper mapping functions
  const getVehicleName = (id) => {
    const v = vehicles.find(v => v.$id === id);
    return v ? `${v.registrationNumber}` : 'Unknown Vehicle';
  };

  const getDriverName = (id) => {
    const d = drivers.find(d => d.$id === id);
    return d ? d.name : 'Unknown Driver';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trip Management</h1>
          <p className="text-gray-400 text-sm">Dispatch and monitor active transport operations.</p>
        </div>
        {canManageTrips && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-amber-900/20"
          >
            + Create Trip
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading trips...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Trip Details</th>
                  <th className="px-6 py-4 font-medium">Vehicle / Driver</th>
                  <th className="px-6 py-4 font-medium">Cargo / Dist</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  {canManageTrips && <th className="px-6 py-4 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No trips found matching criteria.
                    </td>
                  </tr>
                ) : (
                  trips.map((t) => (
                    <tr key={t.$id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white mb-1">{t.source} → {t.destination}</div>
                        <div className="text-xs text-gray-500">ID: {t.$id.substring(0,8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300 mb-1">V: {getVehicleName(t.vehicleId)}</div>
                        <div className="text-gray-400">D: {getDriverName(t.driverId)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{t.cargoWeight} kg</div>
                        <div className="text-gray-500">{t.distance} km planned</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                          ${t.status === 'Draft' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' : 
                            t.status === 'Dispatched' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                            t.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                            'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      {canManageTrips && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            {t.status === 'Draft' && (
                              <>
                                <button 
                                  onClick={() => handleDispatch(t.$id)} 
                                  disabled={actionLoading === t.$id}
                                  className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                                >
                                  Dispatch
                                </button>
                                <button 
                                  onClick={() => handleCancel(t.$id)} 
                                  disabled={actionLoading === t.$id}
                                  className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {t.status === 'Dispatched' && (
                              <>
                                <button 
                                  onClick={() => openCompleteModal(t)} 
                                  disabled={actionLoading === t.$id}
                                  className="text-green-500 hover:text-green-400 transition-colors disabled:opacity-50"
                                >
                                  Complete
                                </button>
                                <button 
                                  onClick={() => handleCancel(t.$id)} 
                                  disabled={actionLoading === t.$id}
                                  className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TripModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSave}
        vehicles={vehicles.filter(v => v.status === 'Available')}
        drivers={drivers.filter(d => d.status === 'Available')}
      />

      <CompleteTripModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onSave={handleCompleteSave}
        trip={selectedTrip}
      />
    </div>
  );
};

export default Trips;
