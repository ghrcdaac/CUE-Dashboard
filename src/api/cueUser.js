// src/api/cueUser.js
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl;


/**
 * @typedef {Object} Cueuser
 * @property {string} email - The user's email address.
 * @property {string} name - The user's name.
 * @property {string} cueusername - The user's CUE username.
 * @property {string} [edpub_id] - The user's EDPub ID (optional).
 * @property {string} [ngroup_id] - The ID of the associated Ngroup (optional).
 * @property {string} [provider_id] - The ID of the associated Provider (optional).
 * @property {string} [role_id] - The ID of the associated Role (optional).
 */

/**
 * Creates a new Cueuser.
 *
 * @param {Cueuser} cueuserData - The data for the new Cueuser.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<Cueuser>} The created Cueuser object.
 * @throws {Error} If the API request fails.
 */
async function createCueuser(cueuserData, accessToken) {
    const url = `${API_BASE_URL}/v1/cueuser/`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(cueuserData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create Cueuser.');
    }

    return response.json();
}

/**
 * Finds Cueusers based on search criteria.
 *
 * @param {Object} params - The search parameters.
 * @param {string} params.ngroup_id - (Required) The Ngroup ID.
 * @param {string} [params.email] - (Optional) The user's email.
 * @param {string} [params.cueusername] - (Optional) The user's CUE username.
 * @param {string} [params.name] - (Optional) The user's name.
 * @param {string} [params.edpub_id] - (Optional) The user's EDPub ID.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<Cueuser[]>} An array of matching Cueuser objects.
 * @throws {Error} If the API request fails.
 */
async function findCueusers(params, accessToken) {
    const url = new URL(`${API_BASE_URL}/v1/cueuser/find`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
         throw new Error(errorData.detail || 'Failed to find Cueusers.');
    }

    return response.json();
}

/**
 * Retrieves a Cueuser by their ID.
 *
 * @param {string} cueuserId - The ID of the Cueuser to retrieve.
 * @param {string} ngroupId - The Ngroup ID associated.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<Cueuser>} The Cueuser object.
 * @throws {Error} If the API request fails or the Cueuser is not found.
 */
async function getCueuserById(cueuserId, ngroupId, accessToken) {
    const url = `${API_BASE_URL}/v1/cueuser/${cueuserId}?ngroup_id=${ngroupId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get Cueuser by ID.');
    }

    return response.json();
}

/**
 * Updates an existing Cueuser.
 *
 * @param {string} cueuserId - The ID of the Cueuser to update.
 * @param {Partial<Cueuser>} updates - The fields to update.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<Cueuser>} The updated Cueuser object.
 * @throws {Error} If the API request fails.
 */
async function updateCueuser(cueuserId, updates, accessToken) {
    const url = `${API_BASE_URL}/v1/cueuser/${cueuserId}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update Cueuser.');
    }
    return response.json();
}

/**
 * Retrieves the role of a Cueuser.
 *
 * @param {string} cueuserId - The ID of the Cueuser.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<Object>} The role information.
 * @throws {Error} If the API request fails.
 */
async function getCueuserRole(cueuserId, accessToken) {
    const url = `${API_BASE_URL}/v1/cueuser/${cueuserId}/role`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get Cueuser role.');
    }
    return response.json();
}
/**
 * Deletes a Cueuser.
 *
 * @param {string} cueuserId - The ID of the Cueuser to delete.
 * @param {string} ngroupId - The Ngroup ID.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<void>}
 * @throws {Error} If the API request fails.
 */
async function deleteCueuser(cueuserId, ngroupId, accessToken) {
    const url = `${API_BASE_URL}/v1/cueuser/${cueuserId}?ngroup_id=${ngroupId}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete Cueuser.');
    }
    return; // No content on successful DELETE.

}

/**
 * Lists all Cueusers within a given Ngroup.
 *
 * @param {string} ngroupId - The ID of the Ngroup.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<Cueuser[]>} An array of Cueuser objects.
 * @throws {Error} If the API request fails.
 */
async function listCueusers(ngroupId, accessToken) {
    const url = `${API_BASE_URL}/v1/cueuser/?ngroup_id=${ngroupId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list Cueusers.');
    }

    return response.json();
}
/**
 * Retrieves a Cueuser by their username.
 *
 * @param {string} username - The username of the Cueuser to retrieve.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<Cueuser>} The Cueuser object.
 * @throws {Error} If the API request fails or the Cueuser is not found.
 */
async function getCueuserByUsername(username, accessToken) {
    const url = `${API_BASE_URL}/v1/cueuser/by_username/${username}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get Cueuser by username.');
    }
    return response.json();
}


export {
    createCueuser,
    findCueusers,
    getCueuserById,
    updateCueuser,
    getCueuserRole,
    deleteCueuser,
    listCueusers,
    getCueuserByUsername
};