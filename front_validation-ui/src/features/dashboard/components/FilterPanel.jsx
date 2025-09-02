// src/features/dashboard/components/FilterPanel.jsx
import React, { useState, useEffect } from 'react'; 
import { getAnneeOptions, getNiveauOptions } from '../../../services/entityService';
const FilterPanel = ({ filters, setFilters }) => {
  // États pour stocker les options des menus déroulants
  const [anneeOptions, setAnneeOptions] = useState([]);
  const [niveauOptions, setNiveauOptions] = useState([]);

  // Charger les options une seule fois au montage du composant
  useEffect(() => {
    getAnneeOptions().then(res => setAnneeOptions(res.data));
    getNiveauOptions().then(res => setNiveauOptions(res.data));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  


  return (
    <div className="filter-panel">
      {/* On a retiré le <select> pour le statut */}
      <div className="filter-group">
        <label htmlFor="statut-filter">Statut</label>
        <select id="statut-filter" name="statut" value={filters.statut} onChange={handleInputChange}>
          <option value="">Tous les Statuts</option>
          <option value="A_VERIFIER">À Vérifier</option>
          <option value="VALIDE">Validé</option>
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="ecole-filter">École</label>
        <input id="ecole-filter" type="text" name="ecole"
          placeholder="Rechercher par nom d'école..."
          value={filters.ecole} onChange={handleInputChange} />
      </div>
     
      <div className="filter-group">
        <label htmlFor="annee-filter">Année Scolaire</label>
        <select id="annee-filter" name="annee" value={filters.annee} onChange={handleInputChange}>
          <option value="">Toutes</option>
          {anneeOptions.map(option => (
            <option key={option.annee_scolaire} value={option.annee_scolaire}>
              {option.annee_scolaire}
            </option>
          ))}
        </select>
      </div>

      {/* --- MENU DÉROULANT DYNAMIQUE POUR LE NIVEAU --- */}
      <div className="filter-group">
        <label htmlFor="niveau-filter">Niveau</label>
        <select id="niveau-filter" name="niveau" value={filters.niveau} onChange={handleInputChange}>
          <option value="">Tous</option>
          {niveauOptions.map(option => (
            <option key={option.nom_niveau} value={option.nom_niveau}>
              {option.nom_niveau}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
export default FilterPanel;