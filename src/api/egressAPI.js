// src/api/egress.js
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl; // Keep the base URL from config

export async function fetchEgresses(accessToken, ngroupId) {
    if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    let url = `${API_BASE_URL}/v1/egress/`; // Added /v1/ here
    if (ngroupId) {
        url += `?ngroup_id=${ngroupId}`;
    }
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch egresses: ${response.statusText}`);
    }
    return await response.json();
}

export async function fetchEgressById(egressId, accessToken, ngroupId) {
    if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    let url = `${API_BASE_URL}/v1/egress/${egressId}`; // Added /v1/ here
    if (ngroupId) {
        url += `?ngroup_id=${ngroupId}`;
    }
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Egress not found: ${egressId}`);
        }
        throw new Error(`Failed to fetch egress: ${response.statusText}`);
    }
    return await response.json();
}

export async function createEgress(egressData, accessToken) {
    if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const response = await fetch(`${API_BASE_URL}/v1/egress/`, { // Added /v1/ here
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(egressData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create egress: ${errorData.message || response.statusText}`);
    }
    return await response.json();
}

export async function updateEgress(egressId, egressData, accessToken) {
    if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const response = await fetch(`${API_BASE_URL}/v1/egress/${egressId}`, { // Added /v1/ here
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(egressData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update egress: ${errorData.message || response.statusText}`);
    }
    return await response.json();
}

export async function deleteEgress(egressId, accessToken, ngroupId) {
    if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    let url = `${API_BASE_URL}/v1/egress/${egressId}`; // Added /v1/ here
    if (ngroupId) {
        url += `?ngroup_id=${ngroupId}`;
    }
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete egress: ${errorData.message || response.statusText}`);
    }
    return true;
}


// List Egresses (added ngroupId parameter)
export async function listEgresses(ngroupId, accessToken) {
    if (!accessToken) {
        throw new Error("Access token is required.");
    }
    if (!ngroupId) {
        throw new Error("ngroupId is required.");
    }

    const url = `${API_BASE_URL}/v1/egress/?ngroup_id=${ngroupId}`;  // Added /v1/ here
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list egresses');
    }
    return await response.json();
}