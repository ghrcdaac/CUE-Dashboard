// src/api/ngroup.js
import { config } from "../config";
//import useAuth from '../hooks/useAuth'; // REMOVE

const API_BASE_URL = config.apiBaseUrl;

export async function getNgroupById(ngroupId, accessToken) { // Add accessToken
    if (!accessToken) {
        throw new Error("Not authenticated");
    }
    const response = await fetch(`${API_BASE_URL}/v1/ngroup/${ngroupId}`,{
      method: "GET",
      headers: {
        'Authorization': `Bearer ${accessToken}`, // Add to all requests
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Ngroup not found: ${ngroupId}`);
        }
        throw new Error(`Failed to fetch ngroup: ${response.statusText}`);
    }
    return await response.json();
}

export async function fetchNgroups(accessToken) { // Add accessToken
    if (!accessToken) {
        throw new Error("Not authenticated");
    }
     const response = await fetch(`${API_BASE_URL}/v1/ngroup/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`, // Add to all requests
          'Content-Type': 'application/json' // and be explicit about content type
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ngroups: ${response.statusText}`);
    }
    return await response.json();
}
//Added a sample create method, add more methods based on your need.
export async function createNgroup(groupData, accessToken) {
     
    const response = await fetch(`${API_BASE_URL}/v1/ngroup/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(groupData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create group: ${errorData.message || response.statusText}`);
    }
    return await response.json();
}