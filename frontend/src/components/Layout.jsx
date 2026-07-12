import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const canViewVehicles = role !== 'Driver';
  const canViewDrivers = role !== 'Driver';
  const canViewMaintenance = role === 'FleetManager' || role === 'FinancialAnalyst' || role === 'SafetyOfficer';
  const canViewAnalytics = role === 'FleetManager' || role === 'FinancialAnalyst' || role === 'SafetyOfficer';

  const navLinks = [
    { name: 'Dashboard', path: '/', show: true },
    { name: 'Vehicles', path: '/vehicles', show: canViewVehicles },
    { name: 'Drivers', path: '/drivers', show: canViewDrivers },
    { name: 'Trips & Dispatch', path: '/trips', show: true },
    { name: 'Maintenance Logs', path: '/maintenance', show: canViewMaintenance },
    { name: 'Fuel & Expenses', path: '/fuel-expenses', show: true },
    { name: 'Reports & Analytics', path: '/analytics', show: canViewAnalytics }
  ];

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold text-gray-100 mb-1">TransitOps</h1>
            <p className="text-gray-400 text-sm truncate">{user?.email}</p>
            <div className="mt-3 inline-block px-3 py-1 bg-[#a35e10]/20 text-[#a35e10] rounded-full text-xs font-medium border border-[#a35e10]/30">
              {role}
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            {navLinks.filter(link => link.show).map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={logout}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#121212]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
