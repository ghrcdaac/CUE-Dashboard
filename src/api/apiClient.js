import sessionService from '../services/sessionService';
import { config } from '../config';
import store from '../app/store';

// Helper function for the apiClient to get the temp token during login
const getTempToken = () => localStorage.getItem('CUE_TEMP_TOKEN');

/**
 * A wrapper around the standard fetch API that automatically handles
 * JWT access token refreshing and adds the active ngroup header.
 */
const apiClient = async (endpoint, options = {}) => {
    let session = sessionService.getSession();
    let accessToken = session ? session.accessToken : null;

    const tempToken = getTempToken();
    if (tempToken) {
        accessToken = tempToken;
    }

    if (accessToken && session?.expiresAt) {
        // --- FIX: Reduced the refresh buffer from 5 minutes to 1 minute ---
        const isTokenExpiring = Date.now() > (session.expiresAt - 3 * 60 * 1000);

        if (isTokenExpiring) {
            console.log('Access token is expiring, attempting to refresh...');
            const newAccessToken = await sessionService.refreshAccessToken();
            if (!newAccessToken) {
                window.location.href = '/login';
                throw new Error('Session expired. Please log in again.');
            }
            accessToken = newAccessToken;
            session = sessionService.getSession(); 
        }
    }

    const state = store.getState();
    const activeNgroupId = state.auth.activeNgroupId;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    if (activeNgroupId) {
        headers['X-Active-Ngroup-Id'] = activeNgroupId;
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
    
    if (response.status === 204) {
        return { success: true };
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
