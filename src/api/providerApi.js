import apiClient from './apiClient';

/**
 * A public endpoint to retrieve a simplified list of providers for a given ngroup.
 * Used to populate the dropdown in the user application form.
 * @param {string} ngroupId - The UUID of the ngroup to filter providers by.
 */
export const getProvidersForApplication = (ngroupId) => {
    return apiClient.get(`/providers/for-application-form?ngroup_id=${ngroupId}`);
};

/**
 * Retrieves all provider records for a specific ngroup. Requires 'view_provider' privilege.
 * @param {string} ngroupId - The UUID of the ngroup to filter providers by.
 */
export const listProviders = (ngroupId) => {
    return apiClient.get(`/providers/?ngroup_id=${ngroupId}`);
};

/**
 * Retrieves a single provider by its ID. Requires 'view_provider' privilege.
 * @param {string} providerId - The UUID of the provider.
 */
export const getProviderById = (providerId) => {
    return apiClient.get(`/providers/${providerId}`);
};

/**
 * Creates a new provider. Requires 'create_provider' privilege.
 * @param {{short_name: string, long_name: string, can_upload: boolean, ngroup_id: string, point_of_contact: string}} providerData - The data for the new provider.
 */
export const createProvider = (providerData) => {
    return apiClient.post('/providers/', providerData);
};

/**
 * Updates an existing provider. Requires 'manage_provider' privilege.
 * @param {string} providerId - The UUID of the provider to update.
 * @param {{short_name?: string, long_name?: string, can_upload?: boolean, point_of_contact?: string}} updateData - The fields to update.
 */
export const updateProvider = (providerId, updateData) => {
    return apiClient.patch(`/providers/${providerId}`, updateData);
};

/**
 * Deletes a provider. Requires 'admin' privilege.
 * @param {string} providerId - The UUID of the provider to delete.
 */
export const deleteProvider = (providerId) => {
    return apiClient.delete(`/providers/${providerId}`);
};

// --- ADDED ALIAS FOR BACKWARDS COMPATIBILITY ---
/**
 * Alias for getProviderById to fix import errors in other pages.
 * @deprecated Use getProviderById instead.
 */
export const fetchProviderById = getProviderById;
