// src/features/files/DossierValidationTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaFilePdf, FaImage, FaChevronRight } from 'react-icons/fa';

const DossierValidationTable = ({ dossiers, loading, fileQueue }) => {
  if (loading) return <div className="loading-state"><p>Chargement des fichiers...</p></div>;
  if (!dossiers || dossiers.length === 0) return <div className="empty-state"><p>Aucun fichier ne correspond à vos critères.</p></div>;
const fileIdsForNavigation = fileQueue.join(',');
  return (
    <table className="files-table">
      <thead>
        <tr>
          <th>Fichier</th>
          <th>École</th>
          <th>Année Scolaire</th>
          <th>Progression</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {dossiers.map((dossier) => (
          <tr key={dossier.source_file_id}>
            <td>
                <div className="file-info">
                    {dossier.nom_fichier?.toLowerCase().endsWith('.pdf') ? <FaFilePdf className="file-icon pdf"/> : <FaImage className="file-icon image"/>}
                    {/* On ajoute une classe pour mieux gérer les noms de fichiers longs */}
                    <div className="file-name-details"> 
                        <span>{dossier.nom_fichier}</span>
                    </div>
                </div>
            </td>
            <td className="text-secondary">{dossier.nom_ecole}</td>
            <td className="text-secondary">{dossier.annee_scolaire}</td>
            <td>
                <div className="progression-cell">
                    <span className={dossier.listes_a_verifier > 0 ? 'progress-incomplete' : 'progress-complete'}>
                        {`${dossier.total_listes - dossier.listes_a_verifier} / ${dossier.total_listes}`}
                    </span>
                    <span className="progress-label">listes validées</span>
                </div>
            </td>
            <td>
              <Link to={`/validate/${dossier.source_file_id}?fileQueue=${fileIdsForNavigation}`} className="action-button">
                Ouvrir
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DossierValidationTable;