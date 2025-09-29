// src/api/egressAPI.js

import apiClient from './apiClient';

/**
 * Retrieves all egress records for the user's currently active ngroup.
 * The backend filters based on the X-Active-Ngroup-Id header sent by the apiClient.
 */
export const listEgresses = () => {
    return apiClient.get('/egress/');
};

/**
 * Retrieves a single egress target by its ID.
 * @param {string} egressId - The UUID of the egress target.
 */
export const getEgressById = (egressId) => {
    return apiClient.get(`/egress/${egressId}`);
};

/**
 * Creates a new egress target.
 * The backend associates it with the active ngroup from the request header.
 * @param {object} egressData - { type, path, config }
 */
export const createEgress = (egressData) => {
    return apiClient.post('/egress/', egressData);
};

/**
 * Updates an existing egress target.
 * @param {string} egressId - The UUID of the egress target to update.
 * @param {object} updateData - The fields to update.
 */
export const updateEgress = (egressId, updateData) => {
    return apiClient.patch(`/egress/${egressId}`, updateData);
};

/**
 * Deletes an egress target.
 * @param {string} egressId - The UUID of the egress target to delete.
 */
export const deleteEgress = (egressId) => {
    return apiClient.delete(`/egress/${egressId}`);
};