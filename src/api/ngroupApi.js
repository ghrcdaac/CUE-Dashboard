import apiClient from './apiClient';

/**
 * A public endpoint to retrieve a simplified list of ngroups
 * for the user application form dropdown.
 */
export const getNgroupsForApplication = () => {
    return apiClient.get('/ngroups/for-application-form');
};

/**
 * Retrieves a list of all ngroups. Requires authentication.
 */
export const listNgroups = () => {
    return apiClient.get('/ngroups/');
};

/**
 * Retrieves a single ngroup by its ID. Requires authentication.
 * @param {string} ngroupId - The UUID of the ngroup.
 */
export const getNgroupById = (ngroupId) => {
    return apiClient.get(`/ngroups/${ngroupId}`);
};

/**
 * Creates a new ngroup. Requires admin privileges.
 * @param {{short_name: string, long_name: string}} groupData - The data for the new group.
 */
export const createNgroup = (groupData) => {
    return apiClient.post('/ngroups/', groupData);
};

/**
 * Updates an existing ngroup. Requires admin privileges.
 * @param {string} ngroupId - The UUID of the ngroup to update.
 * @param {{short_name?: string, long_name?: string}} updateData - The fields to update.
 */
export const updateNgroup = (ngroupId, updateData) => {
    return apiClient.patch(`/ngroups/${ngroupId}`, updateData);
};

/**
 * Deletes an ngroup. Requires admin privileges.
 * @param {string} ngroupId - The UUID of the ngroup to delete.
 */
export const deleteNgroup = (ngroupId) => {
    return apiClient.delete(`/ngroups/${ngroupId}`);
};
