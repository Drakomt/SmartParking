import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    let storedUser = localStorage.getItem('smartParking_user');
    if (!storedUser) {
      storedUser = sessionStorage.getItem('smartParking_user');
    }

    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (err) {
        console.error('Failed to parse user data');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const login = (userData, rememberMe = false) => {
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('smartParking_user', JSON.stringify(userData));
      sessionStorage.removeItem('smartParking_user');
    } else {
      sessionStorage.setItem('smartParking_user', JSON.stringify(userData));
      localStorage.removeItem('smartParking_user');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartParking_user');
    sessionStorage.removeItem('smartParking_user');
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
