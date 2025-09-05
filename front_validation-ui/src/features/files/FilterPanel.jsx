// src/features/files/FilterPanel.jsx
import React, { useState, useEffect } from 'react'; 
import { getAnneeOptions, getNiveauOptions } from '../../services/entityService';

// On reçoit 'onFilterChange' au lieu de 'setFilters'
const FilterPanel = ({ filters, onFilterChange }) => {
  const [anneeOptions, setAnneeOptions] = useState([]);
  const [niveauOptions, setNiveauOptions] = useState([]);

  useEffect(() => {
    getAnneeOptions().then(res => setAnneeOptions(res.data));
    getNiveauOptions().then(res => setNiveauOptions(res.data));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // On met à jour un objet temporaire et on appelle la fonction du parent
    const newFilters = {
      ...filters,
      [name]: value,
    };
    onFilterChange(newFilters);
  };

  return (
    <div className="filter-panel">
      <div className="filter-group">
        <label>Statut</label>
        <select name="statut" value={filters.statut} onChange={handleInputChange}>
          <option value="">Tous les Statuts</option>
          <option value="A_VERIFIER">À Vérifier</option>
          <option value="VALIDE">Validé</option>
        </select>
      </div>
      <div className="filter-group">
        <label>École</label>
        <input type="text" name="ecole" placeholder="Rechercher par nom..." value={filters.ecole} onChange={handleInputChange} />
      </div>
      <div className="filter-group">
        <label>Année Scolaire</label>
        <select name="annee" value={filters.annee} onChange={handleInputChange}>
          <option value="">Toutes</option>
          {anneeOptions.map(option => <option key={option.annee_scolaire} value={option.annee_scolaire}>{option.annee_scolaire}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Niveau</label>
        <select name="niveau" value={filters.niveau} onChange={handleInputChange}>
          <option value="">Tous</option>
          {niveauOptions.map(option => <option key={option.nom_niveau} value={option.nom_niveau}>{option.nom_niveau}</option>)}
        </select>
      </div>
    </div>
  );
};

export default FilterPanel;