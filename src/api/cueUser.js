// src/api/cueUser.js
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl;

// Get All CUE Users
export async function fetchCueUsers(token) {  // Add token parameter
    const response = await fetch(`${API_BASE_URL}/v1/cueuser/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, // Use the token
            'Content-Type': 'application/json' // Best practice
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch CUE users: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

// Get CUE User by ID
export async function fetchCueUserById(userId, token) { // Add token parameter
    const response = await fetch(`${API_BASE_URL}/v1/cueuser/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`CUE User not found: ${userId}`);
        }
        throw new Error(`Failed to fetch CUE user: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

// Update CUE User
export async function updateCueUser(userId, userData, token) { // Add token
    const response = await fetch(`${API_BASE_URL}/v1/cueuser/${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const errorData = await response.json(); // Attempt to get error details
        throw new Error(`Failed to update CUE user: ${response.status} ${errorData.detail || response.statusText}`);
    }
    return await response.json();
}

// Delete CUE User
export async function deleteCueUser(userId, token) { // Add token
    const response = await fetch(`${API_BASE_URL}/v1/cueuser/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
             // No Content-Type needed for DELETE
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete CUE user: ${response.status} ${errorData.detail || response.statusText}`);
    }
    return true; // As per your API spec, return true on success
}

// Lookup CUE User (by email, cueusername, name, or edpub_id)
export async function lookupCueUser(params, token) {  // Add token
    const url = new URL(`${API_BASE_URL}/v1/cueuser/lookup`);
    Object.keys(params).forEach(key => {
        if (params[key]) { // Only append if the parameter has a value
            url.searchParams.append(key, params[key]);
        }
    });

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to lookup CUE User: ${response.status} - ${errorData.detail || response.statusText}`);
    }

    return await response.json();
}