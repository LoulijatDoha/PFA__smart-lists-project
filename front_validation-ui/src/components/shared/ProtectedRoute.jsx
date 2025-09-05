// src/components/shared/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
const ProtectedRoute = ({ adminOnly = false }) => {
const { user, isLoading } = useAuth();
const location = useLocation();
if (isLoading) return <div>Chargement...</div>;
if (!user) return <Navigate to="/login" />;
// --- LA LOGIQUE CRUCIALE ---
// Si l'utilisateur DOIT changer son mot de passe et n'est PAS sur la page pour le faire...
if (user.must_change_password && location.pathname !== '/change-password') {
// ... on le redirige de force.
return <Navigate to="/change-password" />;
}
if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
return <Outlet />;
};

export default ProtectedRoute;