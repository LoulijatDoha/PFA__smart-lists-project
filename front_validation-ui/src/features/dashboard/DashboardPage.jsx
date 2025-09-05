// src/features/dashboard/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import StatCards from './components/StatCards';
import ErrorFilesTable from './components/ErrorFilesTable';
import { getDashboardStats } from '../../services/dashboardService';
import { getLogs } from '../../services/logService';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [stats, setStats] = useState(null);
  const [errorFiles, setErrorFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, errorsRes] = await Promise.all([
        getDashboardStats(),
        isAdmin ? getLogs({ statut: 'ERREUR', limit: 5 }) : Promise.resolve({ data: [] })
      ]);
      setStats(statsRes.data);
      if (isAdmin) setErrorFiles(errorsRes.data);
    } catch (err) {
      console.error("Erreur du tableau de bord:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Bienvenue, {user.username} !</h1>
        <p>Voici un aperçu de l'état du système.</p>
      </div>
      
      <StatCards stats={stats} loading={isLoading} />
      
      <div className="dashboard-actions">
        <Link to="/files" className="action-card">
          <h2>Accéder aux Fichiers</h2>
          <p>Consulter, filtrer et valider tous les dossiers de listes scolaires.</p>
        </Link>
        {isAdmin && (
          <Link to="/admin" className="action-card">
            <h2>Espace Administration</h2>
            <p>Gérer les utilisateurs et les règles de standardisation.</p>
          </Link>
        )}
      </div>

      {isAdmin && (
        <div className="dashboard-section" style={{marginTop: '2rem'}}>
          <h2>Derniers Fichiers en Erreur Système</h2>
          <ErrorFilesTable files={errorFiles} loading={isLoading} onReprocessSuccess={fetchData} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;