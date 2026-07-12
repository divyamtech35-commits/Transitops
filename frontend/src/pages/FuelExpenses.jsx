import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFuelLogs, createFuelLog } from '../api/fuel';
import { getExpenses, createExpense } from '../api/expenses';
import { getVehicles } from '../api/vehicles';
import { getTrips } from '../api/trips';
import { getMaintenanceLogs } from '../api/maintenance';
import FuelModal from '../components/FuelModal';
import ExpenseModal from '../components/ExpenseModal';

const FuelExpenses = () => {
  const { role } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByFuel, setSortByFuel] = useState('Date Newest');
  const [sortByExpense, setSortByExpense] = useState('Total Cost (High-Low)');
  
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const cleanRole = role ? role.replace(/\s+/g, '') : 'Driver';
  const canAddExpense = cleanRole === 'FleetManager' || cleanRole === 'FinancialAnalyst';
  const canAddFuel = cleanRole === 'FleetManager' || cleanRole === 'Driver' || cleanRole === 'FinancialAnalyst';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const promises = [
        getVehicles(),
        getFuelLogs()
      ];
      
      if (canAddExpense) {
        promises.push(getTrips());
        promises.push(getExpenses());
        promises.push(getMaintenanceLogs());
      }
      
      const results = await Promise.all(promises);
      setVehicles(results[0].documents || []);
      setFuelLogs(results[1].documents || []);
      
      if (canAddExpense) {
        setTrips(results[2].documents || []);
        setExpenses(results[3].documents || []);
        setMaintenance(results[4].documents || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const promises = [getFuelLogs()];
      if (canAddExpense) {
        promises.push(getExpenses());
        promises.push(getMaintenanceLogs());
      }
      
      const results = await Promise.all(promises);
      setFuelLogs(results[0].documents || []);
      
      if (canAddExpense) {
        setExpenses(results[1].documents || []);
        setMaintenance(results[2].documents || []);
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  const handleFuelSave = async (data) => {
    await createFuelLog(data);
    setIsFuelModalOpen(false);
    await refreshData();
  };

  const handleExpenseSave = async (data) => {
    await createExpense(data);
    setIsExpenseModalOpen(false);
    await refreshData();
  };

  const getVehicleInfo = (id) => {
    const v = vehicles.find(v => v.$id === id);
    return v ? `${v.registrationNumber} - ${v.model}` : 'Unknown Vehicle';
  };

  const getTripInfo = (id) => {
    if (!id) return '-';
    const t = trips.find(t => t.$id === id);
    return t ? `TR-${t.$id.slice(-4).toUpperCase()}` : id.slice(-4).toUpperCase();
  };

  const expensesTableData = useMemo(() => {
    const rows = [];
    
    trips.forEach(trip => {
      const tripExpenses = expenses.filter(e => e.tripId === trip.$id);
      if (tripExpenses.length === 0) return;

      const toll = tripExpenses.filter(e => e.type === 'Toll').reduce((sum, e) => sum + e.cost, 0);
      const other = tripExpenses.filter(e => e.type !== 'Toll').reduce((sum, e) => sum + e.cost, 0);
      
      rows.push({
        id: `trip-${trip.$id}`,
        tripId: trip.$id,
        vehicleId: trip.vehicleId,
        toll,
        other,
        maint: 0,
        total: toll + other
      });
    });

    vehicles.forEach(vehicle => {
      const vehExpenses = expenses.filter(e => !e.tripId && e.vehicleId === vehicle.$id);
      const vehMaint = maintenance.filter(m => m.vehicleId === vehicle.$id && m.status === 'Closed').reduce((sum, m) => sum + (m.cost || 0), 0);
      
      if (vehExpenses.length === 0 && vehMaint === 0) return;

      const toll = vehExpenses.filter(e => e.type === 'Toll').reduce((sum, e) => sum + e.cost, 0);
      const other = vehExpenses.filter(e => e.type !== 'Toll').reduce((sum, e) => sum + e.cost, 0);
      
      rows.push({
        id: `veh-${vehicle.$id}`,
        tripId: null,
        vehicleId: vehicle.$id,
        toll,
        other,
        maint: vehMaint,
        total: toll + other + vehMaint
      });
    });

    return rows;
  }, [expenses, trips, vehicles, maintenance]);

  const filteredFuelLogs = useMemo(() => {
    let result = fuelLogs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = fuelLogs.filter(log => getVehicleInfo(log.vehicleId).toLowerCase().includes(q));
    }
    
    // Make a copy to sort
    result = [...result];
    result.sort((a, b) => {
      if (sortByFuel === 'Date Newest') return new Date(b.date) - new Date(a.date);
      if (sortByFuel === 'Date Oldest') return new Date(a.date) - new Date(b.date);
      if (sortByFuel === 'Cost (High-Low)') return (b.cost || 0) - (a.cost || 0);
      if (sortByFuel === 'Cost (Low-High)') return (a.cost || 0) - (b.cost || 0);
      return 0;
    });
    return result;
  }, [fuelLogs, searchQuery, sortByFuel, vehicles]);

  const filteredExpensesRows = useMemo(() => {
    let result = expensesTableData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = expensesTableData.filter(row => 
        getVehicleInfo(row.vehicleId).toLowerCase().includes(q) || 
        getTripInfo(row.tripId).toLowerCase().includes(q)
      );
    }
    
    result = [...result];
    result.sort((a, b) => {
      if (sortByExpense === 'Total Cost (High-Low)') return (b.total || 0) - (a.total || 0);
      if (sortByExpense === 'Total Cost (Low-High)') return (a.total || 0) - (b.total || 0);
      if (sortByExpense === 'Tolls (High-Low)') return (b.toll || 0) - (a.toll || 0);
      if (sortByExpense === 'Maint (High-Low)') return (b.maint || 0) - (a.maint || 0);
      return 0;
    });
    return result;
  }, [expensesTableData, searchQuery, sortByExpense, vehicles, trips]);

  const totalFuelCost = fuelLogs.reduce((sum, l) => sum + l.cost, 0);
  const totalMaintCost = maintenance.filter(m => m.status === 'Closed').reduce((sum, m) => sum + (m.cost || 0), 0);
  const totalOperationalCost = totalFuelCost + totalMaintCost;

  if (loading && fuelLogs.length === 0) {
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
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Fuel & Expenses Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Track fuel refills, road tolls, and maintenance operational costs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canAddFuel && (
            <button 
              onClick={() => setIsFuelModalOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shadow-amber-500/10"
            >
              Log Fuel
            </button>
          )}
          {canAddExpense && (
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shadow-blue-500/10"
            >
              Add Expense
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <input
          type="text"
          placeholder="Search by vehicle reg or trip code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-600 w-full max-w-md"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="space-y-8">
        
        {/* FUEL LOGS */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fuel Refill Logs</h3>
            <select
              value={sortByFuel}
              onChange={(e) => setSortByFuel(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 focus:outline-none"
            >
              <option value="Date Newest">Date Newest</option>
              <option value="Date Oldest">Date Oldest</option>
              <option value="Cost (High-Low)">Cost (High-Low)</option>
              <option value="Cost (Low-High)">Cost (Low-High)</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Vehicle</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Liters</th>
                    <th className="px-6 py-4 text-right font-semibold">Fuel Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredFuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                        No fuel refill logs registered.
                      </td>
                    </tr>
                  ) : (
                    filteredFuelLogs.map((log) => (
                      <tr key={log.$id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{getVehicleInfo(log.vehicleId)}</td>
                        <td className="px-6 py-4">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{log.liters?.toFixed(1)} L</td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">${log.cost?.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* OTHER EXPENSES */}
        {canAddExpense && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tolls & Operations Expenses</h3>
              <select
                value={sortByExpense}
                onChange={(e) => setSortByExpense(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 focus:outline-none"
              >
                <option value="Total Cost (High-Low)">Total Cost (High-Low)</option>
                <option value="Total Cost (Low-High)">Total Cost (Low-High)</option>
                <option value="Tolls (High-Low)">Tolls (High-Low)</option>
                <option value="Maint (High-Low)">Maint (High-Low)</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Trip ID</th>
                      <th className="px-6 py-4 font-semibold">Vehicle</th>
                      <th className="px-6 py-4 font-semibold">Toll Charges</th>
                      <th className="px-6 py-4 font-semibold">Other Charges</th>
                      <th className="px-6 py-4 font-semibold">Maint Cost</th>
                      <th className="px-6 py-4 text-right font-semibold">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredExpensesRows.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                          No tolls or operations expenses registered.
                        </td>
                      </tr>
                    ) : (
                      filteredExpensesRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-400">{getTripInfo(row.tripId)}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{getVehicleInfo(row.vehicleId)}</td>
                          <td className="px-6 py-4">${row.toll?.toLocaleString()}</td>
                          <td className="px-6 py-4">${row.other?.toLocaleString()}</td>
                          <td className="px-6 py-4">${row.maint?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800">
                            ${row.total?.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Aggregate operational cost footer */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Total Operational Fleet Expense (Fuel + Maintenance)
              </span>
              <span className="text-3xl font-extrabold text-amber-600">
                ${totalOperationalCost?.toLocaleString()}
              </span>
            </div>
          </div>
        )}

      </div>

      <FuelModal 
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        onSave={handleFuelSave}
        vehicles={vehicles}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleExpenseSave}
        vehicles={vehicles}
        trips={trips}
      />
    </div>
  );
};

export default FuelExpenses;
