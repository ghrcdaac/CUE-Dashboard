import apiClient from './apiClient';
// ---  Import sessionService for logging ---
import sessionService from '../services/sessionService';

/**
 * Creates a new user application. This endpoint requires a valid token
 * to prove the user has authenticated with Keycloak.
 * @param {object} applicationData - The data for the new user application.
 */
export const createUserApplication = (applicationData) => {
    // ---  Logging for verification ---
    const session = sessionService.getSession();
    const token = session ? session.accessToken : null;
    console.log("Attempting to create user application. Token found in session:", !!token);
    if (!token) {
        console.error("No access token found in the current session. The request will likely fail.");
    }

    // This correctly uses the apiClient to send the Authorization header
    return apiClient.post('/user_application/', applicationData);
};


// --- All other functions use the apiClient for protected routes ---

/**
 * Lists user applications, optionally filtered by status.
 * @param {string} [status] - The status to filter by (e.g., "pending").
 * @param {object} [options] - Additional options for the request.
 * @param {boolean} [options.forceGlobal] - If true, bypasses the ngroup filter.
 */
export const listUserApplications = (status, options = {}) => {
    const { forceGlobal = false, isSpam } = options;
    const params = new URLSearchParams();

    if (status) {
        params.set('status', status);
    }
    if (isSpam !== undefined) {
        params.set('is-spam', isSpam ? 'true' : 'false');
    }

    const query = params.toString();
    const url = `/user_application/${query ? `?${query}` : ''}`;

    const config = {
        headers: {}
    };

    if (forceGlobal) {
        // This custom header will be caught by our apiClient to prevent
        // it from adding the x-active-ngroup-id header.
        config.headers['X-Skip-Ngroup-Filter'] = 'true';
    }

    return apiClient.get(url, config);
};

/**
 * Approves a user application. Requires 'approve_user' privilege.
 * @param {string} applicationId - The UUID of the application.
 * @param {string} roleId - The UUID of the role to assign.
 */
export const approveUserApplication = (applicationId, roleId) => {
    return apiClient.post(`/user_application/${applicationId}/approve?role_id=${roleId}`);
};

/**
 * Rejects a user application. Requires 'approve_user' privilege.
 * @param {string} applicationId - The UUID of the application.
 * @param {object} [options] - Additional rejection options.
 * @param {boolean} [options.markAsSpam] - Marks the applicant email as spam.
 */
export const rejectUserApplication = (applicationId, options = {}) => {
    const { markAsSpam = false } = options;
    const query = markAsSpam ? '?mark_as_spam=true' : '';
    return apiClient.post(`/user_application/${applicationId}/reject${query}`);
};

/**
 * Updates a user application.
 * @param {string} userApplicationId - The UUID of the application.
 * @param {object} updatedData - The data to update.
 */
export const updateUserApplication = (userApplicationId, updatedData) => {
    return apiClient.patch(`/user_application/${userApplicationId}`, updatedData);
};

/**
 * Deletes a user application.
 * @param {string} userApplicationId - The UUID of the application.
 */
export const deleteUserApplication = (userApplicationId) => {
    return apiClient.delete(`/user_application/${userApplicationId}`);
};

/**
 * Restores a user application (removes it from spam/rejected status).
 * @param {string} userApplicationId - The UUID of the application.
 */
export const restoreUserApplication = (userApplicationId) => {
    return apiClient.post(`/user_application/${userApplicationId}/unmark-spam`);
};