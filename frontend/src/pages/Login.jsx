import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('driver@transitops.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('Dispatcher'); // Visual helper selector
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'Fleet Manager') {
      setEmail('fleet@transitops.in');
      setPassword('password123');
    } else if (selectedRole === 'Dispatcher') {
      setEmail('driver@transitops.in');
      setPassword('password123');
    } else if (selectedRole === 'Safety Officer') {
      setEmail('safety@transitops.in');
      setPassword('password123');
    } else if (selectedRole === 'Financial Analyst') {
      setEmail('finance@transitops.in');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#1c2431] font-['Inter',sans-serif] text-slate-800">
      
      {/* LEFT SIDE: Dark Section */}
      <div className="md:w-[40%] bg-[#1c2431] text-white p-8 md:p-12 lg:p-16 flex flex-col justify-between select-none relative overflow-hidden min-h-[300px] md:min-h-screen">
        <div className="space-y-12 my-auto">
          {/* Logo Section */}
          <div className="space-y-4">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shadow-lg rounded">
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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">TransitOps</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide mt-1">Smart Transport Operations Platform</p>
            </div>
          </div>

          {/* Core Bullet points */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">One login, four roles:</h3>
            <ul className="space-y-2.5 text-sm font-medium pl-1">
              <li className="flex items-center gap-2">
                <span className="text-amber-500 text-xs">●</span> Fleet Manager
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-500 text-xs">●</span> Dispatcher
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-500 text-xs">●</span> Safety Officer
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-500 text-xs">●</span> Financial Analyst
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] tracking-wider text-slate-500 font-bold mt-12 uppercase">
          TransitOps &copy; 2026 - RBAC ENA1
        </p>
      </div>

      {/* RIGHT SIDE: Light Section */}
      <div className="md:w-[60%] bg-white flex items-center justify-center p-8 md:p-16 lg:p-24 relative min-h-screen">
        
        {/* Absolute floating error card on desktop */}
        {error && (
          <div className="md:absolute md:right-8 lg:right-16 md:top-24 w-full md:w-64 border-2 border-dashed border-red-300 rounded-2xl p-4 bg-red-50 text-red-600 space-y-1 z-10 mb-6 md:mb-0">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Error state</p>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <span>✕</span> {error}
            </p>
            <p className="text-[11px] text-red-400 mt-1 font-medium leading-relaxed">
              Account locked after 5 failed attempts.
            </p>
          </div>
        )}

        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Sign in to your account</h2>
            <p className="text-sm text-slate-400 mt-2 font-medium">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Raven.k@transitops.in"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-slate-900 transition-colors font-medium"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-slate-900 transition-colors font-medium"
                required
              />
            </div>

            {/* Role select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Role (RBAC)</label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-slate-900 transition-colors font-semibold appearance-none cursor-pointer"
              >
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Financial Analyst">Financial Analyst</option>
              </select>
            </div>

            {/* Checkbox and Forgot Link */}
            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-0 focus:ring-offset-0 accent-emerald-600"
                />
                <span className="text-slate-600 font-semibold">Remember me</span>
              </label>
              <a href="#" className="text-blue-500 hover:text-blue-600 font-bold transition-colors">Forgot password?</a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-white font-bold rounded-xl px-4 py-3.5 transition-colors shadow-md mt-2 disabled:opacity-50 text-base"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Access Scope Info */}
          <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-500">Access is scoped by role after login:</p>
            <ul className="space-y-1 pl-1 text-[11px] text-slate-400">
              <li>• Fleet Manager ➔ Fleet, Maintenance</li>
              <li>• Dispatcher ➔ Dashboard, Trips</li>
              <li>• Safety Officer ➔ Drivers, Compliance</li>
              <li>• Financial Analyst ➔ Fuel & Expenses, Analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
