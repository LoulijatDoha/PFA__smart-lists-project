// src/services/niveauService.jsx
import apiClient from '../lib/apiClient';
export const getAllNiveaux = () => apiClient.get('/niveaux');