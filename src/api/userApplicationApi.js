import apiClient from './apiClient';
// --- ADDED: Import sessionService for logging ---
import sessionService from '../services/sessionService';

/**
 * Creates a new user application. This endpoint requires a valid token
 * to prove the user has authenticated with Keycloak.
 * @param {object} applicationData - The data for the new user application.
 */
export const createUserApplication = (applicationData) => {
    // --- ADDED: Logging for verification ---
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
 * Lists user applications, optionally filtered by status. Requires 'approve_user' privilege.
 * @param {string} [status] - The status to filter by (e.g., "pending", "rejected").
 */
export const listUserApplications = (status) => {
    let url = `/user_application/`;
    if (status) {
        url += `?status=${status}`;
    }
    return apiClient.get(url);
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
 */
export const rejectUserApplication = (applicationId) => {
    return apiClient.post(`/user_application/${applicationId}/reject`);
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
