// src/services/userService.jsx
import apiClient from '../lib/apiClient';

// La fonction accepte maintenant les paramètres de pagination
export const getAllUsers = (page = 1, limit = 10) => {
  return apiClient.get('/users', {
    params: { page, limit } // Axios va transformer cela en /users?page=1&limit=10
  });
};
export const createUser = (userData) => {
  return apiClient.post('/users', userData);
};

export const updateUser = (userId, userData) => {
  return apiClient.put(`/users/${userId}`, userData);
};

export const deactivateUser = (userId) => {
  return apiClient.delete(`/users/${userId}`);
};

// La fonction pour l'admin pour forcer la réinitialisation
export const resetPassword = (userId, newPassword) => {
  return apiClient.post(`/users/${userId}/reset-password`, { password: newPassword });
};


export const bulkDeactivateUsers = (userIds) => {
  return apiClient.post('/users/bulk-action', { action: 'deactivate', ids: userIds });
};

export const bulkResetPassword = (userIds, newPassword) => {
  return apiClient.post('/users/bulk-action', { action: 'reset-password', ids: userIds, password: newPassword });
};