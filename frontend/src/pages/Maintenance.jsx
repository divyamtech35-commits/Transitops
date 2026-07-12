import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMaintenanceLogs, createMaintenanceLog, closeMaintenanceLog } from '../api/maintenance';
import { getVehicles } from '../api/vehicles';
import MaintenanceModal from '../components/MaintenanceModal';
import CloseMaintenanceModal from '../components/CloseMaintenanceModal';

const Maintenance = () => {
  const { role } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // RBAC Flags
  const canManageLogs = role === 'FleetManager';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [vehData, logData] = await Promise.all([
        getVehicles(),
        getMaintenanceLogs()
      ]);
      setVehicles(vehData.documents);
      setLogs(logData.documents);
    } catch (err) {
      setError('Failed to fetch maintenance data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [vehData, logData] = await Promise.all([getVehicles(), getMaintenanceLogs()]);
      setVehicles(vehData.documents);
      setLogs(logData.documents);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  const handleCreateSave = async (formData) => {
    await createMaintenanceLog(formData);
    setIsCreateModalOpen(false);
    await refreshData();
  };

  const openCloseModal = (log) => {
    setSelectedLog(log);
    setIsCloseModalOpen(true);
  };

  const handleCloseSave = async (id, data) => {
    await closeMaintenanceLog(id, data);
    setIsCloseModalOpen(false);
    await refreshData();
  };

  const getVehicleInfo = (id) => {
    const v = vehicles.find(v => v.$id === id);
    if (!v) return { text: 'Unknown Vehicle', matchText: '' };
    return { 
      text: `${v.registrationNumber} - ${v.model}`,
      matchText: `${v.registrationNumber} ${v.model}`.toLowerCase() 
    };
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Status Filter
      if (statusFilter && log.status !== statusFilter) return false;
      
      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const vInfo = getVehicleInfo(log.vehicleId).matchText;
        if (!vInfo.includes(query) && !log.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [logs, statusFilter, searchQuery, vehicles]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Maintenance Logs</h1>
          <p className="text-gray-400 text-sm">Track vehicle repairs, costs, and availability status.</p>
        </div>
        {canManageLogs && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-amber-900/20"
          >
            + New Maintenance Log
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by vehicle or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 w-full max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 min-w-[150px]"
        >
          <option value="">All Statuses</option>
          <option value="Open">In Shop</option>
          <option value="Closed">Completed</option>
        </select>
      </div>

      <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading maintenance logs...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Vehicle</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Dates</th>
                  <th className="px-6 py-4 font-medium">Status & Cost</th>
                  {canManageLogs && <th className="px-6 py-4 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No maintenance records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.$id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        {getVehicleInfo(log.vehicleId).text}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300">Opened: {new Date(log.openedAt || log.$createdAt).toLocaleDateString()}</div>
                        {log.closedAt && <div className="text-gray-500 text-xs mt-1">Closed: {new Date(log.closedAt).toLocaleDateString()}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                            ${log.status === 'Open' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                              'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}
                          >
                            {log.status === 'Open' ? 'In Shop' : 'Completed'}
                          </span>
                        </div>
                        {log.status === 'Closed' && (
                          <div className="text-green-400 font-medium">₹{log.cost?.toFixed(2)}</div>
                        )}
                      </td>
                      {canManageLogs && (
                        <td className="px-6 py-4 text-right">
                          {log.status === 'Open' && (
                            <button 
                              onClick={() => openCloseModal(log)} 
                              className="bg-amber-500/10 border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-white px-4 py-1.5 rounded-lg text-sm transition-all"
                            >
                              Finish Repair
                            </button>
                          )}
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

      <MaintenanceModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSave}
        vehicles={vehicles.filter(v => v.status === 'Available')}
      />

      <CloseMaintenanceModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSave={handleCloseSave}
        log={selectedLog}
        vehicleName={selectedLog ? getVehicleInfo(selectedLog.vehicleId).text : ''}
      />
    </div>
  );
};

export default Maintenance;
