import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('jwt');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Verify token via the backend's me endpoint
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setRole(res.data.user.labels?.[0] || 'User');
      }
    } catch (error) {
      localStorage.removeItem('jwt');
      setUser(null);
      setRole(null);
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { jwt, user: returnedUser, role: returnedRole } = res.data;
      
      localStorage.setItem('jwt', jwt);
      api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
      
      setUser(returnedUser);
      setRole(returnedRole);
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('jwt');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setRole(null);
  };

  const contextData = {
    user,
    role,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={contextData}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
