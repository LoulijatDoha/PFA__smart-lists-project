// src/features/standardisation/StandardisationList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { deleteStandardisationEntry } from '../../services/standardisationService';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './StandardisationList.css';

const StandardisationList = ({ entries, loading, stdType, onAction }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const checkboxRef = useRef();

  useEffect(() => { setSelectedIds([]); }, [entries]);

  useEffect(() => {
    if (checkboxRef.current) {
      const isIndeterminate = selectedIds.length > 0 && selectedIds.length < entries.length;
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedIds, entries]);

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? entries.map(entry => entry.id) : []);
  };

  const handleSelectOne = (entryId) => {
    setSelectedIds(prev =>
      prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId]
    );
  };

  const handleDelete = async (entry) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la règle pour "${entry.valeur_brute}" ?`)) {
      try {
        await deleteStandardisationEntry(stdType, entry.id);
        toast.success("Règle supprimée avec succès.");
        onAction('delete-success');
      } catch {
        toast.error("Erreur lors de la suppression de la règle.");
      }
    }
  }

  if (loading) return <p style={{textAlign: 'center', padding: '2rem'}}>Chargement des données...</p>;

  return (
    <div className="table-container">
      {selectedIds.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedIds.length} sélectionné(s)</span>
          <button className="bulk-action-button danger" onClick={() => onAction('delete-selected', selectedIds)}>
            <FaTrash style={{marginRight: '0.5rem'}} /> Supprimer la sélection
          </button>
        </div>
      )}

      <table className="std-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                ref={checkboxRef}
                onChange={handleSelectAll} 
                checked={entries.length > 0 && selectedIds.length === entries.length} 
                aria-label="Tout sélectionner"
              />
            </th>
            <th>ID</th>
            <th>Valeur Brute</th>
            <th>Nom Standardisé</th>
            <th>Statut</th>
            <th>Score</th>
            <th>Créé le</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <tr key={entry.id} className={selectedIds.includes(entry.id) ? 'selected' : ''}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(entry.id)} 
                    onChange={() => handleSelectOne(entry.id)} 
                    aria-label={`Sélectionner la règle ${entry.id}`}
                  />
                </td>
                <td>{entry.id}</td>
                <td>{entry.valeur_brute}</td>
                <td>{entry.nom_standardise}</td>
                <td>
                  <span className={`status-badge status-${entry.statut.replace(' ', '_')}`}>
                    {entry.statut.replace('_', ' ')}
                  </span>
                </td>
                <td>{entry.score_confiance != null ? entry.score_confiance.toFixed(2) : 'N/A'}</td>
                <td>{new Date(entry.date_creation).toLocaleDateString()}</td>
                <td>
                  <div className="actions-cell">
                    <button className="action-button edit" title="Modifier" onClick={() => onAction('edit', entry)}><FaEdit /></button>
                    <button className="action-button delete" title="Supprimer" onClick={() => handleDelete(entry)}><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr className="empty-row">
              <td colSpan="8">Aucune règle trouvée.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StandardisationList;