// src/api/adminApi.js
import { config } from '../config';

const API_BASE_URL = config.apiBaseUrl;

/**
 * Verifies the email of a specified user as an administrator.
 *
 * @param {string} username - The username of the user.
 * @returns {Promise<object>} The API response data.
 * @throws {Error} If the request fails or the user is not found/unauthorized.
 */
export const verifyUserEmail = async (username) => {
    if (!username) {
        throw new Error("Username is required.");
    }

    const url = `${API_BASE_URL}/v1/auth/verify-email`; // Use template literal

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });

        if (!response.ok) {
            const errorData = await response.json(); // Always try to get JSON error
            let errorMessage = 'Failed to verify user email.'; // Default message

             if (response.status === 401) {
                errorMessage = "Unauthorized: Invalid or expired admin access token.";
            } else if (response.status === 403) {
                 errorMessage = "Forbidden: Insufficient privileges to verify user email.";
            } else if (response.status === 404) {
                errorMessage = `Not Found: User '${username}' not found.`;
            } else if (response.status === 500) {
                errorMessage = "Internal Server Error: An unexpected error occurred.";
            }else if (errorData && errorData.message) {
                errorMessage = errorData.message; // Use API's message if available
            } else if (errorData && errorData.detail){
                errorMessage = errorData.detail;
            }
            throw new Error(errorMessage);
        }

        return await response.json(); // Parse JSON on success

    } catch (error) {
        // Catch network errors or errors thrown from the response handling
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          throw new Error("Network Error: Could not connect to the server.");
        }
        throw error; // Re-throw other errors for handling upstream
    }
};