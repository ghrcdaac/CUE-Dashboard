// src/api/roleApi.js
import { config } from '../config';

const API_BASE_URL = config.apiBaseUrl;

// 1. Create Role (POST /v1/role/)
export async function createRole(roleData, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const response = await fetch(`${API_BASE_URL}/v1/role/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to create role: ${response.status}`);
    }
    return await response.json();
}

// 2. Lookup Role (GET /v1/role/find)
export async function findRole(params, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const url = new URL(`${API_BASE_URL}/v1/role/find`);
    Object.keys(params).forEach(key => {
        if (params[key] != null) {
            url.searchParams.append(key, params[key]);
        }
    });

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to find role: ${response.status}`);
    }
    return await response.json();
}

// 3. Get Role (GET /v1/role/{role_id})
export async function getRoleById(roleId, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const url = `${API_BASE_URL}/v1/role/${roleId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch role by ID: ${response.status}`);
    }
    return await response.json();
}

// 4. Update Role (PATCH /v1/role/{role_id})
export async function updateRole(roleId, roleData, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const response = await fetch(`${API_BASE_URL}/v1/role/${roleId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update role: ${response.status}`);
    }
    return await response.json();
}

// 5. Delete Role (DELETE /v1/role/{role_id})
export async function deleteRole(roleId, accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const url = `${API_BASE_URL}/v1/role/${roleId}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete role: ${response.status}`);
    }
    return true; // Return true on success
}

// 6. List Roles (GET /v1/role/)
export async function listRoles(accessToken) {
    if (!accessToken) {
        throw new Error("No access token provided");
    }
    const url = `${API_BASE_URL}/v1/role/`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to list roles: ${response.status}`);
    }
    return await response.json();
}

// (Optional, but good practice)  Export a single object for all functions:
const roleApi = {
    createRole,
    findRole,
    getRoleById,
    updateRole,
    deleteRole,
    listRoles,
};

export default roleApi; // Use a default export for the object