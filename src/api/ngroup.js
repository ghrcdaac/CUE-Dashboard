// src/api/ngroup.js
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl;

/**
 * Fetches an ngroup by its ID.
 * @param {string} ngroupId - The ID of the ngroup.
 * @returns {Promise<Object>} The ngroup object.
 * @throws {Error} If the request fails or the ngroup is not found.
 */
export async function getNgroupById(ngroupId) {
    const response = await fetch(`${API_BASE_URL}/v1/ngroup/${ngroupId}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Ngroup not found: ${ngroupId}`);
        }
        throw new Error(`Failed to fetch ngroup: ${response.statusText}`);
    }
    return await response.json();
}

/**
 * Fetches all ngroups.
 * @returns {Promise<Array>} An array of ngroup objects.
 * @throws {Error} If the request fails.
 */
export async function fetchNgroups() {
    const response = await fetch(`${API_BASE_URL}/v1/ngroup/`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ngroups: ${response.statusText}`);
    }
    return await response.json();
}