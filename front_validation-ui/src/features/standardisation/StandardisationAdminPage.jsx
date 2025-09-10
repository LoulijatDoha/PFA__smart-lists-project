// src/features/standardisation/StandardisationAdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getStandardisationEntries, bulkDeleteStandardisationEntries } from '../../services/standardisationService';
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
    } catch (err) { toast.error("Impossible de charger les règles."); }
    finally { setLoading(false); }
  }, [currentType]);

  useEffect(() => {
    fetchEntries(currentPage);
  }, [currentPage, fetchEntries]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentType]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };
  
  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchEntries(currentPage);
    toast.success("Règle enregistrée !");
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
            if (window.confirm(`Supprimer les ${payload.length} règles sélectionnées ?`)) {
                try {
                    await bulkDeleteStandardisationEntries(currentType, payload);
                    toast.success("Règles supprimées.");
                    fetchEntries(currentPage);
                } catch (error) { toast.error("Erreur de suppression groupée."); }
            }
            break;
        default: break;
    }
  }

  const typeLabel = currentType === 'std-ecoles' ? 'Écoles' : 'Niveaux';

  return (
    <div className="std-admin-page">
      <div className="page-header">
        <h1>Gestion de la Standardisation</h1>
        <div className="header-actions">
            <div>
              <button onClick={() => setCurrentType('std-ecoles')} disabled={currentType === 'std-ecoles'} className="tab-button">Écoles</button>
              <button onClick={() => setCurrentType('std-niveaux')} disabled={currentType === 'std-niveaux'} className="tab-button" style={{ marginLeft: '0.5rem' }}>Niveaux</button>
            </div>
            <button onClick={() => handleAction('add')} className="add-rule-button">
                <FaPlus size={12} style={{ marginRight: '8px' }} />
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