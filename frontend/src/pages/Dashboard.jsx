import { useEffect, useState, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/kpis');
      setData(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  // Helper mappings
  const getVehicleReg = (id) => {
    const v = data?.vehicles?.find(v => v.$id === id);
    return v ? v.registrationNumber : '—';
  };

  const getVehicleType = (id) => {
    const v = data?.vehicles?.find(v => v.$id === id);
    return v ? v.type : '';
  };

  const getDriverName = (id) => {
    const d = data?.drivers?.find(d => d.$id === id);
    return d ? d.name : '—';
  };

  const getVehicleStatusCount = (status) => {
    if (!data?.vehicles) return 0;
    return data.vehicles.filter(v => v.status === status).length;
  };

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
  const cleanRole = role ? role.replace(/\s+/g, '') : 'Driver';
  const displayRole = roleDisplayMap[cleanRole] || role || 'Driver';

  // Filter and Search calculations for Recent Trips
  const filteredTrips = useMemo(() => {
    if (!data?.trips) return [];
    
    return data.trips.filter(t => {
      // 1. Vehicle Type Filter
      if (vehicleTypeFilter !== 'All') {
        const type = getVehicleType(t.vehicleId);
        if (type !== vehicleTypeFilter) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;

      // 3. Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const vReg = getVehicleReg(t.vehicleId).toLowerCase();
        const dName = getDriverName(t.driverId).toLowerCase();
        const source = t.source.toLowerCase();
        const dest = t.destination.toLowerCase();
        
        if (!vReg.includes(query) && !dName.includes(query) && !source.includes(query) && !dest.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, vehicleTypeFilter, statusFilter]);

  // Dynamic Vehicle Status Progress
  const vehicleStats = useMemo(() => {
    if (!data?.vehicles) return [];
    const total = data.vehicles.length;
    const statuses = ['Available', 'On Trip', 'In Shop', 'Retired'];
    
    return statuses.map(status => {
      const count = getVehicleStatusCount(status);
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return { status, count, percentage };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. TOP BAR: Search & Profile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:border-amber-500 focus:bg-white text-slate-800 text-xs font-semibold"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* User Badge Profile info */}
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

      {/* 2. FILTERS PANEL */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Filters</p>
        <div className="flex flex-wrap gap-4">
          {/* Vehicle Type */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold">
            <span className="text-slate-400 font-bold">Vehicle Type:</span>
            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All">All</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Car">Car</option>
              <option value="Motorcycle">Motorcycle</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold">
            <span className="text-slate-400 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All">All</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Region */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold">
            <span className="text-slate-400 font-bold">Region:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. KPI CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Active Vehicles */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">Active Vehicles</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{data?.activeVehicles ?? 0}</p>
        </div>

        {/* Available Vehicles */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-green-500">
          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">Available Vehicles</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{data?.availableVehicles ?? 0}</p>
        </div>

        {/* In Maintenance */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">In Maintenance</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {data?.maintenanceVehicles !== undefined && data.maintenanceVehicles < 10 ? `0${data.maintenanceVehicles}` : (data?.maintenanceVehicles ?? '00')}
          </p>
        </div>

        {/* Active Trips */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">Active Trips</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{data?.activeTrips ?? 0}</p>
        </div>

        {/* Pending Trips */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-slate-400">
          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">Pending Trips</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {data?.pendingTrips !== undefined && data.pendingTrips < 10 ? `0${data.pendingTrips}` : (data?.pendingTrips ?? '00')}
          </p>
        </div>

        {/* Drivers on Duty */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">Drivers on Duty</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{data?.driversOnDuty ?? 0}</p>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-green-500">
          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">Fleet Utilization</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{data?.fleetUtilization ?? 0}%</p>
        </div>
      </div>

      {/* 4. SPLIT COLUMNS: Recent Trips & Vehicle Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Trips Table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Recent Trips</h3>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">Trip</th>
                    <th className="px-6 py-3 font-semibold">Vehicle</th>
                    <th className="px-6 py-3 font-semibold">Driver</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                        No recent trips found.
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((t) => {
                      const statusBadge = t.status === 'On Trip' ? 'bg-blue-500 text-white' :
                                          t.status === 'Completed' ? 'bg-green-600 text-white' :
                                          t.status === 'Dispatched' ? 'bg-blue-600 text-white' :
                                          t.status === 'Draft' ? 'bg-slate-400 text-white' :
                                          'bg-red-500 text-white';

                      // ETA calculations
                      let eta = '—';
                      if (t.status === 'On Trip') eta = '45 min';
                      else if (t.status === 'Dispatched') eta = '1h 10m';
                      else if (t.status === 'Draft') eta = 'Awaiting vehicle';

                      return (
                        <tr key={t.$id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">TR-{t.$id.slice(-4).toUpperCase()}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{getVehicleReg(t.vehicleId)}</td>
                          <td className="px-6 py-4">{getDriverName(t.driverId)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${statusBadge}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-semibold">{eta}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Vehicle Status Progress Bars */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Vehicle Status</h3>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            {vehicleStats.map((stat) => {
              const barColor = stat.status === 'Available' ? 'bg-green-500' :
                               stat.status === 'On Trip' ? 'bg-blue-500' :
                               stat.status === 'In Shop' ? 'bg-amber-500' :
                               'bg-red-500';

              return (
                <div key={stat.status} className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-bold">{stat.status}</span>
                    <span className="text-slate-400 font-bold">{stat.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
