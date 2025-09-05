// src/features/files/FilesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import FilterPanel from './FilterPanel';
import DossierValidationTable from './DossierValidationTable';
import Pagination from '../../components/shared/Pagination'; // Le composant de pagination avancé
import { getDossiersAValider } from '../../services/listService';
import './FilesPage.css'; // On va créer un fichier CSS dédié

const ITEMS_PER_PAGE = 10; // Le nombre de fichiers à afficher par page

const FilesPage = () => {
  const [dossiers, setDossiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // --- États pour la pagination et les filtres ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ statut: '', ecole: '', annee: '', niveau: '' });

  // --- Logique de récupération des données ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // On envoie les filtres ET la page actuelle à l'API
      const response = await getDossiersAValider(filters, currentPage, ITEMS_PER_PAGE);
      setDossiers(response.data.data);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      setError("Impossible de charger la liste des fichiers.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]); // Se redéclenche si les filtres ou la page changent

  // Effet principal pour charger les données
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effet pour revenir à la première page quand l'utilisateur change un filtre
  const handleFilterChange = (newFilters) => {
    setCurrentPage(1); // On réinitialise la pagination
    setFilters(newFilters);
  };

  return (
    <div className="files-page">
      <div className="page-header">
        <h1>Fichiers à Valider</h1>
        <p>Filtrez et sélectionnez un fichier pour commencer la validation.</p>
      </div>
      
      {error && <div className="error-banner">{error}</div>}
      
      <div className="panel-container">
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      </div>
      
      <div className="table-container-files">
        <DossierValidationTable dossiers={dossiers} loading={isLoading} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default FilesPage;