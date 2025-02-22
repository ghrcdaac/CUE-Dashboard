// src/api/egress.js
import { config } from "../config";
//import useAuth from '../hooks/useAuth'; // REMOVE

const API_BASE_URL = config.apiBaseUrl;

export async function fetchEgresses(accessToken) { // Add accessToken
    if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const response = await fetch(`${API_BASE_URL}/v1/egress/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}` // Use the token
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch egresses: ${response.statusText}`);
    }
    return await response.json();
}

export async function fetchEgressById(egressId, accessToken) { // Add accessToken
     if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const response = await fetch(`${API_BASE_URL}/v1/egress/${egressId}`,{
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


export async function createEgress(egressData, accessToken) { // Add accessToken
   if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const response = await fetch(`${API_BASE_URL}/v1/egress/`, {
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

export async function updateEgress(egressId, egressData, accessToken) { // Add accessToken
    if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const response = await fetch(`${API_BASE_URL}/v1/egress/${egressId}`, {
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


export async function deleteEgress(egressId, accessToken) {// Add accessToken
   if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const response = await fetch(`${API_BASE_URL}/v1/egress/${egressId}`, {
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