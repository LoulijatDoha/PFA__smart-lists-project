// src/services/listService.jsx

import apiClient from '../lib/apiClient';

/**
 * @deprecated Cette fonction est probablement superflue si getDossiersAValider fait tout le travail.
 */
export const getAllLists = (filters) => {
  return apiClient.get('/listes', { params: filters });
};

/**
 * @deprecated Cette fonction n'est probablement plus utilisée par la page de validation.
 */
export const getListDetails = (listId) => {
  return apiClient.get(`/listes/${listId}`);
};

/**
 * Récupère les dossiers à valider de manière paginée et filtrée.
 * @param {object} filters - Un objet contenant les filtres (statut, ecole, etc.).
 * @param {number} page - Le numéro de la page à récupérer.
 * @param {number} limit - Le nombre d'éléments par page.
 * @returns {Promise}
 */
export const getDossiersAValider = (filters = {}, page = 1, limit = 10) => {
  // On combine les filtres et les paramètres de pagination dans un seul objet
  const params = {
    ...filters,
    page,
    limit
  };
  // Axios se chargera de transformer cet objet en paramètres d'URL
  // ex: /listes/dossiers_a_valider?statut=A_VERIFIER&page=1&limit=10
  return apiClient.get('/listes/dossiers_a_valider', { params });
};

/**
 * Pour la page de validation : récupère toutes les listes et les métadonnées d'un fichier source.
 * @param {string} sourceFileId - L'ID du fichier source.
 * @returns {Promise}
 */
export const getListsByFile = (sourceFileId) => {
  return apiClient.get(`/listes/by_file/${sourceFileId}`);
};

/**
 * Appelle la route dédiée à la mise à jour en cascade du niveau d'une liste et de ses manuels.
 * @param {number} listId - L'ID de la liste à mettre à jour.
 * @param {number} newNiveauId - Le nouvel ID du niveau.
 * @returns {Promise}
 */
export const updateListNiveau = (listId, newNiveauId) => {
  return apiClient.put(`/listes/${listId}/niveau`, { id_niveau: newNiveauId });
};


/**
 * Récupère la liste complète des ID de dossiers filtrés pour la navigation.
 * @param {object} filters - Un objet contenant les filtres (statut, ecole, etc.).
 * @returns {Promise<string[]>} - Une promesse qui résout avec un tableau d'IDs.
 */
export const getDossierIds = (filters = {}) => {
  return apiClient.get('/listes/dossiers/ids', { params: filters });
};


