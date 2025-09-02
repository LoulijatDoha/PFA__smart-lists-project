import apiClient from '../lib/apiClient';

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file); // La clé 'file' doit correspondre à ce que Flask attend

  return apiClient.post('/drive/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Important pour l'upload de fichiers
    },
  });
};

export const reprocessFile = (fileId) => {
  // Cette route doit correspondre à votre backend Flask
  return apiClient.post(`/processing/${fileId}/reprocess`); 
};