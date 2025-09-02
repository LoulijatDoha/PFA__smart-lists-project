// src/services/listService.jsx

import apiClient from '../lib/apiClient';

// La fonction prend un objet de filtres et les transforme en paramètres d'URL
export const getAllLists = (filters) => {
  // Exemple d'URL finale: /listes?statut=A_VERIFIER&ecole=NomEcole
  return apiClient.get('/listes', { params: filters });
};

export const getListDetails = (listId) => apiClient.get(`/listes/${listId}`);

export const getDossiersAValider = (filters = {}) => {
  return apiClient.get('/listes/dossiers_a_valider', { params: filters });
};

// Pour la page de validation : récupère toutes les listes d'un fichier
export const getListsByFile = (sourceFileId) => {
  return apiClient.get(`/listes/by_file/${sourceFileId}`);
};

// --- NOUVELLE FONCTION AJOUTÉE ---
// Appelle la route dédiée à la mise à jour en cascade du niveau
export const updateListNiveau = (listId, newNiveauId) => {
  return apiClient.put(`/listes/${listId}/niveau`, { id_niveau: newNiveauId });
};