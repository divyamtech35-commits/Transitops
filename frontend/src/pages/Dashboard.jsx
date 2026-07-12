import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, role, logout } = useAuth();

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
          <div className="bg-[#1a1a1a] border border-green-800/50 rounded-xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <h2 className="text-xl font-medium mb-1 text-green-400 flex items-center gap-2">
              <span className="text-2xl">✓</span> Login Successful!
            </h2>
            <p className="text-gray-400">
              Welcome back. You are successfully authenticated.
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-medium mb-4">TransitOps Dashboard</h2>
            <p className="text-gray-400">
              Your access level is scoped to the <strong>{role}</strong> role. Navigation and features will be rendered below based on your permissions.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
