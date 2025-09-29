// src/api/fileApi.js

import apiClient from './apiClient';

/**
 * Helper to build a query string from a filters object.
 * @param {object} params - The object of query parameters.
 * @returns {string} A URL query string.
 */
function buildQueryString(params) {
    const queryParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value != null && value !== '') {
                queryParams.append(key, value);
            }
        });
    }
    return queryParams.toString();
}

/**
 * Lists files for the active ngroup with pagination and optional filters.
 * This single function replaces V1's listFilesForNgroup and listFilesByStatus.
 * @param {object} params - { page, pageSize, status }
 */
export const listFiles = (params) => {
    const queryString = buildQueryString(params);
    return apiClient.get(`/files/?${queryString}`);
};

/**
 * Finds file records by exact name match within the active ngroup.
 * @param {string} name - The exact file name to search for.
 */
export const findFilesByName = (name) => {
    return apiClient.get(`/files/find?name=${encodeURIComponent(name)}`);
};

/**
 * Retrieves the full, detailed record for a single file (metadata + status).
 * @param {string} fileId - The UUID of the file.
 */
export const getFileById = (fileId) => {
    return apiClient.get(`/files/${fileId}`);
};

/**
 * Deletes a file and its associated records.
 * @param {string} fileId - The UUID of the file to delete.
 */
export const deleteFile = (fileId) => {
    return apiClient.delete(`/files/${fileId}`);
};