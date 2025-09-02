// src/services/authService.js
import apiClient from '../lib/apiClient';

export const login = (username, password) => apiClient.post('/login', { username, password });
export const logout = () => apiClient.post('/logout');
export const getStatus = () => apiClient.get('/status');