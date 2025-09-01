// src/api/apiKeys.js

import apiClient from './apiClient';

/**
 * Lists all API keys visible to the current user.
 * The backend filters keys based on the user's role and active ngroup.
 */
export const getApiKeys = () => {
  return apiClient.get('/api-keys/');
};

/**
 * Creates a new API key.
 * @param {object} keyData - The data for the new key.
 * - name: string
 * - expires_in_days?: number
 * - expires_at?: string (ISO 8601 format)
 * - user_id?: string (for creating on behalf of another user)
 * - proxy_user_name?: string (for creating a proxy key)
 * - scopes: string[]
 */
export const createApiKey = (keyData) => {
  return apiClient.post('/api-keys/', keyData);
};

/**
 * Updates an existing API key. Currently used for suspending/reactivating.
 * @param {string} keyId - The UUID of the key to update.
 * @param {object} updateData - The fields to update (e.g., { is_active: boolean }).
 */
export const updateApiKey = (keyId, updateData) => {
  return apiClient.patch(`/api-keys/${keyId}`, updateData);
};

/**
 * Permanently revokes (deletes) an API key.
 * @param {string} keyId - The UUID of the key to revoke.
 */
export const deleteApiKey = (keyId) => {
  return apiClient.delete(`/api-keys/${keyId}`);
};