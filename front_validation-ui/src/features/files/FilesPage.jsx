// src/features/files/FilesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import FilterPanel from './FilterPanel';
import DossierValidationTable from './DossierValidationTable';
import Pagination from '../../components/shared/Pagination';
// MODIFIÉ : On importe la nouvelle fonction
import { getDossiersAValider, getDossierIds } from '../../services/listService';
import './FilesPage.css';

const ITEMS_PER_PAGE = 10;

const FilesPage = () => {
  const [dossiers, setDossiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ statut: '', ecole: '', annee: '', niveau: '' });
  
  // NOUVEAU : Un état pour stocker la file d'attente complète des IDs
  const [dossierIdQueue, setDossierIdQueue] = useState([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // On lance les deux appels en parallèle pour plus d'efficacité
      const [dossiersResponse, idsResponse] = await Promise.all([
        getDossiersAValider(filters, currentPage, ITEMS_PER_PAGE),
        getDossierIds(filters) // On récupère la liste complète des IDs
      ]);
      
      setDossiers(dossiersResponse.data.data);
      setTotalPages(dossiersResponse.data.total_pages);
      setDossierIdQueue(idsResponse.data); // On stocke la liste complète

    } catch (err) {
      setError("Impossible de charger la liste des fichiers.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (newFilters) => {
    setCurrentPage(1);
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
        {/* MODIFIÉ : On passe la file d'attente complète au tableau */}
        <DossierValidationTable dossiers={dossiers} loading={isLoading} fileQueue={dossierIdQueue} />
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