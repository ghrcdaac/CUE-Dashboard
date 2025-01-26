// src/api/egress.js
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl;

// Set this to 'true' to use the 'no-cors' workaround (not recommended for production)
const USE_NO_CORS = false; 

/**
 * Fetches all egress records.
 * @returns {Promise<Array>} An array of egress objects.
 * @throws {Error} If the request fails.
 */
export async function fetchEgresses() {
    const response = await fetch(`${API_BASE_URL}/v1/egress/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json' // Ensure Content-Type header is set
        },
    });

    console.log('Response from fetchEgresses:', response); // Log the response

    if (!response.ok) {
        throw new Error(`Failed to fetch egresses: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('Data from fetchEgresses:', data); // Log the data

    return data;
}

/**
 * Fetches a single egress record by ID.
 * @param {string} egressId - The ID of the egress record.
 * @returns {Promise<Object>} The egress object.
 * @throws {Error} If the request fails or the egress is not found.
 */
export async function fetchEgressById(egressId) {
    const fetchOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    };

    if (USE_NO_CORS) {
        fetchOptions.mode = "no-cors";
    }

    const response = await fetch(`${API_BASE_URL}/v1/egress/${egressId}`, fetchOptions);
    
    if (USE_NO_CORS) {
        // Handle no-cors case appropriately
        return {}; 
    }

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Egress not found: ${egressId}`);
        }
        throw new Error(`Failed to fetch egress: ${response.statusText}`);
    }
    return await response.json();
}

/**
 * Creates a new egress record.
 * @param {Object} egressData - The data for the new egress record.
 * @returns {Promise<Object>} The created egress object.
 * @throws {Error} If the request fails.
 */
export async function createEgress(egressData) {
    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(egressData),
    };

    if (USE_NO_CORS) {
        fetchOptions.mode = "no-cors";
    }

    const response = await fetch(`${API_BASE_URL}/v1/egress/`, fetchOptions);

    if (USE_NO_CORS) {
        // Handle no-cors case appropriately
        return {}; 
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create egress: ${errorData.message || response.statusText}`);
    }
    return await response.json();
}

/**
 * Updates an existing egress record.
 * @param {string} egressId - The ID of the egress record to update.
 * @param {Object} egressData - The updated data for the egress record.
 * @returns {Promise<Object>} The updated egress object.
 * @throws {Error} If the request fails.
 */
export async function updateEgress(egressId, egressData) {
    const fetchOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(egressData),
    };

    if (USE_NO_CORS) {
        fetchOptions.mode = "no-cors";
    }

    const response = await fetch(`${API_BASE_URL}/v1/egress/${egressId}`, fetchOptions);

    if (USE_NO_CORS) {
        // Handle no-cors case appropriately
        return {}; 
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update egress: ${errorData.message || response.statusText}`);
    }
    return await response.json();
}

/**
 * Deletes an egress record.
 * @param {string} egressId - The ID of the egress record to delete.
 * @returns {Promise<boolean>} True if the deletion was successful.
 * @throws {Error} If the request fails.
 */
export async function deleteEgress(egressId) {
    const fetchOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        }
    };

    if (USE_NO_CORS) {
        fetchOptions.mode = "no-cors";
    }
    
    const response = await fetch(`${API_BASE_URL}/v1/egress/${egressId}`, fetchOptions);

    if (USE_NO_CORS) {
        // Handle no-cors case appropriately
        return true; 
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete egress: ${errorData.message || response.statusText}`);
    }
    return true;
}