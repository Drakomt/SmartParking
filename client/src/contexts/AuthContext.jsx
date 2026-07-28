import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('smartParking_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (err) {
        console.error('Failed to parse user data from localStorage');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('smartParking_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartParking_user');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">טוען...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
