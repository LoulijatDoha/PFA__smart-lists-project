// src/services/statisticsService.jsx
import apiClient from '../lib/apiClient';

/**
 * Récupère un résumé complet des statistiques de l'application.
 * @returns {Promise}
 */
export const getStatisticsSummary = () => {
  return apiClient.get('/statistics/summary');
};