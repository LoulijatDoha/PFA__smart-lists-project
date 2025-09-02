// src/features/validation/components/ReferentielSearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { searchReferentiel } from '../../../services/referentielService';

const ReferentielSearchBar = ({ onArticleSelect, initialSearchTerm, isDisabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
    if (initialSearchTerm) handleSearch(initialSearchTerm);
    else setResults([]);
  }, [initialSearchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    clearTimeout(searchTimeout.current);
    if (term.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await searchReferentiel(term);
        setResults(response.data);
      } catch (error) {
        console.error("Erreur de recherche", error);
      } finally {
        setLoading(false);
      }
    }, 500); // Délai de 500ms pour ne pas surcharger l'API
  };
  
  const handleSelect = (article) => {
    setSearchTerm(article.designation);
    setResults([]);
    onArticleSelect(article);
  };

  return (
    <div className="search-bar-container">
      <input
        type="text"
        placeholder={isDisabled ? "Sélectionnez un manuel pour chercher..." : "Rechercher..."}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        disabled={isDisabled}
      />
      { (loading || results.length > 0) && (
        <ul className="search-results-list">
          {loading ? <li>Chargement...</li> : 
            results.map(article => (
              <li key={article.id_article} onMouseDown={() => handleSelect(article)}>
                <strong>{article.reference}</strong> - {article.designation}
              </li>
            ))
          }
        </ul>
      )}
    </div>
  );
};
export default ReferentielSearchBar;