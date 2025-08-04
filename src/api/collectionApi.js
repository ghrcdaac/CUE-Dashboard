// src/api/collectionApi.js

import { config } from '../config';
// import {handleResponse, buildQueryString} from './helper';

const API_BASE_URL = config.apiBaseUrl; // Use apiBaseUrl from config

/**
 * Creates a new collection.
 *
 * @param {object} collectionData - The data for the new collection.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<object>} The newly created collection.
 * @throws {Error} If the request fails.
 */
export async function createCollection(collectionData, accessToken) {
    const url = `${API_BASE_URL}/v1/collection`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create collection');
    }

    return response.json();
}

/**
 * Gets a collection by ID.
 *
 * @param {string} collectionId - The ID of the collection.
 * @param {string} ngroupId - The nGroup ID.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<object>} The collection data.
 * @throws {Error} If the request fails.
 */
export async function getCollection(collectionId, ngroupId, accessToken) {
    const url = `${API_BASE_URL}/v1/collection/${collectionId}?ngroup_id=${ngroupId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get collection');
    }

    return response.json();
}

/**
 * Lists all collections for a given nGroup.
 *
 * @param {string} ngroupId - The nGroup ID.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<object[]>} An array of collections.
 * @throws {Error} If the request fails.
 */
export async function listCollections(ngroupId, accessToken) {
    const url = `${API_BASE_URL}/v1/collection?ngroup_id=${ngroupId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to list collections');
    }

    return response.json();
}

/**
 * Finds a collection by its short name.
 *
 * @param {string} shortName - The short name of the collection.
 * @param {string} ngroupId - The nGroup ID.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<object>} The collection data.
 * @throws {Error} If the request fails.
 */
export async function findCollectionByShortName(shortName, ngroupId, accessToken) {
    const url = `${API_BASE_URL}/v1/collection/find?short_name=${shortName}&ngroup_id=${ngroupId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to find collection by short name');
    }

    return response.json();
}

/**
 * Updates a collection.
 *
 * @param {string} collectionId - The ID of the collection to update.
 * @param {object} updateData - The data to update.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<object>} The updated collection data.
 * @throws {Error} If the request fails.
 */
export async function updateCollection(collectionId, updateData, accessToken) {
    const url = `${API_BASE_URL}/v1/collection/${collectionId}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update collection');
    }

    return response.json();
}

/**
 * Deletes a collection.
 *
 * @param {string} collectionId - The ID of the collection to delete.
 * @param {string} ngroupId - The nGroup ID.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<void>}
 * @throws {Error} If the request fails.
 */
export async function deleteCollection(collectionId, ngroupId, accessToken) {
    const url = `${API_BASE_URL}/v1/collection/${collectionId}?ngroup_id=${ngroupId}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete collection');
    }
    // No return for DELETE
}

/**
 * Lists files for a given collection.
 *
 * @param {string} collectionId - The ID of the collection.
 * @param {string} ngroupId - The nGroup ID.
 * @param {number} page - The page number.
 * @param {number} pageSize - The number of items per page.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<object>} The list of files.
 * @throws {Error} If the request fails.
 */
export async function listFilesForCollection(collectionId, ngroupId, page, pageSize, accessToken) {
    const url = `${API_BASE_URL}/v1/collection/${collectionId}/files?ngroup_id=${ngroupId}&page=${page}&page_size=${pageSize}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to list files for collection');
    }

    return response.json();
}

/**
 * Activates a collection.
 *
 * @param {string} collectionId - The ID of the collection to activate.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<object>}
 * @throws {Error} If the request fails.
 */
export async function activateCollection(collectionId, accessToken) {
    const url = `${API_BASE_URL}/v1/collection/${collectionId}/activate`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to activate collection');
    }
    return response.json()

}

/**
 * Deactivates a collection.
 *
 * @param {string} collectionId - The ID of the collection to deactivate.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<object>}
 * @throws {Error} If the request fails.
 */
export async function deactivateCollection(collectionId, accessToken) {
  const url = `${API_BASE_URL}/v1/collection/${collectionId}/deactivate`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to deactivate collection');
  }

  return response.json();
}

async function handleResponse(response, errorMessagePrefix) {
    // ... (same handleResponse implementation as in fileApi.js) ...
     if (!response.ok) {
        let errorData;
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                errorData = await response.json();
            } else {
                errorData = { message: await response.text() };
            }
        } catch (e) {
            errorData = { message: response.statusText };
        }
        const message = `${errorMessagePrefix}: ${errorData?.detail || errorData?.message || response.statusText} (Status: ${response.status})`;
        console.error(message, errorData);
        const error = new Error(message);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    if (response.status === 204) { return null; }
     try {
        return await response.json();
     } catch(e) {
         if (response.ok && response.status !== 204) {
             console.warn(`Response was OK but not JSON for ${response.url}`);
             return { success: true };
         }
         throw e;
     }
}

function buildQueryString(params) {
    // ... (same buildQueryString implementation as in fileApi.js) ...
    const queryParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value != null) { // Check for null or undefined
                queryParams.append(key, value);
            }
        });
    }
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
}

export async function collectionFilesCount(params, accessToken) {
    
    const queryString = buildQueryString(params)
    const url = `${API_BASE_URL}/v1/collection/files/overview${queryString}`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    return handleResponse(response,"failed to fetch files");
}

/**
 * Lists all collections for a given nGroup and pagination.
 *
 * @param {string} ngroupId - The nGroup ID.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<object[]>} An array of collections.
 * @throws {Error} If the request fails.
 */
export async function listCollectionsWithPagination(params, accessToken) {
    
    const queryString = buildQueryString(params)
    const url = `${API_BASE_URL}/v1/collection${queryString}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to list collections');
    }

    return response.json();
}

