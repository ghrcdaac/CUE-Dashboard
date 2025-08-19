import sessionService from '../services/sessionService';
import { config } from '../config';
// --- REMOVED: No longer need to import the Redux store ---

/**
 * A helper function to get the temporary token during the login callback.
 * This is needed because the full session isn't saved yet when getMyProfile is called.
 */
const getTempToken = () => localStorage.getItem('CUE_TEMP_TOKEN');

/**
 * A wrapper around the standard fetch API that automatically handles
 * JWT access token refreshing and adds the active ngroup header.
 */
const apiClient = async (endpoint, options = {}) => {
    // --- UPDATED: Use sessionService to get session data ---
    let session = sessionService.getSession();
    let accessToken = session ? session.accessToken : null;

    // --- NEW: Handle the special case during the login callback ---
    const tempToken = getTempToken();
    if (tempToken) {
        accessToken = tempToken;
    }

    if (accessToken && session?.expiresAt) {
        const isTokenExpiring = Date.now() > (session.expiresAt - 5 * 60 * 1000);
        if (isTokenExpiring) {
            console.log('Access token is expiring, attempting to refresh...');
            const newAccessToken = await sessionService.refreshAccessToken();
            if (!newAccessToken) {
                window.location.href = '/login';
                throw new Error('Session expired. Please log in again.');
            }
            accessToken = newAccessToken;
            // Refresh the session object after getting a new token
            session = sessionService.getSession(); 
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // --- UPDATED: Get active ngroupId from the session object ---
    if (session?.active_ngroup_id) {
        headers['X-Active-Ngroup-Id'] = session.active_ngroup_id;
    }

    const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = new Error(`API call failed: ${response.statusText}`);
        try {
            error.response = await response.json();
        } catch (e) {
            error.response = { detail: 'Could not parse error response.' };
        }
        console.error(`API Error on ${endpoint}:`, error.response);
        throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    
    return response;
};

// Helper methods
apiClient.get = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'GET' });
apiClient.post = (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
apiClient.put = (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
apiClient.patch = (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
apiClient.delete = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'DELETE' });

export default apiClient;
