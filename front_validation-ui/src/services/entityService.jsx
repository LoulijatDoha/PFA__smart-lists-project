// src/services/entityService.jsx
import apiClient from '../lib/apiClient';

/**
 * Met à jour le statut d'une entité à 'VALIDÉ'.
 * @param {string} entityType - Le nom de la table (ex: 'ecoles', 'manuels').
 * @param {number} entityId - L'ID de l'entité à valider.
 * @returns {Promise}
 */
export const validateEntity = (entityType, entityId) => {
  if (!entityType || !entityId) {
    return Promise.reject(new Error("Le type et l'ID de l'entité sont requis pour la validation."));
  }
  return apiClient.post(`/entities/${entityType}/${entityId}/validate`);
};

/**
 * Met à jour un ou plusieurs champs d'une entité.
 * @param {string} entityType - Le nom de la table (ex: 'ecoles', 'manuels').
 * @param {number} entityId - L'ID de l'entité à mettre à jour.
 * @param {object} dataToUpdate - Un objet avec les champs à modifier (ex: { titre: 'Nouveau Titre' }).
 * @returns {Promise}
 */
export const updateEntity = (entityType, entityId, dataToUpdate) => {
  if (!entityType || !entityId || !dataToUpdate) {
    return Promise.reject(new Error("Le type, l'ID et les données de l'entité sont requis pour la mise à jour."));
  }
  return apiClient.put(`/entities/${entityType}/${entityId}`, dataToUpdate);
};

export const getAnneeOptions = () => apiClient.get('/entities/annees_scolaires');
export const getNiveauOptions = () => apiClient.get('/entities/niveaux');


export const deleteEntity = (entityType, entityId) => {
  if (!entityType || !entityId) {
    return Promise.reject(new Error("Le type et l'ID de l'entité sont requis pour la suppression."));
  }
  return apiClient.delete(`/entities/${entityType}/${entityId}`);
};

// Fonction spécifique pour la suppression des manuels avec confirmation
export const deleteManuel = async (manuelId) => {
  try {
    const response = await deleteEntity('manuels', manuelId);
    return response;
  } catch (error) {
    // Gestion des erreurs spécifiques aux manuels
    if (error.response && error.response.status === 409) {
      throw new Error("Ce manuel ne peut pas être supprimé car il est utilisé dans des listes scolaires.");
    }
    throw error;
  }
};