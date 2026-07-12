import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ActiveCurves() {
  return (
    <>
      <div className="absolute right-0 -top-4 h-4 w-4 bg-[#F8FAFC] pointer-events-none">
        <div className="h-full w-full rounded-br-full bg-[#1A1A24]" />
      </div>
      <div className="absolute right-0 -bottom-4 h-4 w-4 bg-[#F8FAFC] pointer-events-none">
        <div className="h-full w-full rounded-tr-full bg-[#1A1A24]" />
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Normalize role string for checking
  const cleanRole = role ? role.replace(/\s+/g, '') : 'Driver';

  const navItems = [
    { label: 'Dashboard', path: '/', roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'] },
    { label: 'Vehicles', path: '/vehicles', roles: ['FleetManager', 'FinancialAnalyst'] },
    { label: 'Drivers', path: '/drivers', roles: ['FleetManager', 'SafetyOfficer'] },
    { label: 'Trips & Dispatch', path: '/trips', roles: ['FleetManager', 'Driver'] },
    { label: 'Maintenance Logs', path: '/maintenance', roles: ['FleetManager', 'FinancialAnalyst'] },
    { label: 'Fuel & Expenses', path: '/fuel-expenses', roles: ['FleetManager', 'Driver', 'FinancialAnalyst'] },
    { label: 'Reports & Analytics', path: '/analytics', roles: ['FleetManager', 'FinancialAnalyst'] },
  ];

  // Filter items based on normalized role
  const visibleNavItems = navItems.filter((item) => item.roles.includes(cleanRole));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabels = {
    FleetManager: 'Fleet Manager',
    Driver: 'Driver',
    SafetyOfficer: 'Safety Officer',
    FinancialAnalyst: 'Financial Analyst',
  };

  const displayRole = roleLabels[cleanRole] || role || 'User';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-['Inter',sans-serif] text-slate-800">
      {/* SIDEBAR: Mentor-Mentee Portal Styled */}
      <aside className="fixed top-0 left-0 z-20 hidden h-screen w-64 flex-col bg-[#1A1A24] text-white md:flex">
        {/* Header/Logo */}
        <div className="flex h-24 shrink-0 items-center justify-center border-b border-white/5 px-6">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded shadow">
              <rect width="40" height="40" rx="4" fill="#EAB308"/>
              <circle cx="8" cy="8" r="2" fill="#1C2431"/>
              <circle cx="16" cy="8" r="2" fill="#1C2431"/>
              <circle cx="24" cy="8" r="2" fill="#1C2431"/>
              <circle cx="32" cy="8" r="2" fill="#1C2431"/>
              <circle cx="8" cy="16" r="2" fill="#1C2431"/>
              <circle cx="16" cy="16" r="2" fill="#1C2431"/>
              <circle cx="24" cy="16" r="2" fill="#1C2431"/>
              <circle cx="32" cy="16" r="2" fill="#1C2431"/>
              <circle cx="8" cy="24" r="2" fill="#1C2431"/>
              <circle cx="16" cy="24" r="2" fill="#1C2431"/>
              <circle cx="24" cy="24" r="2" fill="#1C2431"/>
              <circle cx="32" cy="24" r="2" fill="#1C2431"/>
              <circle cx="8" cy="32" r="2" fill="#1C2431"/>
              <circle cx="16" cy="32" r="2" fill="#1C2431"/>
              <circle cx="24" cy="32" r="2" fill="#1C2431"/>
              <circle cx="32" cy="32" r="2" fill="#1C2431"/>
            </svg>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              TransitOps
            </h2>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto py-6 pl-4 pr-0 space-y-1.5">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-between py-3 transition-all duration-200 text-[15px] ${
                  isActive
                    ? "font-bold bg-[#F8FAFC] text-slate-900 rounded-l-full rounded-r-none pl-6 pr-6 relative z-10 mr-0"
                    : "font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
                }`}
              >
                <span>{item.label}</span>
                {isActive && <ActiveCurves />}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/5 bg-transparent space-y-3">
          <div className="px-3 py-2 bg-white/5 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center font-bold text-slate-900 text-sm">
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate text-white">{user?.email}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all font-semibold text-xs"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 min-h-screen flex flex-col">
        <div className="p-8 lg:p-10 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
