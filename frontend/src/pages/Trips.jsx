import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from '../api/trips';
import { getVehicles } from '../api/vehicles';
import { getDrivers } from '../api/drivers';
import CompleteTripModal from '../components/CompleteTripModal';

export default function Trips() {
  const { role, user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  
  // Selected Trip for Left panel lifecycle/actions
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('None');

  // Form states for creating trip
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  
  // Complete Trip modal state
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // RBAC Flags
  const cleanRole = role ? role.replace(/\s+/g, '') : 'Driver';
  const canManageTrips = cleanRole === 'FleetManager' || cleanRole === 'Driver';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [vehData, drvData] = await Promise.all([
        getVehicles(),
        getDrivers()
      ]);
      setVehicles(vehData.documents || []);
      setDrivers(drvData.documents || []);
      await fetchTrips();
    } catch (err) {
      setError('Failed to fetch initial data');
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      const data = await getTrips();
      setTrips(data.documents || []);
    } catch (err) {
      setError('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-validate cargo weight
    const selectedVehicle = vehicles.find(v => v.$id === vehicleId);
    if (selectedVehicle && parseFloat(cargoWeight) > selectedVehicle.maxLoad) {
      setError('Cannot save trip. Cargo weight exceeds vehicle limit.');
      return;
    }

    try {
      setActionLoading('create');
      const payload = {
        source,
        destination,
        vehicleId,
        driverId,
        cargoWeight: parseFloat(cargoWeight),
        plannedDistance: parseFloat(plannedDistance),
        plannedStartTime: new Date().toISOString()
      };
      
      const newTrip = await createTrip(payload);
      resetForm();
      await fetchTrips();
      // Select the newly created trip
      setSelectedTrip(newTrip);
      
      // Refresh pool options
      const [vehData, drvData] = await Promise.all([getVehicles(), getDrivers()]);
      setVehicles(vehData.documents || []);
      setDrivers(drvData.documents || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create trip');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDispatch = async (id) => {
    if (window.confirm('Are you sure you want to DISPATCH this trip?')) {
      try {
        setActionLoading(id);
        await dispatchTrip(id);
        await fetchTrips();
        // Update selected trip state
        const updated = trips.find(t => t.$id === id);
        if (updated) setSelectedTrip({ ...updated, status: 'Dispatched' });
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
        const updated = trips.find(t => t.$id === id);
        if (updated) setSelectedTrip({ ...updated, status: 'Cancelled' });
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to cancel trip');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleCompleteSave = async (id, data) => {
    await completeTrip(id, data);
    setIsCompleteModalOpen(false);
    await fetchTrips();
    setSelectedTrip(null);
  };

  const resetForm = () => {
    setSource('');
    setDestination('');
    setVehicleId(vehicles.filter(v => v.status === 'Available')[0]?.$id || '');
    setDriverId(drivers.filter(d => d.status === 'Available')[0]?.$id || '');
    setCargoWeight('');
    setPlannedDistance('');
    setError('');
  };

  // Helper mappings
  const getVehicleReg = (id) => {
    const v = vehicles.find(v => v.$id === id);
    return v ? v.registrationNumber : '—';
  };

  const getDriverName = (id) => {
    const d = drivers.find(d => d.$id === id);
    return d ? d.name : '—';
  };

  // Capacity Warning logic
  const selectedVehicleObj = useMemo(() => {
    return vehicles.find(v => v.$id === vehicleId);
  }, [vehicleId, vehicles]);

  const capacityExceeded = useMemo(() => {
    if (!selectedVehicleObj || !cargoWeight) return 0;
    const diff = parseFloat(cargoWeight) - selectedVehicleObj.maxLoad;
    return diff > 0 ? diff : 0;
  }, [selectedVehicleObj, cargoWeight]);

  // Display Initials & Role
  const userInitials = useMemo(() => {
    if (user?.name) {
      const parts = user.name.split(' ');
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return user.name.slice(0, 2).toUpperCase();
    }
    return 'US';
  }, [user]);

  // Filter and Sort Trips
  const filteredTrips = useMemo(() => {
    let result = trips.filter(t => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const vReg = getVehicleReg(t.vehicleId).toLowerCase();
        const dName = getDriverName(t.driverId).toLowerCase();
        if (
          !t.source.toLowerCase().includes(q) &&
          !t.destination.toLowerCase().includes(q) &&
          !vReg.includes(q) &&
          !dName.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    if (sortBy !== 'None') {
      result.sort((a, b) => {
        if (sortBy === 'Distance (High to Low)') return (parseFloat(b.distance) || 0) - (parseFloat(a.distance) || 0);
        if (sortBy === 'Distance (Low to High)') return (parseFloat(a.distance) || 0) - (parseFloat(b.distance) || 0);
        if (sortBy === 'Cargo (High to Low)') return (parseFloat(b.cargoWeight) || 0) - (parseFloat(a.cargoWeight) || 0);
        if (sortBy === 'Cargo (Low to High)') return (parseFloat(a.cargoWeight) || 0) - (parseFloat(b.cargoWeight) || 0);
        return 0;
      });
    }
    return result;
  }, [trips, statusFilter, searchQuery, sortBy, vehicles, drivers]);

  const displayRole = cleanRole === 'FleetManager' ? 'Fleet Manager' : cleanRole === 'Driver' ? 'Dispatcher' : role;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* TOP BAR: Search & Profile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search source, dest, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pl-9 focus:outline-none focus:border-amber-500 focus:bg-white text-slate-800 text-xs font-semibold"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
          >
            <option value="None">Sort By...</option>
            <option value="Distance (High to Low)">Dist (High to Low)</option>
            <option value="Distance (Low to High)">Dist (Low to High)</option>
            <option value="Cargo (High to Low)">Cargo (High to Low)</option>
            <option value="Cargo (Low to High)">Cargo (Low to High)</option>
          </select>
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

      {/* TWO PANEL CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT PANEL: Form & Lifecycle */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          
          {/* A. TRIP LIFECYCLE */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Trip Lifecycle</p>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 relative py-2 px-1">
              
              {/* Connector line */}
              <div className="absolute top-[17px] left-5 right-5 h-[2px] bg-slate-100 -z-0"></div>

              {/* Draft node */}
              <div className="flex flex-col items-center gap-1 z-10">
                <span className={`w-3.5 h-3.5 rounded-full border-2 ${
                  !selectedTrip || selectedTrip.status === 'Draft' ? 'bg-green-600 border-green-600' : 'bg-green-600 border-green-600'
                }`}></span>
                <span className="text-green-600">Draft</span>
              </div>

              {/* Dispatched node */}
              <div className="flex flex-col items-center gap-1 z-10">
                <span className={`w-3.5 h-3.5 rounded-full border-2 ${
                  selectedTrip && (selectedTrip.status === 'Dispatched' || selectedTrip.status === 'Completed') 
                    ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'
                }`}></span>
                <span className={selectedTrip?.status === 'Dispatched' ? 'text-blue-600' : ''}>Dispatched</span>
              </div>

              {/* Completed node */}
              <div className="flex flex-col items-center gap-1 z-10">
                <span className={`w-3.5 h-3.5 rounded-full border-2 ${
                  selectedTrip && selectedTrip.status === 'Completed' ? 'bg-green-600 border-green-600' : 'bg-white border-slate-200'
                }`}></span>
                <span>Completed</span>
              </div>

              {/* Cancelled node */}
              <div className="flex flex-col items-center gap-1 z-10">
                <span className={`w-3.5 h-3.5 rounded-full border-2 ${
                  selectedTrip && selectedTrip.status === 'Cancelled' ? 'bg-red-500 border-red-500' : 'bg-white border-slate-200'
                }`}></span>
                <span>Cancelled</span>
              </div>
            </div>
          </div>

          {/* B. FORM CONTAINER */}
          {selectedTrip === null ? (
            /* CREATE MODE */
            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Create Trip</p>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold leading-relaxed">
                  {error}
                </div>
              )}

              {/* Source */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Source</label>
                <input
                  required
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Gandhinagar Depot"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium animate-in fade-in"
                />
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Destination</label>
                <input
                  required
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Ahmedabad Hub"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Vehicle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Vehicle (Available Only)</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-semibold cursor-pointer appearance-none"
                >
                  <option value="">-- Select Available Vehicle --</option>
                  {vehicles.filter(v => v.status === 'Available').map(v => (
                    <option key={v.$id} value={v.$id}>
                      {v.registrationNumber} - {formatCapacity(v.maxLoad)} capacity
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Driver (Available Only)</label>
                <select
                  required
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-semibold cursor-pointer appearance-none"
                >
                  <option value="">-- Select Available Driver --</option>
                  {drivers.filter(d => d.status === 'Available').map(d => (
                    <option key={d.$id} value={d.$id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cargo Weight */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Cargo Weight (kg)</label>
                <input
                  required
                  type="number"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  placeholder="e.g. 700"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Planned Distance */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Planned Distance (km)</label>
                <input
                  required
                  type="number"
                  value={plannedDistance}
                  onChange={(e) => setPlannedDistance(e.target.value)}
                  placeholder="e.g. 38"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Red warning container if capacity exceeded */}
              {capacityExceeded > 0 && selectedVehicleObj && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-500 space-y-1">
                  <p>Vehicle Capacity: {selectedVehicleObj.maxLoad} kg</p>
                  <p>Cargo Weight: {cargoWeight} kg</p>
                  <p>✕ Capacity exceeded by {capacityExceeded} kg &mdash; dispatch blocked</p>
                </div>
              )}

              {/* Create/Cancel buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading !== null || capacityExceeded > 0 || vehicles.length === 0 || drivers.length === 0}
                  className="flex-1 py-3 bg-[#eab308] hover:bg-[#ca8a04] text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 text-xs"
                >
                  Create Draft
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 font-bold transition-all text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* DETAIL / ACTION MODE */
            <div className="space-y-5 text-sm animate-in slide-in-from-left duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Trip Details</p>
                <button 
                  onClick={() => setSelectedTrip(null)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  + Create New
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Route</p>
                  <p className="font-bold text-slate-800 text-sm mt-1">{selectedTrip.source} ➔ {selectedTrip.destination}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle</p>
                    <p className="font-bold text-slate-800 mt-1">{getVehicleReg(selectedTrip.vehicleId)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver</p>
                    <p className="font-bold text-slate-800 mt-1">{getDriverName(selectedTrip.driverId)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargo Weight</p>
                    <p className="font-bold text-slate-800 mt-1">{selectedTrip.cargoWeight} kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Planned Dist.</p>
                    <p className="font-bold text-slate-800 mt-1">{selectedTrip.distance} km</p>
                  </div>
                </div>
              </div>

              {/* Action buttons based on state */}
              {canManageTrips && (
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                  {selectedTrip.status === 'Draft' && (
                    <>
                      <button
                        onClick={() => handleDispatch(selectedTrip.$id)}
                        disabled={actionLoading === selectedTrip.$id}
                        className="w-full py-3 bg-[#eab308] hover:bg-[#ca8a04] text-white font-bold rounded-xl shadow-md transition-colors text-xs disabled:opacity-50"
                      >
                        Dispatch Trip
                      </button>
                      <button
                        onClick={() => handleCancel(selectedTrip.$id)}
                        disabled={actionLoading === selectedTrip.$id}
                        className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-xl transition-all text-xs disabled:opacity-50"
                      >
                        Cancel Draft
                      </button>
                    </>
                  )}

                  {selectedTrip.status === 'Dispatched' && (
                    <>
                      <button
                        onClick={() => setIsCompleteModalOpen(true)}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors text-xs"
                      >
                        Complete Trip
                      </button>
                      <button
                        onClick={() => handleCancel(selectedTrip.$id)}
                        disabled={actionLoading === selectedTrip.$id}
                        className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-xl transition-all text-xs disabled:opacity-50"
                      >
                        Cancel Trip
                      </button>
                    </>
                  )}

                  {(selectedTrip.status === 'Completed' || selectedTrip.status === 'Cancelled') && (
                    <p className="text-center text-slate-400 font-bold text-xs py-2 bg-slate-50 rounded-xl border border-slate-100">
                      This trip is finalized ({selectedTrip.status}).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT PANEL: Live Board list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Board</h3>
          
          <div className="space-y-4">
            {filteredTrips.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm font-medium">
                No trip records found matching your filters.
              </div>
            ) : (
              filteredTrips.map((t) => {
                const isSelected = selectedTrip?.$id === t.$id;
                const statusBadge = t.status === 'On Trip' ? 'bg-blue-500 text-white' :
                                    t.status === 'Completed' ? 'bg-green-600 text-white' :
                                    t.status === 'Dispatched' ? 'bg-blue-600 text-white' :
                                    t.status === 'Draft' ? 'bg-slate-400 text-white' :
                                    'bg-red-500 text-white';

                // Format assigned text
                const assignedText = t.vehicleId ? `${getVehicleReg(t.vehicleId)} / ${getDriverName(t.driverId).toUpperCase()}` : 'Unassigned';

                // Format right-hand metadata
                let detailsText = '—';
                if (t.status === 'On Trip') detailsText = '45 min';
                else if (t.status === 'Dispatched') detailsText = '1h 10m';
                else if (t.status === 'Draft') detailsText = 'Awaiting driver';
                else if (t.status === 'Cancelled') detailsText = 'Vehicle went to shop';

                return (
                  <div
                    key={t.$id}
                    onClick={() => setSelectedTrip(t)}
                    className={`bg-white border rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-amber-500 shadow-md shadow-amber-500/5' : 'border-slate-250'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-slate-400">TR-{t.$id.slice(-4).toUpperCase()}</span>
                        <span className="text-xs font-bold text-slate-800">{assignedText}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-none">
                        {t.source} ➔ {t.destination}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${statusBadge}`}>
                        {t.status}
                      </span>
                      <span className="w-32 text-right text-xs text-slate-500 font-semibold truncate">{detailsText}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Rule Text */}
          <p className="text-xs text-slate-400 font-semibold text-center pt-4">
            On Complete: odometer &rarr; fuel log &rarr; expenses &rarr; Vehicle & Driver Available
          </p>
        </div>

      </div>

      {/* Complete Trip Modal */}
      <CompleteTripModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onSave={handleCompleteSave}
        trip={selectedTrip}
      />
    </div>
  );
}

// Capacity formatter helper
function formatCapacity(maxLoad) {
  const load = parseFloat(maxLoad);
  if (isNaN(load)) return '—';
  if (load >= 1000) {
    const tons = load / 1000;
    return `${tons} Ton`;
  }
  return `${load} kg`;
}
