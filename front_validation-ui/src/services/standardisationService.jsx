// src/services/standardisationService.jsx
import apiClient from '../lib/apiClient';

/**
 * Récupère les entrées paginées pour un type de standardisation.
 * @param {('std-ecoles'|'std-niveaux')} stdType Le type de table.
 * @param {number} page Le numéro de la page à récupérer.
 * @param {number} limit Le nombre d'éléments par page.
 */
export const getStandardisationEntries = (stdType, page = 1, limit = 10) => {
  return apiClient.get(`/standardisation/${stdType}`, {
    params: { page, limit }
  });
};

/**
 * Crée une nouvelle règle de standardisation.
 * @param {('std-ecoles'|'std-niveaux')} stdType Le type de table.
 * @param {object} entryData Les données de la nouvelle règle.
 */
export const createStandardisationEntry = (stdType, entryData) => {
  return apiClient.post(`/standardisation/${stdType}`, entryData);
};

/**
 * Met à jour une règle de standardisation.
 * @param {('std-ecoles'|'std-niveaux')} stdType Le type de table.
 * @param {number} entryId L'ID de la règle à modifier.
 * @param {object} dataToUpdate Les données à mettre à jour.
 */
export const updateStandardisationEntry = (stdType, entryId, dataToUpdate) => {
  return apiClient.put(`/standardisation/${stdType}/${entryId}`, dataToUpdate);
};

/**
 * Supprime une règle de standardisation.
 * @param {('std-ecoles'|'std-niveaux')} stdType Le type de table.
 * @param {number} entryId L'ID de la règle à supprimer.
 */
export const deleteStandardisationEntry = (stdType, entryId) => {
  return apiClient.delete(`/standardisation/${stdType}/${entryId}`);
};