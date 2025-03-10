// src/api/userApplicationApi.js (Corrected)
import { config } from '../config';

const API_BASE_URL = config.apiBaseUrl; // Use the apiUrl from your config

export const createUserApplication = async (applicationData) => {
    const response = await fetch(`${API_BASE_URL}/v1/user_application/`, { // Added /v1/
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('CUE_accessToken')}`, // Get token
        },
        body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user application');
    }

    return await response.json();
};

export const getNgroups = async () => {
    const response = await fetch(`${API_BASE_URL}/v1/user_application/ngroups`, { // Added /v1/
        headers: {
            // 'Authorization': `Bearer ${localStorage.getItem('CUE_accessToken')}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch ngroups');
    }

    return await response.json();
};

export const getProvidersForNgroup = async (ngroupId) => {
    const response = await fetch(`${API_BASE_URL}/v1/user_application/ngroups/${ngroupId}/providers`, { // Added /v1/
        headers: {
            // 'Authorization': `Bearer ${localStorage.getItem('CUE_accessToken')}`, // Get token
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch providers');
    }

    return await response.json();
};

// New API functions below

export const getUserApplication = async (userApplicationId, ngroupId) => {
    let url = `${API_BASE_URL}/v1/user_application/${userApplicationId}`; // Added /v1/
    if (ngroupId) {
        url += `?ngroup_id=${ngroupId}`;
    }
    const response = await fetch(url, {
        headers: {
            // 'Authorization': `Bearer ${localStorage.getItem('CUE_accessToken')}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch user application');
    }

    return await response.json();
};

export const updateUserApplication = async (userApplicationId, updatedData) => {
    const response = await fetch(`${API_BASE_URL}/v1/user_application/${userApplicationId}`, { // Added /v1/
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('CUE_accessToken')}`,
        },
        body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user application');
    }

    return await response.json();
};

export const deleteUserApplication = async (userApplicationId, ngroupId) => {
    let url = `${API_BASE_URL}/v1/user_application/${userApplicationId}`; // Added /v1/
      if (ngroupId) {
        url += `?ngroup_id=${ngroupId}`;
    }
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            // 'Authorization': `Bearer ${localStorage.getItem('CUE_accessToken')}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete user application');
    }
    return true; //  API returns boolean on success.
};

export const listUserApplications = async (ngroupId) => {
    let url = `${API_BASE_URL}/v1/user_application/`; // Added /v1/
    if (ngroupId) {
        url += `?ngroup_id=${ngroupId}`;
    }
    const response = await fetch(url, {
        headers: {
            // 'Authorization': `Bearer ${localStorage.getItem('CUE_accessToken')}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list user applications');
    }

    return await response.json();
};