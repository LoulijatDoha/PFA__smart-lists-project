// src/features/standardisation/StandardisationList.jsx
import React, { useState, useEffect } from 'react';
import { deleteStandardisationEntry } from '../../services/standardisationService';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './StandardisationList.css';

const StandardisationList = ({ entries, loading, stdType, onAction }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => { setSelectedIds([]); }, [entries]);

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? entries.map(entry => entry.id) : []);
  };

  const handleSelectOne = (entryId) => {
    setSelectedIds(prev =>
      prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId]
    );
  };

  const handleDelete = async (entry) => {
    if (window.confirm(`Supprimer la règle ID: ${entry.id} ?`)) {
      try {
        await deleteStandardisationEntry(stdType, entry.id);
        toast.success("Règle supprimée.");
        onAction('delete-success');
      } catch {
        toast.error("Erreur de suppression.");
      }
    }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="table-container">
      {selectedIds.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedIds.length} sélectionné(s)</span>
          <button className="bulk-action-button danger" onClick={() => onAction('delete-selected', selectedIds)}>
            <FaTrash /> Supprimer la sélection
          </button>
        </div>
      )}

      <table className="std-table">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={handleSelectAll} checked={entries.length > 0 && selectedIds.length === entries.length} /></th>
            <th>ID</th>
            <th>Valeur Brute</th>
            <th>Nom Standardisé</th>
            <th>Statut</th>
            <th>Score</th>
            <th>Date Création</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className={selectedIds.includes(entry.id) ? 'selected' : ''}>
              <td><input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => handleSelectOne(entry.id)} /></td>
              <td>{entry.id}</td>
              <td>{entry.valeur_brute}</td>
              <td>{entry.nom_standardise}</td>
              <td>
                <span className={`status-badge status-${entry.statut.replace(' ', '_')}`}>
                  {entry.statut.replace('_', ' ')}
                </span>
              </td>
              <td>{entry.score_confiance != null ? entry.score_confiance.toFixed(2) : '-'}</td>
              <td>{entry.date_creation}</td>
              <td>
                <div className="actions-cell">
                  <button className="action-button edit" onClick={() => onAction('edit', entry)}><FaEdit /></button>
                  <button className="action-button delete" onClick={() => handleDelete(entry)}><FaTrash /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StandardisationList;