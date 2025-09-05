// src/features/dashboard/components/ErrorFilesTable.jsx
import React from 'react';
// Assurez-vous que le chemin vers votre service est correct
import { reprocessFile } from '../../../services/fileService'; 
import './ErrorFilesTable.css'; 

const ErrorFilesTable = ({ files, loading, onReprocessSuccess }) => {

  const handleReprocess = async (fileId) => {
    if (window.confirm("Êtes-vous sûr de vouloir relancer le traitement complet de ce fichier ?")) {
      try {
        await reprocessFile(fileId);
        alert("Le fichier a été mis en file d'attente pour être retraité.");
        onReprocessSuccess();
      } catch (error) {
        alert("Erreur lors de la tentative de retraitement.");
        console.error(error);
      }
    }
  };

  if (loading) return <p>Chargement des fichiers en erreur...</p>;
  
  if (!files || files.length === 0) {
    return (
        <div className="all-good-message">
            <p>Aucun fichier en erreur système à corriger.</p>
        </div>
    );
  }

  return (
    <table className="lists-table error-table">
      <thead>
        <tr>
          <th>Nom du Fichier</th>
          <th>Type d'Erreur</th>
          <th>Message</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <tr key={file.id_fichier_drive}>
            <td>{file.nom_fichier}</td>
            <td>
                <span className={`status-badge status-${file.statut}`}>
                    {file.statut.replace('ERREUR_', '')}
                </span>
            </td>
            <td style={{ maxWidth: '400px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {file.error_message}
            </td>
            <td>
              <button className="reprocess-button" onClick={() => handleReprocess(file.id_fichier_drive)}>
                Retraiter
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ErrorFilesTable;