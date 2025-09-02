// src/features/dashboard/components/ListsTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ListsTable = ({ lists, loading }) => {
  if (loading) return <p>Chargement des listes...</p>;
  if (!lists || lists.length === 0) return <p>Aucune liste ne correspond à vos critères.</p>;

  return (
    <table className="lists-table">
      <thead>
        <tr>
          <th>École</th>
          <th>Niveau</th>
          <th>Année</th>
          <th>Fichier Source</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {lists.map((list) => (
          <tr key={list.id_liste}>
            <td>{list.nom_ecole}</td>
            <td>{list.nom_niveau}</td>
            <td>{list.annee_scolaire}</td>
            <td>{list.nom_fichier}</td>
            <td>
              <span className={`status-badge status-${list.statut}`}>
                {list.statut.replace('_', ' ')}
              </span>
            </td>
            <td>
              {/* Le lien pointe vers /validate/ID_DE_LA_LISTE */}
              <Link to={`/validate/${list.id_liste}`} className="action-button">
                Valider
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ListsTable;