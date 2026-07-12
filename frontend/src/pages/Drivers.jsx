import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../api/drivers';
import { getTrips } from '../api/trips';
import DriverModal from '../components/DriverModal';

export default function Drivers() {
  const { user, role } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Search & Filters
  const [searchDriverQuery, setSearchDriverQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('None');

  // RBAC Flags
  const cleanRole = role ? role.replace(/\s+/g, '') : 'Driver';
  const canManageDrivers = cleanRole === 'FleetManager' || cleanRole === 'SafetyOfficer';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drvData, tripData] = await Promise.all([
        getDrivers(),
        getTrips()
      ]);
      setDrivers(drvData.documents || []);
      setTrips(tripData.documents || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch drivers roster');
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

  // Helper mappings
  const formatCategory = (cat) => {
    if (cat === 'Standard') return 'LMV';
    if (cat === 'Heavy') return 'HMV';
    return cat || 'LMV';
  };

  const checkLicenseExpiry = (isoString) => {
    if (!isoString) return { text: '—', isExpired: false };
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const isExpired = date <= new Date();
    return {
      text: `${month}/${year}${isExpired ? ' EXPIRED' : ''}`,
      isExpired
    };
  };

  const maskContact = (num) => {
    if (!num) return '—';
    const cleanNum = num.replace(/\s+/g, '');
    if (cleanNum.length > 5) {
      return `${cleanNum.substring(0, 5)}xxxxx`;
    }
    return num;
  };

  // Dynamically calculate driver completion rate or default based on safetyScore
  const getCompletionRate = (driverId, safetyScore) => {
    const drvTrips = trips.filter(t => t.driverId === driverId);
    if (drvTrips.length > 0) {
      const completed = drvTrips.filter(t => t.status === 'Completed').length;
      return `${Math.round((completed / drvTrips.length) * 100)}%`;
    }
    // Default fallback based on safety score for visual mockups
    const score = parseFloat(safetyScore) || 5.0;
    return `${Math.round(score * 20)}%`;
  };

  // Filter and Search logic
  const filteredDrivers = useMemo(() => {
    let result = drivers.filter(d => {
      // 1. Status toggle filter
      if (statusFilter !== 'All' && d.status !== statusFilter) return false;

      // 2. Category filter
      if (categoryFilter !== 'All' && formatCategory(d.licenseCategory) !== categoryFilter) return false;

      // 3. Search query
      if (searchDriverQuery) {
        const query = searchDriverQuery.toLowerCase();
        if (!d.name.toLowerCase().includes(query) && !d.licenseNumber.toLowerCase().includes(query)) return false;
      }

      return true;
    });

    // Sort logic
    if (sortBy !== 'None') {
      result.sort((a, b) => {
        if (sortBy === 'Name A-Z') return a.name.localeCompare(b.name);
        if (sortBy === 'Name Z-A') return b.name.localeCompare(a.name);
        
        const getSafetyNum = (d) => parseFloat(d.safetyScore) || 5.0;
        if (sortBy === 'Safety Score (High to Low)') return getSafetyNum(b) - getSafetyNum(a);
        if (sortBy === 'Safety Score (Low to High)') return getSafetyNum(a) - getSafetyNum(b);
        return 0;
      });
    }

    return result;
  }, [drivers, statusFilter, categoryFilter, searchDriverQuery, sortBy]);

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
            value={searchDriverQuery}
            onChange={(e) => setSearchDriverQuery(e.target.value)}
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

      {/* FILTER & ACTION ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs font-semibold">
            <span className="text-slate-400 font-bold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All">All</option>
              <option value="LMV">LMV</option>
              <option value="HMV">HMV</option>
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
              <option value="Name A-Z">Name A-Z</option>
              <option value="Name Z-A">Name Z-A</option>
              <option value="Safety Score (High to Low)">Safety (High to Low)</option>
              <option value="Safety Score (Low to High)">Safety (Low to High)</option>
            </select>
          </div>
        </div>

        {canManageDrivers && (
          <button 
            onClick={handleAddClick}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-white font-bold rounded-xl shadow-md transition-colors"
          >
            + Add Driver
          </button>
        )}
      </div>

      {/* DRIVERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Driver</th>
                <th className="px-6 py-4 font-semibold">License No</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Expiry</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Trip Compl.</th>
                <th className="px-6 py-4 font-semibold">Safety</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                {canManageDrivers && <th className="px-6 py-4 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={canManageDrivers ? 9 : 8} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                    No drivers found in the roster.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((d) => {
                  const expiry = checkLicenseExpiry(d.licenseExpiryDate);
                  
                  // SAFETY Compliance Status Badge
                  const isSuspended = d.status === 'Suspended' || expiry.isExpired;
                  const safetyBadgeText = isSuspended ? 'Suspended' : d.status === 'On Trip' ? 'On Trip' : 'Available';
                  const safetyBadgeColor = safetyBadgeText === 'Available' ? 'bg-green-600 text-white' :
                                           safetyBadgeText === 'On Trip' ? 'bg-blue-600 text-white' :
                                           'bg-orange-600 text-white';

                  // STATUS Badge
                  const statusBadgeColor = d.status === 'Available' ? 'bg-green-650 text-white' :
                                           d.status === 'On Trip' ? 'bg-blue-600 text-white' :
                                           d.status === 'Off Duty' ? 'bg-slate-500 text-white' :
                                           'bg-orange-650 text-white';

                  return (
                    <tr key={d.$id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{d.name}</td>
                      <td className="px-6 py-4 font-semibold">{d.licenseNumber}</td>
                      <td className="px-6 py-4">{formatCategory(d.licenseCategory)}</td>
                      <td className={`px-6 py-4 font-semibold ${expiry.isExpired ? 'text-red-650 font-bold' : ''}`}>
                        {expiry.text}
                      </td>
                      <td className="px-6 py-4">{maskContact(d.contactNumber)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{getCompletionRate(d.$id, d.safetyScore)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-[10px] font-bold ${safetyBadgeColor}`}>
                          {safetyBadgeText}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-[10px] font-bold ${statusBadgeColor}`}>
                          {d.status}
                        </span>
                      </td>
                      {canManageDrivers && (
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => handleEditClick(d)} 
                            className="text-amber-600 hover:text-amber-700 font-bold transition-colors"
                          >
                            Edit
                          </button>
                          {d.status !== 'Suspended' && (
                            <button 
                              onClick={() => handleDeleteClick(d.$id)} 
                              className="text-red-600 hover:text-red-700 font-bold transition-colors"
                            >
                              Suspend
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

      {/* TOGGLE STAT FILTER CONTROLS */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Toggle Stat</p>
        <div className="flex flex-wrap gap-2.5 text-xs font-bold text-white">
          <button 
            onClick={() => setStatusFilter(statusFilter === 'All' ? 'All' : 'All')}
            className={`px-4 py-2 rounded-xl transition-all shadow-sm ${
              statusFilter === 'All' ? 'bg-slate-700 border border-slate-600' : 'bg-slate-500 hover:bg-slate-650'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setStatusFilter(statusFilter === 'Available' ? 'All' : 'Available')}
            className={`px-4 py-2 rounded-xl transition-all shadow-sm bg-green-600 hover:bg-green-700 ${
              statusFilter === 'Available' ? 'ring-2 ring-offset-2 ring-green-600' : ''
            }`}
          >
            Available
          </button>
          <button 
            onClick={() => setStatusFilter(statusFilter === 'On Trip' ? 'All' : 'On Trip')}
            className={`px-4 py-2 rounded-xl transition-all shadow-sm bg-blue-600 hover:bg-blue-700 ${
              statusFilter === 'On Trip' ? 'ring-2 ring-offset-2 ring-blue-600' : ''
            }`}
          >
            On Trip
          </button>
          <button 
            onClick={() => setStatusFilter(statusFilter === 'Off Duty' ? 'All' : 'Off Duty')}
            className={`px-4 py-2 rounded-xl transition-all shadow-sm bg-slate-500 hover:bg-slate-650 ${
              statusFilter === 'Off Duty' ? 'ring-2 ring-offset-2 ring-slate-500' : ''
            }`}
          >
            Off Duty
          </button>
          <button 
            onClick={() => setStatusFilter(statusFilter === 'Suspended' ? 'All' : 'Suspended')}
            className={`px-4 py-2 rounded-xl transition-all shadow-sm bg-orange-600 hover:bg-orange-700 ${
              statusFilter === 'Suspended' ? 'ring-2 ring-offset-2 ring-orange-600' : ''
            }`}
          >
            Suspended
          </button>
        </div>
      </div>

      {/* RULE FOOTER TEXT */}
      <p className="text-amber-600 text-xs font-semibold mt-2">
        Rule: Expired license or Suspended status &rarr; blocked from trip assignment
      </p>

      <DriverModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        driver={selectedDriver}
      />
    </div>
  );
}
