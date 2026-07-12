import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export default function Login() {
  const [email, setEmail] = useState('driver@transitops.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('Driver'); // Visual helper selector
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'Fleet Manager') {
      setEmail('fleet@transitops.in');
      setPassword('password123');
    } else if (selectedRole === 'Driver') {
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
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Invalid credentials. Please try again.';
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: errMsg,
        confirmButtonColor: '#eab308',
        customClass: {
          container: 'font-sans'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#1c2431] font-['Inter',sans-serif] text-slate-800">

      {/* LEFT SIDE: Dark Section */}
      <div className="md:w-[40%] bg-[#1c2431] text-white p-8 md:p-12 lg:p-16 flex flex-col justify-center select-none relative overflow-hidden min-h-[300px] md:min-h-screen">
        <div className="space-y-12">
          {/* Logo Section */}
          <div className="space-y-4">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shadow-lg rounded">
              <rect width="40" height="40" rx="4" fill="#EAB308" />
              <circle cx="8" cy="8" r="2" fill="#1C2431" />
              <circle cx="16" cy="8" r="2" fill="#1C2431" />
              <circle cx="24" cy="8" r="2" fill="#1C2431" />
              <circle cx="32" cy="8" r="2" fill="#1C2431" />
              <circle cx="8" cy="16" r="2" fill="#1C2431" />
              <circle cx="16" cy="16" r="2" fill="#1C2431" />
              <circle cx="24" cy="16" r="2" fill="#1C2431" />
              <circle cx="32" cy="16" r="2" fill="#1C2431" />
              <circle cx="8" cy="24" r="2" fill="#1C2431" />
              <circle cx="16" cy="24" r="2" fill="#1C2431" />
              <circle cx="24" cy="24" r="2" fill="#1C2431" />
              <circle cx="32" cy="24" r="2" fill="#1C2431" />
              <circle cx="8" cy="32" r="2" fill="#1C2431" />
              <circle cx="16" cy="32" r="2" fill="#1C2431" />
              <circle cx="24" cy="32" r="2" fill="#1C2431" />
              <circle cx="32" cy="32" r="2" fill="#1C2431" />
            </svg>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">TransitOps</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide mt-1">Smart Transport Operations Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Light Section */}
      <div className="md:w-[60%] bg-white flex items-center justify-center p-8 md:p-16 lg:p-24 relative min-h-screen">

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
                <option value="Driver">Driver</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Financial Analyst">Financial Analyst</option>
              </select>
            </div>

            {/* Checkbox */}
            <div className="flex items-center text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-0 focus:ring-offset-0 accent-emerald-600"
                />
                <span className="text-slate-600 font-semibold">Remember me</span>
              </label>
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
        </div>
      </div>
    </div>
  );
}
