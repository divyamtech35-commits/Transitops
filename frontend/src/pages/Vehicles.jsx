import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api/vehicles';
import VehicleModal from '../components/VehicleModal';

export default function Vehicles() {
  const { user, role } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Search & Filters
  const [searchRegQuery, setSearchRegQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('None');

  // RBAC Flags
  const cleanRole = role ? role.replace(/\s+/g, '') : 'Driver';
  const canManageVehicles = cleanRole === 'FleetManager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getVehicles();
      // Keep all vehicles (even Retired) in the list so they match mockup
      setVehicles(data.documents || []);
      setError('');
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

  // Filter and Search logic
  const filteredVehicles = useMemo(() => {
    let result = vehicles.filter(v => {
      // 1. Type Filter
      if (typeFilter !== 'All' && v.type !== typeFilter) return false;

      // 2. Status Filter
      if (statusFilter !== 'All' && v.status !== statusFilter) return false;

      // 3. Search reg query
      if (searchRegQuery) {
        const query = searchRegQuery.toLowerCase();
        if (!v.registrationNumber.toLowerCase().includes(query)) return false;
      }

      return true;
    });

    // Sort logic
    if (sortBy !== 'None') {
      result.sort((a, b) => {
        if (sortBy === 'Acquisition Cost (High to Low)') return (b.acquisitionCost || 0) - (a.acquisitionCost || 0);
        if (sortBy === 'Acquisition Cost (Low to High)') return (a.acquisitionCost || 0) - (b.acquisitionCost || 0);
        if (sortBy === 'Odometer (High to Low)') return (b.odometer || 0) - (a.odometer || 0);
        if (sortBy === 'Odometer (Low to High)') return (a.odometer || 0) - (b.odometer || 0);
        if (sortBy === 'Capacity (High to Low)') return (parseFloat(b.maxLoad) || 0) - (parseFloat(a.maxLoad) || 0);
        return 0;
      });
    }

    return result;
  }, [vehicles, typeFilter, statusFilter, searchRegQuery, sortBy]);

  // Initials for avatar
  const userInitials = useMemo(() => {
    if (user?.name) {
      const parts = user.name.split(' ');
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'US';
  }, [user]);

  // Display Role mapping
  const roleDisplayMap = {
    FleetManager: 'Fleet Manager',
    Driver: 'Driver',
    SafetyOfficer: 'Safety Officer',
    FinancialAnalyst: 'Financial Analyst',
  };
  const displayRole = roleDisplayMap[cleanRole] || role || 'Driver';

  // Format capacity helper: e.g. 5000 -> 5 Ton, 500 -> 500 kg
  const formatCapacity = (maxLoad) => {
    const load = parseFloat(maxLoad);
    if (isNaN(load)) return '—';
    if (load >= 1000) {
      const tons = load / 1000;
      return `${tons} Ton`;
    }
    return `${load} kg`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* TOP BAR: Search & Profile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:border-amber-500 focus:bg-white text-slate-800 text-xs font-semibold"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs font-bold text-slate-500">{user?.name || 'Raven K.'}</span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-200 tracking-wide uppercase">
            {displayRole}
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {userInitials}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* FILTER & ADD ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Type dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs font-semibold">
            <span className="text-slate-400 font-bold">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All">All</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Car">Car</option>
              <option value="Motorcycle">Motorcycle</option>
            </select>
          </div>

          {/* Status dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs font-semibold">
            <span className="text-slate-400 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All">All</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs font-semibold">
            <span className="text-slate-400 font-bold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none cursor-pointer font-bold"
            >
              <option value="None">None</option>
              <option value="Acquisition Cost (High to Low)">Cost (High to Low)</option>
              <option value="Acquisition Cost (Low to High)">Cost (Low to High)</option>
              <option value="Odometer (High to Low)">Odometer (High to Low)</option>
              <option value="Odometer (Low to High)">Odometer (Low to High)</option>
              <option value="Capacity (High to Low)">Capacity (High to Low)</option>
            </select>
          </div>

          {/* Search reg number */}
          <input
            type="text"
            placeholder="Search reg. no..."
            value={searchRegQuery}
            onChange={(e) => setSearchRegQuery(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-500 shadow-sm w-44"
          />
        </div>

        {canManageVehicles && (
          <button 
            onClick={handleAddClick}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-white font-bold rounded-xl shadow-md transition-colors"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      {/* REGISTRY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Reg. No. (Unique)</th>
                <th className="px-6 py-4 font-semibold">Name/Model</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Capacity</th>
                <th className="px-6 py-4 font-semibold">Odometer</th>
                <th className="px-6 py-4 font-semibold">Acq. Cost</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                {canManageVehicles && <th className="px-6 py-4 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={canManageVehicles ? 8 : 7} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                    No vehicles found in the registry.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const statusColor = v.status === 'Available' ? 'bg-green-600 text-white' :
                                      v.status === 'On Trip' ? 'bg-blue-600 text-white' :
                                      v.status === 'In Shop' ? 'bg-[#eab308] text-white' :
                                      'bg-red-500 text-white';

                  return (
                    <tr key={v.$id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{v.registrationNumber}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{v.model}</td>
                      <td className="px-6 py-4">{v.type}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{formatCapacity(v.maxLoad)}</td>
                      <td className="px-6 py-4 font-semibold">{v.odometer?.toLocaleString()}</td>
                      <td className="px-6 py-4 font-semibold text-green-600">₹{v.acquisitionCost?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-[10px] font-bold ${statusColor}`}>
                          {v.status}
                        </span>
                      </td>
                      {canManageVehicles && (
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => handleEditClick(v)} 
                            className="text-amber-600 hover:text-amber-700 font-bold transition-colors"
                          >
                            Edit
                          </button>
                          {v.status !== 'Retired' && (
                            <button 
                              onClick={() => handleDeleteClick(v.$id)} 
                              className="text-red-600 hover:text-red-700 font-bold transition-colors"
                            >
                              Retire
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

      {/* RULE FOOTER TEXT */}
      <p className="text-amber-600 text-xs font-semibold mt-2">
        Rule: Registration No. must be unique &middot; Retired/In Shop vehicles are hidden from Trip Assignment
      </p>

      <VehicleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        vehicle={selectedVehicle}
      />
    </div>
  );
}
