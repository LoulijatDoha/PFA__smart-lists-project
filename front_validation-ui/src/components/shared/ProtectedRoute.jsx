// (Pour sécuriser les routes)
// src/components/shared/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement de la session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />; // Ou une page "accès refusé"
  }

  return <Outlet />; // Affiche le composant enfant (la page) si tout est ok
};

export default ProtectedRoute;