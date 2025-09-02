import apiClient from '../lib/apiClient';
export const getLocation = (entityType, entityId) => 
    apiClient.get(`/locations/${entityType}/${entityId}`);