// src/services/driveService.jsx
import apiClient from '../lib/apiClient';

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/drive/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadFileAsBlob = async (fileId) => {
  const response = await apiClient.get(`/drive/files/download/${fileId}`, {
    responseType: 'blob',
  });
  return response.data; // On retourne le blob directement
};