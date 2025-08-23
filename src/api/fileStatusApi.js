// src/api/fileStatusApi.js
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl;

// Reusing the same helper functions from fileApi.js
async function handleResponse(response, errorMessagePrefix) {
    // ... (same handleResponse implementation as in fileApi.js) ...
     if (!response.ok) {
        let errorData;
        try {
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
    if (response.status === 204) { return null; }
     try {
        return await response.json();
     } catch(e) {
         if (response.ok && response.status !== 204) {
             console.warn(`Response was OK but not JSON for ${response.url}`);
             return { success: true };
         }
         throw e;
     }
}

function buildQueryString(params) {
    // ... (same buildQueryString implementation as in fileApi.js) ...
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


// 7. Create File Status (POST /v1/file_status/)
/**
 * Creates a status record for a file.
 * @param {object} statusData - Status data.
 * @param {string} statusData.id - The File ID this status belongs to. REQUIRED.
 * @param {string} statusData.status - The initial status (e.g., 'unscanned'). REQUIRED.
 * @param {object} [statusData.scan_results] - Optional initial scan results.
 * @param {string} accessToken - JWT token.
 */
export async function createFileStatus(statusData, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!statusData || !statusData.id || !statusData.status) {
         throw new Error("Invalid input: 'id' (File ID) and 'status' are required.");
    }

    const response = await fetch(`${API_BASE_URL}/v1/file_status/`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(statusData),
    });
    return handleResponse(response, "Failed to create file status");
}

// 8. Get Specific File Status (GET /v1/file_status/{file_id})
/**
 * Retrieves the status record for a specific file.
 * @param {string} fileId - The File ID whose status to retrieve. REQUIRED.
 * @param {string} accessToken - JWT token.
 */
export async function getFileStatusById(fileId, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!fileId) throw new Error("File ID is required.");

    const response = await fetch(`${API_BASE_URL}/v1/file_status/${fileId}`, {
        method: "GET",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });
    // Note: Backend verifies ownership via ngroup implicitly
    return handleResponse(response, `Failed to fetch file status for File ID ${fileId}`);
}

// 9. Update File Status (PATCH /v1/file_status/{file_id})
/**
 * Updates the status record for a specific file.
 * @param {string} fileId - The File ID whose status to update. REQUIRED.
 * @param {object} updateData - Object containing only the status fields to update.
 * @param {string} accessToken - JWT token.
 */
export async function updateFileStatus(fileId, updateData, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!fileId) throw new Error("File ID is required.");
    if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error("Update data cannot be empty for patching.");
    }

    const response = await fetch(`${API_BASE_URL}/v1/file_status/${fileId}`, {
        method: "PATCH",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(updateData),
    });
    return handleResponse(response, `Failed to update file status for File ID ${fileId}`);
}

// 10. Delete File Status (DELETE /v1/file_status/{file_id})
/**
 * Deletes the status record for a specific file.
 * @param {string} fileId - The File ID whose status record to delete. REQUIRED.
 * @param {string} accessToken - JWT token.
 */
export async function deleteFileStatus(fileId, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!fileId) throw new Error("File ID is required for deletion.");

    const response = await fetch(`${API_BASE_URL}/v1/file_status/${fileId}`, {
        method: "DELETE",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });
    return handleResponse(response, `Failed to delete file status for File ID ${fileId}`);
}

// 11. List File Statuses in NGROUP (GET /v1/file_status/)
/**
 * Lists all file status records for a specific NGROUP.
 * @param {string} ngroupId - The NGROUP ID whose file statuses to list. REQUIRED.
 * @param {string} accessToken - JWT token.
 * @param {object} [paginationParams] - Optional pagination parameters (e.g., { page: 1, page_size: 20 }).
 */
export async function listFileStatusesForNgroup(ngroupId, accessToken, paginationParams = {}) {
     if (!accessToken) throw new Error("Authentication required.");
     if (!ngroupId) throw new Error("NGROUP ID is required to list file statuses.");

     const params = { ngroup_id: ngroupId, ...paginationParams };
     const queryString = buildQueryString(params); // Use helper

     const url = `${API_BASE_URL}/v1/file_status/${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });
    return handleResponse(response, "Failed to list file statuses for NGROUP");
}

// --- Metrics Endpoints ---

/**
 * Common parameter type for metrics endpoints.
 * @typedef {object} MetricsQueryParameters
 * @property {string} ngroup_id - REQUIRED.
 * @property {string} [start_date] - Optional 'YYYY-MM-DD'.
 * @property {string} [end_date] - Optional 'YYYY-MM-DD'.
 * @property {string} [user_id] - Optional UUID.
 * @property {string} [collection_id] - Optional UUID.
 * @property {string} [provider_id] - Optional UUID.
 */

// 12. Get Daily Volume (GET /metrics/daily_volume)
/**
 * Gets daily volume (GB) with optional filters.
 * @param {MetricsQueryParameters} params - Query parameters including required ngroup_id.
 * @param {string} accessToken - JWT token.
 */
export async function getDailyVolume(params, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!params || !params.ngroup_id) throw new Error("NGROUP ID is required for metrics.");
    // REMOVED strict client checks for optional filters

    const queryString = buildQueryString(params); // Use helper
    const url = `${API_BASE_URL}/v1/file_status/metrics/daily_volume${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    return handleResponse(response, "Failed to get daily volume");
}

// 13. Get Daily Count (GET /metrics/daily_count)
/**
 * Gets daily file count with optional filters.
 * @param {MetricsQueryParameters} params - Query parameters including required ngroup_id.
 * @param {string} accessToken - JWT token.
 */
export async function getDailyCount(params, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!params || !params.ngroup_id) throw new Error("NGROUP ID is required for metrics.");
    // REMOVED strict client checks for optional filters (e.g., collection_id)

    const queryString = buildQueryString(params); // Use helper
    const url = `${API_BASE_URL}/v1/file_status/metrics/daily_count${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    return handleResponse(response, "Failed to get daily file count");
}

// 14. Get Overall Volume (GET /metrics/overall_volume)
/**
 * Gets total volume (GB) with optional filters.
 * @param {MetricsQueryParameters} params - Query parameters including required ngroup_id.
 * @param {string} accessToken - JWT token.
 */
export async function getOverallFileVolume(params, accessToken) { // Renamed from getOverallVolume for consistency
    if (!accessToken) throw new Error("Authentication required.");
    if (!params || !params.ngroup_id) throw new Error("NGROUP ID is required for metrics.");
    // REMOVED strict client checks for optional filters

    const queryString = buildQueryString(params); // Use helper
    const url = `${API_BASE_URL}/v1/file_status/metrics/overall_volume${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    return handleResponse(response, "Failed to get overall file volume");
}

// 15. Get Overall Count (GET /metrics/overall_count)
/**
 * Gets total file count with optional filters.
 * @param {MetricsQueryParameters} params - Query parameters including required ngroup_id.
 * @param {string} accessToken - JWT token.
 */
export async function getOverallCount(params, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!params || !params.ngroup_id) throw new Error("NGROUP ID is required for metrics.");
    // REMOVED strict client checks for optional filters (e.g., collection_id)

    const queryString = buildQueryString(params); // Use helper
    const url = `${API_BASE_URL}/v1/file_status/metrics/overall_count${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    return handleResponse(response, "Failed to get overall count");
}

// 16. Get Status Counts (GET /metrics/status_counts)
/**
 * Gets counts for each status type with optional filters.
 * @param {MetricsQueryParameters} params - Query parameters including required ngroup_id.
 * @param {string} accessToken - JWT token.
 */
export async function getStatusCounts(params, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!params || !params.ngroup_id) throw new Error("NGROUP ID is required for metrics.");
     // REMOVED strict client checks for optional filters (e.g., provider_id)

    const queryString = buildQueryString(params); // Use helper
    const url = `${API_BASE_URL}/v1/file_status/metrics/status_counts${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    return handleResponse(response, "Failed to get status counts");
}

// 17. List Files by Status (GET /list_by_status)
/**
 * Lists files matching a specific status with optional filters and pagination.
 * @typedef {object} ListByStatusParameters extends MetricsQueryParameters
 * @property {string} status - REQUIRED status filter.
 * @property {number} [page=1] - Optional page number.
 * @property {number} [page_size=20] - Optional items per page.
 * @param {ListByStatusParameters} params - Query parameters including required ngroup_id and status.
 * @param {string} accessToken - JWT token.
 */
export async function listFilesByStatus(params, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!params || !params.ngroup_id || !params.status) {
        throw new Error("NGROUP ID and Status are required to list files by status.");
    }
    // REMOVED strict client checks for optional filters

    const queryString = buildQueryString(params); // Use helper
    const url = `${API_BASE_URL}/v1/file_status/list_by_status${queryString}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    return handleResponse(response, `Failed to list files by status '${params.status}'`);
}

/**
 * Fetches a consolidated summary of all metrics.
 * @typedef {object} MetricsSummaryQueryParameters
 * @property {string} ngroup_id - REQUIRED.
 * @property {string} [start_date] - Optional 'YYYY-MM-DD'.
 * @property {string} [end_date] - Optional 'YYYY-MM-DD'.
 * @property {string} [user_id] - Optional UUID.
 * @property {string} [collection_id] - Optional UUID.
 * @property {string} [provider_id] - Optional UUID.
 */

/**
 * Gets a summary of all metrics based on filters.
 * @param {MetricsSummaryQueryParameters} params - Query parameters including required ngroup_id.
 * @param {string} accessToken - JWT token.
 */
export async function getMetricsSummary(params, accessToken) {
    if (!accessToken) throw new Error("Authentication required.");
    if (!params || !params.ngroup_id) throw new Error("NGROUP ID is required for metrics summary.");

    // Uses the existing buildQueryString helper which skips null/undefined
    const queryString = buildQueryString(params);
    const url = `${API_BASE_URL}/v1/file_status/metrics/summary${queryString}`;

    console.log(`Workspaceing Metrics Summary from: ${url}`); // Log URL

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        }
    });
    // Uses the existing handleResponse helper
    return handleResponse(response, "Failed to get metrics summary");
}

