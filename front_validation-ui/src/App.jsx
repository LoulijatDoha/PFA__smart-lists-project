// src/App.jsx

import React from 'react';
// --- LA CORRECTION EST ICI ---
import { Routes, Route, Navigate } from 'react-router-dom'; 
import { useAuth } from './context/AuthContext';

// Layouts - chemins vérifiés selon votre arborescence
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

// Route Protégée
import ProtectedRoute from './components/shared/ProtectedRoute';

// Pages - chemins vérifiés selon votre arborescence
import LoginPage from './features/authentication/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ValidationPage from './features/validation/ValidationPage';
import UserAdminPage from './features/users/UserAdminPage';
import StandardisationAdminPage from './features/standardisation/StandardisationAdminPage'; // Renommé le dossier "pages" -> "features"
import FilesPage from './features/files/FilesPage'; // Renommé le dossier "pages" -> "features"
import ChangePasswordPage from './features/authentication/ChangePasswordPage'; // Nouvelle page
import StatisticsPage from './features/statistics/StatisticsPage'; 
// Autres
import NotFoundPage from './components/shared/NotFoundPage';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement de l'application...</div>;
  }
  
  return (
    <> 
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/statistics" element={<StatisticsPage />}/>
            <Route path="/validate/:sourceFileId" element={<ValidationPage />} />
          </Route>
        </Route>

        <Route path="/admin" element={<ProtectedRoute adminOnly={true} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/users" replace />} /> 
            <Route path="users" element={<UserAdminPage />} />
            <Route path="standardisation" element={<StandardisationAdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;