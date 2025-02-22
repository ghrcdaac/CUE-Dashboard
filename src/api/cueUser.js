// src/api/cueUser.js
import { config } from "../config";
//import useAuth from '../hooks/useAuth'; // REMOVED

const API_BASE_URL = config.apiBaseUrl;

// Get All CUE Users
export async function fetchCueUsers(accessToken) { // Added accessToken
    if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }

    const response = await fetch(`${API_BASE_URL}/v1/cueuser/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`, // Use the passed-in token
            'Content-Type': 'application/json'
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch CUE users: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

// Get CUE User by ID
export async function fetchCueUserById(userId, accessToken) { // Added accessToken
     if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }

    const response = await fetch(`${API_BASE_URL}/v1/cueuser/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
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
export async function updateCueUser(userId, userData, accessToken) { // Added accessToken
     if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const response = await fetch(`${API_BASE_URL}/v1/cueuser/${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update CUE user: ${response.status} ${errorData.detail || response.statusText}`);
    }
    return await response.json();
}

// Delete CUE User
export async function deleteCueUser(userId, accessToken) { // Added accessToken
     if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const response = await fetch(`${API_BASE_URL}/v1/cueuser/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete CUE user: ${response.status} ${errorData.detail || response.statusText}`);
    }
    return true;
}

// Lookup CUE User (by email, cueusername, name, or edpub_id)
export async function lookupCueUser(params, accessToken) { // Added accessToken
    if (!accessToken) {
        throw new Error("Not authenticated: No access token available.");
    }
    const url = new URL(`${API_BASE_URL}/v1/cueuser/lookup`);
    Object.keys(params).forEach(key => {
        if (params[key]) {
            url.searchParams.append(key, params[key]);
        }
    });

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
    });

    if (!response.ok) {
         const errorData = await response.json();
        throw new Error(`Failed to lookup CUE user: ${response.status} - ${errorData.detail || response.statusText}`);
    }

    return await response.json();
}
//create user
export async function createCueUser(userData, accessToken) {
    if (!accessToken) {
        throw new Error('Not authenticated');
    }
    const response = await fetch(`${API_BASE_URL}/v1/cueuser/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create user: ${response.statusText}, ${errorData.detail}`);
    }
    return await response.json();
}