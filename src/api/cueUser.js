import apiClient from './apiClient';

// Note: All functions use the apiClient, which handles auth automatically.
// Endpoint paths are relative to the /v2 base URL in the config.

/**
 * Lists all Cueusers for the currently active ngroup.
 * The backend filters users based on the X-Active-Ngroup-Id header.
 */
export const listCueusers = () => {
    return apiClient.get('/cueusers/');
};

/**
 * Returns the complete profile for the currently authenticated user.
 */
export const getMyProfile = () => {
    return apiClient.get('/cueusers/me');
};

/**
 * Creates a new user. Requires 'create_user' privilege.
 * @param {object} cueuserData - The data for the new user.
 */
export const createCueuser = (cueuserData) => {
    return apiClient.post('/cueusers/', cueuserData);
};

/**
 * Finds users based on various criteria.
 * @param {object} params - The search parameters (email, cueusername, name, edpub_id).
 */
export const findUsers = (params) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/cueusers/find?${query}`);
};

/**
 * Lists all users assigned to a specific role. Requires 'admin' privilege.
 * @param {string} roleId - The UUID of the role.
 */
export const getUsersByRole = (roleId) => {
    return apiClient.get(`/cueusers/by_role/${roleId}`);
};

/**
 * Retrieves a specific user's profile by their ID.
 * @param {string} userId - The UUID of the user.
 */
export const getCueuserById = (userId) => {
    return apiClient.get(`/cueusers/${userId}`);
};

/**
 * Retrieves a specific user's profile by their username.
 * @param {string} username - The CUE username.
 */
export const getCueuserByUsername = (username) => {
    return apiClient.get(`/cueusers/by_username/${username}`);
};

/**
 * Updates a user's core information. Requires 'admin' privilege.
 * @param {string} userId - The UUID of the user to update.
 * @param {object} updates - The fields to update (name, email, edpub_id).
 */
export const updateCueuser = (userId, updates) => {
    return apiClient.patch(`/cueusers/${userId}`, updates);
};

/**
 * Deletes a user from Keycloak and the local database. Requires 'admin' privilege.
 * @param {string} userId - The UUID of the user to delete.
 */
export const deleteCueuser = (userId) => {
    return apiClient.delete(`/cueusers/${userId}`);
};

/**
 * Assigns a new role to a user. Requires 'user:assign_role' privilege.
 * @param {string} userId - The UUID of the user to update.
 * @param {string} roleId - The UUID of the role to assign.
 */
export const assignUserRole = (userId, roleId) => {
  return apiClient.patch(`/cueusers/${userId}/role`, { role_id: roleId });
};
