// src/features/standardisation/StandardisationAdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getStandardisationEntries } from '../../services/standardisationService';
import StandardisationList from './StandardisationList';
import StandardisationFormModal from './StandardisationFormModal';
import Pagination from '../../components/shared/Pagination';
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';
import './StandardisationAdminPage.css';

const ITEMS_PER_PAGE = 10;

const StandardisationAdminPage = () => {
  const [entries, setEntries] = useState([]);
  const [currentType, setCurrentType] = useState('std-ecoles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
        const response = await getStandardisationEntries(currentType, currentPage, ITEMS_PER_PAGE);
        setEntries(response.data.data);
        setTotalPages(response.data.total_pages);
    } catch (err) {
        const errorDetails = err.response?.data?.details || err.message;
        setError(`Impossible de charger les données. Erreur: ${errorDetails}`);
        console.error("Erreur détaillée:", err.response?.data);
    } finally {
        setLoading(false);
    }
  }, [currentType, currentPage]);
  
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleTypeChange = (newType) => {
    if (newType !== currentType) {
        setCurrentType(newType);
        setCurrentPage(1);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };
  
  const handleSaveSuccess = () => {
    toast.success("Opération réussie !");
    handleCloseModal();
    fetchEntries();
  };

  const typeLabel = currentType === 'std-ecoles' ? 'Écoles' : 'Niveaux';

  return (
    <div className="std-admin-page">
      <div className="page-header">
        <h1>Gestion de la Standardisation</h1>
        <div className="header-actions">
            <div>
              <button onClick={() => handleTypeChange('std-ecoles')} disabled={currentType === 'std-ecoles'} className="tab-button">Écoles</button>
              <button onClick={() => handleTypeChange('std-niveaux')} disabled={currentType === 'std-niveaux'} className="tab-button" style={{ marginLeft: '0.5rem' }}>Niveaux</button>
            </div>
            <button onClick={handleAddEntry} className="add-rule-button">
                <FaPlus size={12} style={{ marginRight: '8px' }} />
                Ajouter une Règle ({typeLabel})
            </button>
        </div>
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      <StandardisationList 
        entries={entries} 
        loading={loading}
        stdType={currentType}
        onEdit={handleEditEntry}
        onDeleteSuccess={handleSaveSuccess}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
      
      <StandardisationFormModal 
        isOpen={isModalOpen}
        stdType={currentType}
        entryToEdit={editingEntry}
        onClose={handleCloseModal}
        onSave={handleSaveSuccess}
      />
    </div>
  );
};

export default StandardisationAdminPage;