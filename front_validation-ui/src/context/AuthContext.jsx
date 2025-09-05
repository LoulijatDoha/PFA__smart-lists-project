//(Fournit les informations de l'utilisateur à toute l'app)
// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getStatus, login as apiLogin, logout as apiLogout } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await getStatus();
        if (response.data.is_logged_in) {
          setUser(response.data.user);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifyUser();
  }, []);

  const login = async (username, password) => {
    const response = await apiLogin(username, password);
    if (response.data.success) {
      setUser(response.data.user);
    }
    return response;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const refreshUser = () => {
    if (user) {
        setUser(prevUser => ({...prevUser, must_change_password: false}));
    }
  }

  const value = { user, isLoading, login, logout, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



// Hook personnalisé pour accéder facilement au contexte
export const useAuth = () => {
  return useContext(AuthContext);
};