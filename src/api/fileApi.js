// src/api/fileApi.js
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl;

// Helper function for standardized error handling (reuse from previous examples)
async function handleResponse(response, errorMessagePrefix) {
    if (!response.ok) {
        let errorData;
        try {
            // Try parsing JSON, fallback to text
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                errorData = await response.json();
            } else {
                errorData = { message: await response.text() };
            }
        } catch (e) {
            errorData = { message: response.statusText };
        }
        const message = `${errorMessagePrefix}: ${errorData?.detail || errorData?.message || response.statusText} (Status: ${response.status})`;
        console.error(message, errorData);
        const error = new Error(message);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    if (response.status === 204) { // Handle No Content for DELETE
        return null;
    }
    // Assume JSON response for success, handle potential empty body for non-JSON success?
     try {
        return await response.json();
     } catch(e) {
         // If response is OK but not JSON (e.g., sometimes DELETE returns OK with no body)
         if (response.ok && response.status !== 204) {
             console.warn(`Response was OK but not JSON for ${response.url}`);
             return { success: true }; // Or return null or {}
         }
         throw e; // Re-throw if it's a real parsing error on non-OK response
     }
}

// Helper to build query strings, skipping null/undefined
function buildQueryString(params) {
    const queryParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value != null) { // Check for null or undefined
                queryParams.append(key, value);
            }
        });
    }
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
}

// 1. Create File Record (POST /v1/file/)
/**
 * Creates a metadata record for a file.
 * Assumes collection_id belongs to the user's ngroup (verified by backend).
 * @param {object} fileData - File metadata (name, type, checksum, cueuser_uploaded, collection_id, size_bytes, edpub?)
 * @param {string} accessToken - JWT token.
 */
export async function createFileRecord(fileData, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    // Add basic validation if desired
    if (!fileData.name || !fileData.checksum || !fileData.cueuser_uploaded || !fileData.collection_id || !fileData.size_bytes) {
        throw new Error("Missing required fields for file creation.");
    }

    const response = await fetch(`${API_BASE_URL}/v1/file/`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(fileData),
    });
    return handleResponse(response, "Failed to create file record");
}

// 2. Find Files by Name (GET /v1/file/find)
/**
 * Finds file records by exact name match within a specific NGROUP.
 * @param {object} params - Query parameters.
 * @param {string} params.name - The exact file name to search for. REQUIRED.
 * @param {string} params.ngroup_id - The NGROUP ID to search within. REQUIRED.
 * @param {string} accessToken - JWT token.
 */
export async function findFilesByName(params, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!params || !params.name || !params.ngroup_id) {
        throw new Error("Missing required parameters: name and ngroup_id are required for finding files.");
    }

    const queryString = buildQueryString(params); // Use helper
    const url = `${API_BASE_URL}/v1/file/find${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });
    return handleResponse(response, `Failed to find files by name '${params.name}'`);
}


// 3. Get Specific File Record (GET /v1/file/{file_id})
/**
 * Retrieves metadata for a specific file.
 * Assumes backend verifies file belongs to user's ngroup.
 * @param {string} fileId - The UUID of the file.
 * @param {string} accessToken - JWT token.
 */
export async function getFileRecordById(fileId, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!fileId) throw new Error("File ID is required.");

    const response = await fetch(`${API_BASE_URL}/v1/file/${fileId}`, {
        method: "GET",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });
    return handleResponse(response, `Failed to fetch file record for ID ${fileId}`);
}

// 4. Update File Record (PATCH /v1/file/{file_id})
/**
 * Updates specific fields of a file's metadata.
 * Assumes backend verifies file belongs to user's ngroup.
 * @param {string} fileId - The UUID of the file to update.
 * @param {object} updateData - Object containing only the fields to update.
 * @param {string} accessToken - JWT token.
 */
export async function updateFileRecord(fileId, updateData, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!fileId) throw new Error("File ID is required.");
    if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error("Update data cannot be empty for patching.");
    }

    const response = await fetch(`${API_BASE_URL}/v1/file/${fileId}`, {
        method: "PATCH",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(updateData),
    });
    return handleResponse(response, `Failed to update file record for ID ${fileId}`);
}

// 5. Delete File Record (DELETE /v1/file/{file_id})
/**
 * Deletes a file's metadata record.
 * Assumes backend verifies file belongs to user's ngroup.
 * @param {string} fileId - The UUID of the file to delete.
 * @param {string} accessToken - JWT token.
 */
export async function deleteFileRecord(fileId, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!fileId) throw new Error("File ID is required for deletion.");

    const response = await fetch(`${API_BASE_URL}/v1/file/${fileId}`, {
        method: "DELETE",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });
    return handleResponse(response, `Failed to delete file record for ID ${fileId}`);
}


// 6. List Files in NGROUP (GET /v1/file/)
/**
 * Lists all file metadata records for a specific NGROUP.
 * @param {string} ngroupId - The NGROUP ID whose files to list. REQUIRED.
 * @param {string} accessToken - JWT token.
 * @param {object} [paginationParams] - Optional pagination parameters (e.g., { page: 1, page_size: 20 }).
 */
export async function listFilesForNgroup(ngroupId, accessToken, paginationParams = {}) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!ngroupId) throw new Error("NGROUP ID is required to list files.");

    const params = { ngroup_id: ngroupId, ...paginationParams };
    const queryString = buildQueryString(params); // Use helper

    const url = `${API_BASE_URL}/v1/file/${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });
    return handleResponse(response, "Failed to list files for NGROUP");
}