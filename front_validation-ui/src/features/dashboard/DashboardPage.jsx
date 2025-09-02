// src/features/dashboard/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

import StatCards from './components/StatCards';
import FileUploadModal from './components/FileUploadModal';
import FilterPanel from './components/FilterPanel';
import DossierValidationTable from './components/DossierValidationTable';
import ErrorFilesTable from './components/ErrorFilesTable';

import { getDashboardStats } from '../../services/dashboardService';
import { getDossiersAValider } from '../../services/listService';
import { getLogs } from '../../services/logService';

import { FaPlus } from 'react-icons/fa';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // --- ÉTATS ---
  const [stats, setStats] = useState(null);
  const [dossiers, setDossiers] = useState([]);
  const [errorFiles, setErrorFiles] = useState([]);
  const [filters, setFilters] = useState({ statut: '', ecole: '', annee: '', niveau: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // --- RÉFÉRENCES ---
  const validationSectionRef = useRef(null);
  const errorSectionRef = useRef(null);

  // --- RÉCUPÉRATION DES DONNÉES ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log(">>>> [FRONTEND] Appel de l'API avec les filtres :", filters);
      console.log("Filtres envoyés au backend:", filters);
      const [statsRes, dossiersRes, errorsRes] = await Promise.all([
        getDashboardStats(),
        getDossiersAValider(filters),
        isAdmin ? getLogs({ statut: 'ERREUR' }) : Promise.resolve({ data: [] })
      ]);
      setStats(statsRes.data);
      setDossiers(dossiersRes.data);
      if (isAdmin) setErrorFiles(errorsRes.data);
    } catch (err) {
      console.error("Erreur du tableau de bord:", err);
      setError("Impossible de charger les données.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- EVENTS ---
  const handleStatCardClick = (statut) => {
    if (statut === 'erreurs') {
      errorSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setFilters({ statut: statut, ecole: '', annee: '', niveau: '' });
      validationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Tableau de Bord</h1>
        <button className="add-files-button" onClick={() => setIsUploadModalOpen(true)}>
          <FaPlus /> Ajouter des Fichiers
        </button>
      </div>
      
      {isUploadModalOpen && <FileUploadModal onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={fetchData} />}
      {error && <div className="error-banner">{error}</div>}
      
      <StatCards stats={stats} loading={isLoading} onCardClick={handleStatCardClick} />
      
      {isAdmin && (
        <div className="dashboard-section" ref={errorSectionRef}>
          <h2>Fichiers en Erreur Système</h2>
          <ErrorFilesTable files={errorFiles} loading={isLoading} onReprocessSuccess={fetchData} />
        </div>
      )}
      
      <div className="dashboard-section" ref={validationSectionRef}>
        <h2>Fichiers en Attente de Validation</h2>
        <FilterPanel filters={filters} setFilters={setFilters} />
        <DossierValidationTable dossiers={dossiers} loading={isLoading} />
      </div>
    </div>
  );
};

export default DashboardPage;
