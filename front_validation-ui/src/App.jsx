// src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

import LoginPage from './features/authentication/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import UserAdminPage from './features/users/UserAdminPage';
import ValidationPage from './features/validation/ValidationPage';
import NotFoundPage from './components/shared/NotFoundPage';

import { Toaster } from 'react-hot-toast';

const App = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement de l'application...</div>;
  }
  
  // --- MODIFICATION 1: Utiliser un Fragment React pour avoir plusieurs éléments au premier niveau ---
  return (
    <> 
      {/* --- MODIFICATION 2: Toaster déplacé ici, à l'extérieur des Routes --- */}
      {/* Il sera maintenant toujours présent, peu importe la page affichée. */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          }
        }}
      />

      {/* Votre logique de routage reste inchangée */}
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Routes protégées */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/validate/:sourceFileId" element={<ValidationPage />} />
          </Route>
        </Route>

        {/* Routes Admin */}
        <Route element={<ProtectedRoute adminOnly={true} />}>
          <Route element={<MainLayout />}>
             <Route path="/admin/users" element={<UserAdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;