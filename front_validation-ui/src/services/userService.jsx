// src/services/userService.jsx
import apiClient from '../lib/apiClient'; // Assurez-vous que ce chemin est correct

export const getAllUsers = () => {
  return apiClient.get('/users');
};

export const createUser = (userData) => {
  // userData = { username, password, role }
  return apiClient.post('/users', userData);
};

export const updateUser = (userId, userData) => {
  // userData = { username?, role?, is_active?, password? }
  return apiClient.put(`/users/${userId}`, userData);
};

export const deactivateUser = (userId) => {
  return apiClient.delete(`/users/${userId}`);
};