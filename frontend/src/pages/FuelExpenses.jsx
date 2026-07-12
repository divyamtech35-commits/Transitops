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
  
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const canAddExpense = role === 'FleetManager' || role === 'FinancialAnalyst';
  const canAddFuel = role === 'FleetManager' || role === 'Driver' || role === 'FinancialAnalyst';

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
      setVehicles(results[0].documents);
      setFuelLogs(results[1].documents);
      
      if (canAddExpense) {
        setTrips(results[2].documents);
        setExpenses(results[3].documents);
        setMaintenance(results[4].documents);
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
      setFuelLogs(results[0].documents);
      
      if (canAddExpense) {
        setExpenses(results[1].documents);
        setMaintenance(results[2].documents);
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

  // Calculations for bottom table grouping
  // Group by Trip, then fall back to vehicle for non-trip specific?
  // The mockup shows Trip, Vehicle, Toll, Other, Maint, Total.
  const expensesTableData = useMemo(() => {
    const rows = [];
    
    // Process trips for specific expenses
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
        maint: 0, // Maint is usually per vehicle, not trip. We can just keep 0 for trip rows.
        total: toll + other
      });
    });

    // Process non-trip specific expenses (and maintenance) per vehicle
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

  // Apply Search Filter to both tables
  const filteredFuelLogs = useMemo(() => {
    if (!searchQuery) return fuelLogs;
    const q = searchQuery.toLowerCase();
    return fuelLogs.filter(log => getVehicleInfo(log.vehicleId).toLowerCase().includes(q));
  }, [fuelLogs, searchQuery, vehicles]);

  const filteredExpensesRows = useMemo(() => {
    if (!searchQuery) return expensesTableData;
    const q = searchQuery.toLowerCase();
    return expensesTableData.filter(row => 
      getVehicleInfo(row.vehicleId).toLowerCase().includes(q) || 
      getTripInfo(row.tripId).toLowerCase().includes(q)
    );
  }, [expensesTableData, searchQuery, vehicles, trips]);

  const totalFuelCost = fuelLogs.reduce((sum, l) => sum + l.cost, 0);
  const totalMaintCost = maintenance.filter(m => m.status === 'Closed').reduce((sum, m) => sum + (m.cost || 0), 0);
  const totalOperationalCost = totalFuelCost + totalMaintCost;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fuel & Expenses</h1>
          <p className="text-gray-400 text-sm">Track fuel consumption and operational costs.</p>
        </div>
        <div className="flex gap-3">
          {canAddFuel && (
            <button 
              onClick={() => setIsFuelModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-amber-900/20"
            >
              + Log Fuel
            </button>
          )}
          {canAddExpense && (
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-amber-900/20"
            >
              + Add Expense
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 w-full max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading data...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-10">{error}</div>
      ) : (
        <div className="space-y-8">
          
          {/* FUEL LOGS TABLE */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Fuel Logs</h2>
            <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Vehicle</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Liters</th>
                      <th className="px-6 py-4 font-medium">Fuel Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredFuelLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No fuel logs found.
                        </td>
                      </tr>
                    ) : (
                      filteredFuelLogs.map((log) => (
                        <tr key={log.$id} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{getVehicleInfo(log.vehicleId)}</td>
                          <td className="px-6 py-4">{new Date(log.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">{log.liters.toFixed(1)} L</td>
                          <td className="px-6 py-4 text-green-400 font-medium">₹{log.cost.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* OTHER EXPENSES TABLE (Only for roles that can view expenses) */}
          {canAddExpense && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Other Expenses (Toll / Misc)</h2>
              <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400 border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Trip</th>
                        <th className="px-6 py-4 font-medium">Vehicle</th>
                        <th className="px-6 py-4 font-medium">Toll</th>
                        <th className="px-6 py-4 font-medium">Other</th>
                        <th className="px-6 py-4 font-medium">Maint. (Linked)</th>
                        <th className="px-6 py-4 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredExpensesRows.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No other expenses found.
                          </td>
                        </tr>
                      ) : (
                        filteredExpensesRows.map((row) => (
                          <tr key={row.id} className="hover:bg-[#1a1a1a] transition-colors">
                            <td className="px-6 py-4 text-gray-400">{getTripInfo(row.tripId)}</td>
                            <td className="px-6 py-4 text-white font-medium">{getVehicleInfo(row.vehicleId)}</td>
                            <td className="px-6 py-4">{row.toll > 0 ? `₹${row.toll.toLocaleString()}` : '0'}</td>
                            <td className="px-6 py-4">{row.other > 0 ? `₹${row.other.toLocaleString()}` : '0'}</td>
                            <td className="px-6 py-4">{row.maint > 0 ? `₹${row.maint.toLocaleString()}` : '0'}</td>
                            <td className="px-6 py-4 font-medium text-amber-500">
                              <span className="px-2 py-1 bg-gray-800 rounded">₹{row.total.toLocaleString()}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {canAddExpense && (
            <div className="mt-8 pt-4 border-t border-gray-800 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                Total Operational Cost (Auto) = Fuel + Maint
              </span>
              <span className="text-2xl font-bold text-amber-500">
                ₹{totalOperationalCost.toLocaleString()}
              </span>
            </div>
          )}

        </div>
      )}

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
