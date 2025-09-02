// src/services/referentielService.jsx

import apiClient from '../lib/apiClient'; // Assurez-vous que le chemin vers votre apiClient est correct

/**
 * Recherche des articles dans le référentiel en fonction d'un terme de recherche.
 * @param {string} searchTerm - Le terme à rechercher (titre, référence, code-barres).
 * @returns {Promise} - Une promesse qui résout avec la liste des articles trouvés.
 */
export const searchReferentiel = (searchTerm) => {
  if (!searchTerm || searchTerm.length < 3) {
    // On ne lance pas de recherche si le terme est trop court pour éviter de surcharger le backend
    return Promise.resolve({ data: [] });
  }

  // Fait un appel GET à /api/v1/referentiel/search?q=...
  return apiClient.get('/referentiel/search', {
    params: {
      q: searchTerm
    }
  });
};