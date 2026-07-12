import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, role, logout } = useAuth();

  const canViewVehicles = role !== 'Driver';
  const canViewDrivers = role !== 'Driver';
  const canViewMaintenance = role === 'FleetManager' || role === 'FinancialAnalyst' || role === 'SafetyOfficer';
  const canViewAnalytics = role === 'FleetManager' || role === 'FinancialAnalyst' || role === 'SafetyOfficer';

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400 text-sm mb-8">Access your quick links below.</p>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {canViewVehicles && (
              <Link to="/vehicles" className="bg-[#1a1a1a] border border-gray-800 hover:border-amber-500/50 rounded-xl p-6 transition-all group">
                <h2 className="text-xl font-medium mb-2 group-hover:text-amber-400 transition-colors">Vehicles</h2>
                <p className="text-gray-400">View and manage the fleet registry, track vehicle status and limits.</p>
              </Link>
            )}

            {canViewDrivers && (
              <Link to="/drivers" className="bg-[#1a1a1a] border border-gray-800 hover:border-amber-500/50 rounded-xl p-6 transition-all group">
                <h2 className="text-xl font-medium mb-2 group-hover:text-amber-400 transition-colors">Drivers</h2>
                <p className="text-gray-400">Manage driver profiles, licenses, and safety compliance records.</p>
              </Link>
            )}

            <Link to="/trips" className="bg-[#1a1a1a] border border-gray-800 hover:border-amber-500/50 rounded-xl p-6 col-span-1 md:col-span-2 transition-all group">
              <h2 className="text-xl font-medium mb-2 group-hover:text-amber-400 transition-colors">Trips & Dispatch</h2>
              <p className="text-gray-400">Manage operational trip lifecycles, assign available resources, and log completions.</p>
            </Link>

            {canViewMaintenance && (
              <Link to="/maintenance" className="bg-[#1a1a1a] border border-gray-800 hover:border-amber-500/50 rounded-xl p-6 col-span-1 md:col-span-2 transition-all group">
                <h2 className="text-xl font-medium mb-2 group-hover:text-amber-400 transition-colors">Maintenance Logs</h2>
                <p className="text-gray-400">Track vehicle repairs, maintenance costs, and manage shop availability.</p>
              </Link>
            )}

            <Link to="/fuel-expenses" className="bg-[#1a1a1a] border border-gray-800 hover:border-amber-500/50 rounded-xl p-6 col-span-1 md:col-span-2 transition-all group">
              <h2 className="text-xl font-medium mb-2 group-hover:text-amber-400 transition-colors">Fuel & Expenses</h2>
              <p className="text-gray-400">Log fuel consumption, register operational expenses, and calculate total costs.</p>
            </Link>

            {canViewAnalytics && (
              <Link to="/analytics" className="bg-[#1a1a1a] border border-gray-800 hover:border-amber-500/50 rounded-xl p-6 col-span-1 md:col-span-2 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                </div>
                <h2 className="text-xl font-medium mb-2 group-hover:text-amber-400 transition-colors">Reports & Analytics</h2>
                <p className="text-gray-400 relative z-10">Export PDF/CSV reports, view fleet utilization, ROI, and financial metrics.</p>
              </Link>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
