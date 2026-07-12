import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Driver'); // Visual helper dropdown
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center bg-[#121212] text-white font-['Inter',sans-serif] p-4">
      
      <div className="w-full max-w-md relative">
        {/* Error State Bubble (Absolute on desktop, relative on mobile) */}
        {error && (
          <div className="md:absolute md:-right-64 md:top-24 mb-4 md:mb-0 w-full md:w-60 border-2 border-dashed border-red-500/50 rounded-2xl p-4 bg-red-950/20 text-red-400">
            <div className="flex items-start gap-2">
              <span className="text-xl leading-none">×</span>
              <p className="text-sm">
                {error} <br/>
                <span className="opacity-80">Please check your email and password.</span>
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight mb-2">Sign in to your account</h1>
          <p className="text-gray-400">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-wider">EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="driver@transitops.in"
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gray-400 transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-wider">PASSWORD</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gray-400 transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-wider">ROLE (RBAC)</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gray-400 transition-colors appearance-none"
            >
              <option value="Fleet Manager" className="bg-[#1e1e1e]">Fleet Manager</option>
              <option value="Driver" className="bg-[#1e1e1e]">Driver</option>
              <option value="Safety Officer" className="bg-[#1e1e1e]">Safety Officer</option>
              <option value="Financial Analyst" className="bg-[#1e1e1e]">Financial Analyst</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-sm py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-transparent text-amber-600 focus:ring-0 focus:ring-offset-0 accent-[#a35e10]" />
              <span className="text-gray-300">Remember me</span>
            </label>
            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#a35e10] hover:bg-[#8f520e] text-white font-medium rounded-lg px-4 py-3.5 transition-colors mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-800 text-sm text-gray-400 space-y-2">
          <p className="mb-3">Access is scoped by role after login:</p>
          <ul className="space-y-1.5 pl-1">
            <li>• Fleet Manager → Fleet, Maintenance</li>
            <li>• Driver → Dashboard, Trips</li>
            <li>• Safety Officer → Drivers, Compliance</li>
            <li>• Financial Analyst → Fuel & Expenses, Analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
