// src/features/dashboard/components/StatCards.jsx
import React from 'react';

const StatCards = ({ stats, loading }) => {
  if (loading || !stats) {
    return [...Array(5)].map((_, i) => <div key={i} className="card loading-skeleton" />);
  }

  return (
    <>
      <div className="card total">
        <h3>{stats.total_dossiers || 0}</h3>
        <p>Fichiers Extraits</p>
      </div>
      
      <div className="card a-verifier">
        <h3>{stats.dossiers_a_verifier || 0}</h3>
        <p>Fichiers à Vérifier</p>
      </div>
      
      <div className="card valide">
        <h3>{stats.dossiers_valides || 0}</h3>
        <p>Fichiers Validés</p>
      </div>
      
      <div className="card a-verifier">
        <h3>{stats.manuels_a_verifier || 0}</h3>
        <p>Manuels à Vérifier</p>
      </div>

      <div className="card erreur">
        <h3>{stats.fichiers_en_erreur || 0}</h3>
        <p>Erreurs Système</p>
      </div>
    </>
  );
};

export default StatCards;