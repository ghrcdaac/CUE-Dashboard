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
 * - key_type: 'personal' | 'managed_user' | 'proxy'
 * - expires_in_days?: number
 * - expires_at?: string (ISO 8601 format)
 * - target_user_id?: string (Required for 'managed_user')
 * - proxy_user_name?: string (Required for 'proxy')
 * - ngroup_id?: string (Required for 'managed_user' and 'proxy')
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
 * Revokes an API key (soft delete).
 * This marks the key as revoked in the database for audit purposes but
 * prevents it from being used or shown to regular users.
 * @param {string} keyId - The UUID of the key to revoke.
 */
export const revokeApiKey = (keyId) => {
  return apiClient.delete(`/api-keys/${keyId}`);
};

