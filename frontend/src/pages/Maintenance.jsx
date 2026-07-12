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
  const [sortBy, setSortBy] = useState('Newest First');
  
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // RBAC Flags
  const cleanRole = role ? role.replace(/\s+/g, '') : 'Driver';
  const canManageLogs = cleanRole === 'FleetManager';

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
      setVehicles(vehData.documents || []);
      setLogs(logData.documents || []);
    } catch (err) {
      setError('Failed to fetch maintenance data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [vehData, logData] = await Promise.all([getVehicles(), getMaintenanceLogs()]);
      setVehicles(vehData.documents || []);
      setLogs(logData.documents || []);
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
    let result = logs.filter(log => {
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

    result.sort((a, b) => {
      if (sortBy === 'Newest First') return new Date(b.openedAt || b.$createdAt) - new Date(a.openedAt || a.$createdAt);
      if (sortBy === 'Oldest First') return new Date(a.openedAt || a.$createdAt) - new Date(b.openedAt || b.$createdAt);
      if (sortBy === 'Cost (High to Low)') return (b.cost || 0) - (a.cost || 0);
      if (sortBy === 'Cost (Low to High)') return (a.cost || 0) - (b.cost || 0);
      return 0;
    });

    return result;
  }, [logs, statusFilter, searchQuery, sortBy, vehicles]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Maintenance Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Track vehicle repairs, costs, and availability status.</p>
        </div>
        {canManageLogs && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all shadow-amber-500/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Maintenance Log
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <input
          type="text"
          placeholder="Search by vehicle or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-600 w-full max-w-md"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-amber-600"
          >
            <option value="">All Statuses</option>
            <option value="Open">In Shop</option>
            <option value="Closed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-amber-600"
          >
            <option value="Newest First">Newest First</option>
            <option value="Oldest First">Oldest First</option>
            <option value="Cost (High to Low)">Cost (High to Low)</option>
            <option value="Cost (Low to High)">Cost (Low to High)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Vehicle</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Dates</th>
                <th className="px-6 py-4 font-semibold">Status & Cost</th>
                {canManageLogs && <th className="px-6 py-4 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const statusBadgeColor = log.status === 'Open' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                           'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={log.$id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {getVehicleInfo(log.vehicleId).text}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-semibold">Opened: {new Date(log.openedAt || log.$createdAt).toLocaleDateString()}</div>
                        {log.closedAt && <div className="text-slate-400 text-[10px] mt-0.5 font-semibold uppercase tracking-wider">Closed: {new Date(log.closedAt).toLocaleDateString()}</div>}
                      </td>
                      <td className="px-6 py-4 space-y-1.5">
                        <div>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${statusBadgeColor}`}>
                            {log.status === 'Open' ? 'In Shop' : 'Completed'}
                          </span>
                        </div>
                        {log.status === 'Closed' && (
                          <div className="text-green-600 font-bold">₹{log.cost?.toFixed(2)}</div>
                        )}
                      </td>
                      {canManageLogs && (
                        <td className="px-6 py-4 text-right">
                          {log.status === 'Open' && (
                            <button 
                              onClick={() => openCloseModal(log)} 
                              className="px-4 py-2 border border-amber-600/50 hover:bg-amber-600 text-amber-650 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-500/5"
                            >
                              Finish Repair
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
