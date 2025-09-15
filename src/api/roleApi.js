import apiClient from './apiClient';

/**
 * Creates a new role. Requires 'admin' privilege.
 * @param {{short_name: string, long_name: string}} roleData - The data for the new role.
 */
export const createRole = (roleData) => {
    return apiClient.post('/roles/', roleData);
};

/**
 * Retrieves all role records. Requires 'admin' privilege.
 */
export const listRoles = () => {
    return apiClient.get('/roles/');
};

/**
 * Finds a role by its short or long name. Requires 'admin' privilege.
 * @param {{short_name?: string, long_name?: string}} params - The search parameters.
 */
export const findRole = (params) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/roles/find?${query}`);
};

/**
 * Retrieves a single role by its ID. Requires 'admin' privilege.
 * @param {string} roleId - The UUID of the role.
 */
export const getRoleById = (roleId) => {
    return apiClient.get(`/roles/${roleId}`);
};

/**
 * Updates an existing role. Requires 'admin' privilege.
 * @param {string} roleId - The UUID of the role to update.
 * @param {{short_name?: string, long_name?: string}} updateData - The fields to update.
 */
export const updateRole = (roleId, updateData) => {
    return apiClient.patch(`/roles/${roleId}`, updateData);
};

/**
 * Deletes a role. Requires 'admin' privilege.
 * @param {string} roleId - The UUID of the role to delete.
 */
export const deleteRole = (roleId) => {
    return apiClient.delete(`/roles/${roleId}`);
};

// Default export for convenience
const roleApi = {
    createRole,
    listRoles,
    findRole,
    getRoleById,
    updateRole,
    deleteRole,
};

export default roleApi;
