import { config } from '../config';

// All functions for interacting with tokens stored in localStorage
const tokenService = {
    /**
     * Retrieves all authentication data from localStorage.
     */
    getAuthData() {
        const accessToken = localStorage.getItem('CUE_access_token');
        const idToken = localStorage.getItem('CUE_id_token');
        const expiresAt = localStorage.getItem('CUE_expires_at');
        // --- ADDED: Get refresh token ---
        const refreshToken = localStorage.getItem('CUE_refresh_token');
        return { accessToken, idToken, expiresAt, refreshToken };
    },

    /**
     * Stores authentication data in localStorage.
     * @param {{access_token: string, id_token: string, refresh_token: string, expires_in: number}} tokenData
     */
    setAuthData(tokenData) {
        const expires_at = Date.now() + (tokenData.expires_in * 1000);
        localStorage.setItem('CUE_access_token', tokenData.access_token);
        localStorage.setItem('CUE_id_token', tokenData.id_token);
        localStorage.setItem('CUE_expires_at', expires_at.toString());
        // --- ADDED: Store refresh token ---
        if (tokenData.refresh_token) {
            localStorage.setItem('CUE_refresh_token', tokenData.refresh_token);
        }
    },
    
    /**
     * Updates just the access token and its expiry after a refresh.
     * @param {{access_token: string, expires_in: number}} tokenData
     */
    updateAccessToken(tokenData) {
        const expires_at = Date.now() + (tokenData.expires_in * 1000);
        localStorage.setItem('CUE_access_token', tokenData.access_token);
        localStorage.setItem('CUE_expires_at', expires_at.toString());
    },

    /**
     * Removes all authentication data from localStorage.
     */
    clearAuthData() {
        localStorage.removeItem('CUE_access_token');
        localStorage.removeItem('CUE_id_token');
        localStorage.removeItem('CUE_expires_at');
        // --- ADDED: Clear refresh token ---
        localStorage.removeItem('CUE_refresh_token');
    },

    /**
     * Refreshes the access token using the refresh token from localStorage.
     * @returns {Promise<string|null>} The new access token, or null if refresh failed.
     */
    async refreshAccessToken() {
        // --- MODIFIED: Read refresh token from localStorage ---
        const { refreshToken } = this.getAuthData();
        if (!refreshToken) {
            console.error("No refresh token available for refresh.");
            this.clearAuthData();
            return null;
        }

        try {
            // --- MODIFIED: Send refresh token in the request body ---
            const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                console.error("Refresh token failed, clearing session.");
                this.clearAuthData();
                return null;
            }

            const newAccessTokenData = await response.json();
            this.updateAccessToken(newAccessTokenData);
            return newAccessTokenData.access_token;
        } catch (error) {
            console.error('Token refresh network error:', error);
            this.clearAuthData();
            return null;
        }
    }
};

export default tokenService;
