// src/api/collectionApi.js

import apiClient from './apiClient';
import { config } from '../config'; // Needed for legacy functions

// ==============================================================================
// === V2 API Functions =========================================================
// ==============================================================================

/**
 * Retrieves all collections for the user's currently active ngroup.
 */
export const listCollections = () => {
    return apiClient.get('/collections/');
};

/**
 * Creates a new collection. The backend associates it with the active ngroup.
 * @param {object} collectionData - { short_name, provider_id, active, egress_id }
 */
export const createCollection = (collectionData) => {
    return apiClient.post('/collections/', collectionData);
};

/**
 * Updates an existing collection.
 * @param {string} collectionId - The UUID of the collection to update.
 * @param {object} updateData - The fields to update.
 */
export const updateCollection = (collectionId, updateData) => {
    return apiClient.patch(`/collections/${collectionId}`, updateData);
};

/**
 * Deletes a collection.
 * @param {string} collectionId - The UUID of the collection to delete.
 */
export const deleteCollection = (collectionId) => {
    return apiClient.delete(`/collections/${collectionId}`);
};

/**
 * Activates a collection using the V2 update endpoint.
 * @param {string} collectionId - The UUID of the collection to activate.
 */
export const activateCollection = (collectionId) => {
    return updateCollection(collectionId, { active: true });
};

/**
 * Deactivates a collection using the V2 update endpoint.
 * @param {string} collectionId - The UUID of the collection to deactivate.
 */
export const deactivateCollection = (collectionId) => {
    return updateCollection(collectionId, { active: false });
};


// ==============================================================================
// === Legacy V1 Functions (for compatibility with other components) ============
// ==============================================================================

const API_BASE_URL = config.apiBaseUrl;

function buildQueryString(params) {
    const queryParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value != null) { 
                queryParams.append(key, value);
            }
        });
    }
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
}

/**
 * @deprecated This function uses a V1 endpoint.
 */
export async function listCollectionsWithPagination(params, accessToken) {
    const queryString = buildQueryString(params)
    const url = `${API_BASE_URL}/collection${queryString}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to list collections with pagination');
    return response.json();
}

/**
 * @deprecated This function uses a V1 endpoint.
 */
export async function listFilesForCollection(collectionId, ngroupId, page, pageSize, accessToken) {
    const url = `${API_BASE_URL}/collection/${collectionId}/files?ngroup_id=${ngroupId}&page=${page}&page_size=${pageSize}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to list files for collection');
    return response.json();
}

/**
 * @deprecated This function uses a V1 endpoint.
 */
export async function collectionFilesCount(params, accessToken) {
    const queryString = buildQueryString(params)
    const url = `${API_BASE_URL}/collection/files/overview${queryString}`
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to fetch collection files count');
    return response.json();
}