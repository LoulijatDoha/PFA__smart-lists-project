// src/services/profileService.jsx
import apiClient from '../lib/apiClient';

/**
 * Permet à l'utilisateur actuellement connecté de changer son propre mot de passe.
 * @param {string} password Le nouveau mot de passe.
 */
export const changeMyPassword = (password) => {
  return apiClient.post('/profile/change-password', { password });
};