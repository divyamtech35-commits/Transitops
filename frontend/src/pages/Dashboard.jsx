import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, role, logout } = useAuth();

  const canViewVehicles = role !== 'Driver';
  const canViewDrivers = role !== 'Driver';

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">TransitOps</h1>
            <p className="text-gray-400 mt-1">Logged in as {user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-[#a35e10]/20 text-[#a35e10] rounded-full text-sm font-medium border border-[#a35e10]/30">
              {role}
            </span>
            <button 
              onClick={logout}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

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
            
          </div>
        </main>
      </div>
    </div>
  );
}
