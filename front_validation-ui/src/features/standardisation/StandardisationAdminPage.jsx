// src/features/standardisation/StandardisationAdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getStandardisationEntries, bulkDeleteStandardisationEntries, bulkValidateStandardisationEntries } from '../../services/standardisationService';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const fetchEntries = useCallback(async (page) => {
    setLoading(true);
    try {
      const response = await getStandardisationEntries(currentType, page, ITEMS_PER_PAGE);
      setEntries(response.data.data);
      setTotalPages(response.data.total_pages);
    } catch (err) { 
      toast.error("Impossible de charger les règles."); 
    } finally { 
      setLoading(false); 
    }
  }, [currentType]);

  useEffect(() => {
    fetchEntries(1); // Toujours revenir à la page 1 lors du changement de type ou au montage
  }, [fetchEntries]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchEntries(page);
  };
  
  const handleTypeChange = (type) => {
    setCurrentType(type);
    setCurrentPage(1); // Réinitialiser la page
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };
  
  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchEntries(currentPage);
    toast.success("Règle enregistrée avec succès !");
  };

  const handleAction = async (actionType, payload) => {
    switch(actionType) {
        case 'edit':
            setEditingEntry(payload);
            setIsModalOpen(true);
            break;
        case 'add':
            setEditingEntry(null);
            setIsModalOpen(true);
            break;
        case 'delete-success':
            fetchEntries(currentPage);
            break;
        case 'delete-selected':
            if (window.confirm(`Voulez-vous vraiment supprimer les ${payload.length} règles sélectionnées ?`)) {
                try {
                    await bulkDeleteStandardisationEntries(currentType, payload);
                    toast.success("Les règles sélectionnées ont été supprimées.");
                    fetchEntries(1); // Revenir à la première page après une suppression groupée
                    setCurrentPage(1);
                } catch (error) { 
                  toast.error("Une erreur est survenue lors de la suppression groupée."); 
                }
            }
            break;
          case 'validate-selected':
            if (window.confirm(`Voulez-vous vraiment marquer comme "VALIDÉ" les ${payload.length} règles sélectionnées ?`)) {
                try {
                    await bulkValidateStandardisationEntries(currentType, payload);
                    toast.success("Les règles sélectionnées ont été validées.");
                    fetchEntries(1); // Revenir à la première page
                    setCurrentPage(1);
                } catch (error) { 
                  toast.error("Une erreur est survenue lors de la validation groupée."); 
                }
            }
            break;
        default: break;
    }
  }

  const typeLabel = currentType === 'std-ecoles' ? 'Écoles' : 'Niveaux';

  return (
    <div className="std-admin-page">
      <div className="page-header">
        <h1>Standardisation</h1>
        <div className="header-actions">
            <div>
              <button onClick={() => handleTypeChange('std-ecoles')} disabled={currentType === 'std-ecoles'} className="tab-button">Écoles</button>
              <button onClick={() => handleTypeChange('std-niveaux')} disabled={currentType === 'std-niveaux'} className="tab-button" style={{ marginLeft: '0.5rem' }}>Niveaux</button>
            </div>
            <button onClick={() => handleAction('add')} className="header-action-button">
                <FaPlus size={12} />
                Ajouter une Règle ({typeLabel})
            </button>
        </div>
      </div>
      
      <StandardisationList 
        entries={entries} 
        loading={loading}
        stdType={currentType}
        onAction={handleAction}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
      
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