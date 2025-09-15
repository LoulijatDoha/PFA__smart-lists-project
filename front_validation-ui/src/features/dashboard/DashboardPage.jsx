// src/features/dashboard/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

// --- Icônes pour les cartes d'action ---
import { FaFolderOpen, FaUserShield } from 'react-icons/fa';

// --- Services pour récupérer les données ---
import { getDashboardStats } from '../../services/dashboardService';
import { getLogs } from '../../services/logService';

// --- Composants enfants ---
import StatCards from './components/StatCards';
import ErrorFilesTable from './components/ErrorFilesTable';

// --- Le style associé à la page ---
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // --- États pour stocker les données et l'état de chargement ---
  const [stats, setStats] = useState(null);
  const [errorFiles, setErrorFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fonction pour récupérer toutes les données nécessaires à la page ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // On prépare les appels API à lancer en parallèle
      const promises = [getDashboardStats()];
      
      // On ajoute l'appel pour les fichiers en erreur seulement si l'utilisateur est admin
      if (isAdmin) {
        promises.push(getLogs({ statut: 'ERREUR', limit: 5 }));
      }
      
      // On exécute tous les appels en même temps pour plus de rapidité
      const [statsRes, errorsRes] = await Promise.all(promises);
      
      setStats(statsRes.data);

      // On s'assure que errorsRes existe avant de mettre à jour l'état
      if (isAdmin && errorsRes) {
        setErrorFiles(errorsRes.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du tableau de bord:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]); // La fonction se recrée uniquement si le statut admin change

  // --- Effet pour charger les données une seule fois au montage du composant ---
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="dashboard-page">
      {/* La grille CSS principale organise toute la page */}
      <div className="dashboard-grid">

        {/* Zone 1: En-tête de la page */}
        <div className="dashboard-header">
          <h1>Bienvenue, {user.username} !</h1>
          <p>Voici un aperçu de l'état du système.</p>
        </div>
        
        {/* Zone 2: Cartes de statistiques (KPIs) */}
        <div className="stat-cards-container">
          <StatCards stats={stats} loading={isLoading} />
        </div>
        
        {/* Zone 3: Cartes d'actions rapides */}
        <div className="dashboard-actions-wrapper">
          <Link to="/files" className="action-card">
            <div className="action-card-icon">
              <FaFolderOpen />
            </div>
            <div className="action-card-content">
              <h2>Accéder aux Fichiers</h2>
              <p>Consulter, filtrer et valider les dossiers.</p>
            </div>
          </Link>

          {isAdmin && (
            <Link to="/admin" className="action-card">
              <div className="action-card-icon">
                <FaUserShield />
              </div>
              <div className="action-card-content">
                <h2>Espace Administration</h2>
                <p>Gérer utilisateurs et standardisation.</p>
              </div>
            </Link>
          )}
        </div>

        {/* Zone 4: Tableau des erreurs (visible uniquement pour les admins) */}
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