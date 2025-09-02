// src/features/dashboard/components/DossierValidationTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const DossierValidationTable = ({ dossiers, loading }) => {
  if (loading) return <p>Chargement des fichiers...</p>;
  if (!dossiers || dossiers.length === 0) return <p>Aucun fichier ne correspond à vos critères.</p>;

  return (
    <table className="lists-table">
      <thead>
        <tr>
          {/* On renomme "Dossier" en "Fichier" */}
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
            <td>{dossier.nom_fichier}</td>
            <td>{dossier.nom_ecole}</td>
            <td>{dossier.annee_scolaire}</td>
            <td>{`${dossier.total_listes - dossier.listes_a_verifier} / ${dossier.total_listes} listes validées`}</td>
            <td>
              <Link to={`/validate/${dossier.source_file_id}`} className="action-button">
                Ouvrir le Fichier
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
export default DossierValidationTable;