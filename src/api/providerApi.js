// src/api/providerApi.js
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl;

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

export async function fetchProviderById(providerId, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
      }
    const response = await fetch(`${API_BASE_URL}/v1/provider/${providerId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to fetch provider by ID: ${response.status} `);
    }
    return await response.json();
}

//Added method to get provider id by short name
export async function fetchProviderIdByName(shortName, accessToken) {
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
        throw new Error(errorData.detail ||`Failed to fetch provider ID: ${response.status}`);
    }
    return await response.json(); // The response is just the ID string, *not* an object

}

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
        throw new Error( errorData.detail || `Failed to create provider: ${response.status}`);

    }
    return await response.json();
}


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
        throw new Error(errorData.detail ||`Failed to update provider: ${response.status}`);
    }
    return await response.json();
}

export async function deleteProvider(providerId, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const response = await fetch(`${API_BASE_URL}/v1/provider/${providerId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete provider: ${response.status} `);
    }
    return true; //  return true on success
}