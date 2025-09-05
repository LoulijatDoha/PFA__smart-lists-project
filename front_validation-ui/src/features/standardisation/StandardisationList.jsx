// src/features/standardisation/StandardisationList.jsx
import React from 'react';
import { deleteStandardisationEntry } from '../../services/standardisationService';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './StandardisationList.css';

const StandardisationList = ({ entries, loading, stdType, onEdit, onDeleteSuccess }) => {
  
  const handleDelete = async (entryId) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette règle (ID: ${entryId}) ?`)) {
      try {
        await deleteStandardisationEntry(stdType, entryId);
        toast.success("Règle supprimée avec succès.");
        onDeleteSuccess();
      } catch (error) {
        toast.error("Erreur lors de la suppression.");
      }
    }
  };

  if (loading) return <p>Chargement des règles...</p>;
  if (!entries.length && !loading) return <p>Aucune règle à afficher pour cette catégorie.</p>;

  return (
    <div className="table-container">
      <table className="std-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Valeur Brute</th>
            <th>Nom Standardisé</th>
            <th>Statut</th>
            <th>Score Confiance</th>
            <th>Date Création</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
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
                  <button className="action-button edit" onClick={() => onEdit(entry)} title="Modifier">
                    <FaEdit />
                  </button>
                  <button className="action-button delete" onClick={() => handleDelete(entry.id)} title="Supprimer">
                    <FaTrash />
                  </button>
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
