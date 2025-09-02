// src/services/dashboardService.jsx
import apiClient from '../lib/apiClient'; // <-- CETTE LIGNE EST CRUCIALE

export const getDashboardStats = () => {
  return apiClient.get('/dashboard/stats');
};