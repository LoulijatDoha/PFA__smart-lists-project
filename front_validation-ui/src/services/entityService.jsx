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