// src/features/dashboard/components/StatCards.jsx
import React from 'react';
import { useAuth } from '../../../context/AuthContext';

const StatCards = ({ stats, loading, onCardClick }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (loading || !stats) {
    return (
      <div className="stat-cards-container">
        {[...Array(4)].map((_, i) => <div key={i} className="card loading-skeleton" />)}
      </div>
    );
  }

  return (
    <div className="stat-cards-container">
      <div className="card" onClick={() => onCardClick('')}>
        <h3>{stats.total_dossiers || 0}</h3>
        <p>Fichiers Extraits au total</p>
      </div>
      
      <div className="card a-verifier" onClick={() => onCardClick('A_VERIFIER')}>
        <h3>{stats.dossiers_a_verifier || 0}</h3>
        <p>Fichiers à Vérifier</p>
      </div>
      
      <div className="card valide" onClick={() => onCardClick('VALIDE')}>
        <h3>{stats.dossiers_valides || 0}</h3>
        <p>Fichiers Validés</p>
      </div>
      
      {isAdmin && (
        <div className="card erreur" onClick={() => onCardClick('erreurs')}>
          <h3>{stats.fichiers_en_erreur || 0}</h3>
          <p>Fichiers en Erreur Système</p>
        </div>
      )}
    </div>
  );
};

export default StatCards;
