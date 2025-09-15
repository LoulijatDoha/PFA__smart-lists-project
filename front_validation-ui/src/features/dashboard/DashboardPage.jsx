// src/features/dashboard/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

// --- Services ---
import { getDashboardStats } from '../../services/dashboardService';
import { getLogs } from '../../services/logService';

// --- Composants ---
import StatCards from './components/StatCards';
import ErrorFilesTable from './components/ErrorFilesTable';

// --- Style ---
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // --- États pour les données de la page ---
  const [stats, setStats] = useState(null);
  const [errorFiles, setErrorFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fonction pour récupérer toutes les données nécessaires ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises = [getDashboardStats()];
      
      // On ajoute l'appel pour les fichiers en erreur seulement si l'utilisateur est admin
      if (isAdmin) {
        promises.push(getLogs({ statut: 'ERREUR', limit: 5 }));
      }
      
      const [statsRes, errorsRes] = await Promise.all(promises);
      
      setStats(statsRes.data);

      if (isAdmin && errorsRes) {
        setErrorFiles(errorsRes.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du tableau de bord:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // --- Effet pour charger les données au montage du composant ---
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="dashboard-page">
      {/* La grille CSS principale organise toute la page */}
      <div className="dashboard-grid">

        <div className="dashboard-header">
          <h1>Bienvenue, {user.username} !</h1>
          <p>Voici un aperçu de l'état du système.</p>
        </div>
        
        <div className="stat-cards-container">
          {/* Le composant StatCards affiche les 5 chiffres clés */}
          <StatCards stats={stats} loading={isLoading} />
        </div>
        
        <div className="dashboard-actions-wrapper">
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
          <div className="dashboard-errors-wrapper">
            <div className="dashboard-section">
              <h2>Derniers Fichiers en Erreur</h2>
              <ErrorFilesTable files={errorFiles} loading={isLoading} onReprocessSuccess={fetchData} />
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default DashboardPage;