// src/api/userApplicationApi.js
import { config } from '../config';

const API_BASE_URL = config.apiBaseUrl; // Use the apiUrl from your config

export const createUserApplication = async (applicationData) => {
    const response = await fetch(`${API_BASE_URL}/v1/user_application/`, {
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
    const response = await fetch(`${API_BASE_URL}/v1/user_application/ngroups`, {
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
    const response = await fetch(`${API_BASE_URL}/v1/user_application/ngroups/${ngroupId}/providers`, {
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