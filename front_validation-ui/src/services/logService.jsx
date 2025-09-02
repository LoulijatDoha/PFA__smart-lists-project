// src/services/logService.js
import apiClient from '../lib/apiClient';

export const getLogs = (filters) => {
  return apiClient.get('/logs', { params: filters });
};

export const reprocessFile = (fileId) => {
  // On suppose que vous avez une route pour ça, sinon il faut la créer
  return apiClient.post(`/processing/${fileId}/reprocess`);
};