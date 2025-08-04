// src/api/providerApi.js
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl;

// 1. Create Provider
export async function createProvider(providerData, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const response = await fetch(`${API_BASE_URL}/v1/provider/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to create provider: ${response.status}`);
    }
    return await response.json();
}

// 2. Lookup Provider (GET /v1/provider/find)
export async function findProvider(params, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }

    const url = new URL(`${API_BASE_URL}/v1/provider/find`);
    Object.keys(params).forEach(key => {
        if (params[key] != null) { // Important: Check for null/undefined
            url.searchParams.append(key, params[key]);
        }
    });


    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json', // Include content type, even for GET
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to find provider: ${response.status}`);
    }
    return await response.json();
}
// 3. Get Provider (GET /v1/provider/{provider_id})
export async function fetchProviderById(providerId, accessToken, ngroupId = null) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    let url = `${API_BASE_URL}/v1/provider/${providerId}`;
    if (ngroupId) {
        url += `?ngroup_id=${ngroupId}`;
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch provider by ID: ${response.status}`);
    }
    return await response.json();
}

// 4. Update Provider (PATCH /v1/provider/{provider_id})
export async function updateProvider(providerId, providerData, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const response = await fetch(`${API_BASE_URL}/v1/provider/${providerId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update provider: ${response.status}`);
    }
    return await response.json();
}

// 5. Delete Provider (DELETE /v1/provider/{provider_id})
export async function deleteProvider(providerId, accessToken, ngroupId = null) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    let url = `${API_BASE_URL}/v1/provider/${providerId}`;
     if (ngroupId) {
        url += `?ngroup_id=${ngroupId}`;
    }
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete provider: ${response.status}`);
    }
    return true; // Return true on success
}

// 6. List Providers (GET /v1/provider/)
// Renamed the function, as fetchProviders with query parameters is already there, and kept that function too
export async function listProviders(accessToken, params = {}) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }

    let url = `${API_BASE_URL}/v1/provider/`;
    console.log("providerApi API_BASE_URL:", API_BASE_URL);
    const queryParams = new URLSearchParams();

    // Add query parameters if provided
    if (params) {
        for (const key in params) {
            if (params.hasOwnProperty(key) && params[key] != null) {
                queryParams.append(key, params[key]);
            }
        }
    }

    const queryString = queryParams.toString();
    if (queryString) {
        url += `?${queryString}`;  // Append to URL
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json', // Good practice to include, even for GET
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch providers: ${response.status}`);
    }

    return await response.json();
}

// Existing fetchProviders function (kept for backward compatibility/flexibility)
export async function fetchProviders(accessToken, params = {}) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }

    let url = `${API_BASE_URL}/v1/provider/`;
    const queryParams = new URLSearchParams();

    // Add query parameters if provided
    if (params) {
        for (const key in params) {
            if (params.hasOwnProperty(key) && params[key] != null) {
                queryParams.append(key, params[key]);
            }
        }
    }
    // Convert URLSearchParams object to a string and prepend '?' if there are any parameters
    const queryString = queryParams.toString();
    if (queryString) {
        url += `?${queryString}`;  // Append to URL
    }
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}
//Added method to get provider id by short name -  KEEP, but rename for clarity
export async function fetchProviderIdByShortName(shortName, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const response = await fetch(`${API_BASE_URL}/v1/provider/id/?short_name=${shortName}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch provider ID: ${response.status}`);
    }
      return await response.json(); // The response is just the ID string

}