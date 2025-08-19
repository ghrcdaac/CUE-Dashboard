import { config } from '../config';

/**
 * Manages the entire user session in localStorage for persistence across page refreshes.
 */
const CUE_SESSION_KEY = 'CUE_USER_SESSION';

const sessionService = {
    /**
     * Saves the complete user session object to localStorage.
     * @param {object} sessionData - The user's session data, including tokens and profile info.
     */
    setSession(sessionData) {
        try {
            localStorage.setItem(CUE_SESSION_KEY, JSON.stringify(sessionData));
        } catch (error) {
            console.error("Could not save user session:", error);
        }
    },

    /**
     * Retrieves the user session object from localStorage.
     * @returns {object|null} The parsed session object or null if it doesn't exist.
     */
    getSession() {
        try {
            const sessionData = localStorage.getItem(CUE_SESSION_KEY);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error("Could not retrieve user session:", error);
            this.clearSession(); // Clear corrupted data
            return null;
        }
    },

    /**
     * Clears the entire user session from localStorage.
     */
    clearSession() {
        localStorage.removeItem(CUE_SESSION_KEY);
    },

    /**
     * Updates the active ngroupId in the stored session.
     * @param {string} ngroupId - The new active ngroup ID.
     */
    setActiveNgroup(ngroupId) {
        const session = this.getSession();
        if (session) {
            this.setSession({ ...session, active_ngroup_id: ngroupId });
        }
    },

    /**
     * Refreshes the access token using the stored refresh token.
     * @returns {Promise<string|null>} The new access token, or null if refresh failed.
     */
    async refreshAccessToken() {
        const session = this.getSession();
        if (!session?.refreshToken) {
            console.error("No refresh token available for refresh.");
            this.clearSession();
            return null;
        }

        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: session.refreshToken }),
            });

            if (!response.ok) {
                console.error("Token refresh failed, clearing session.");
                this.clearSession();
                return null;
            }

            const newAccessTokenData = await response.json();
            
            // Update the session with the new access token and its expiry
            const newSession = {
                ...session,
                accessToken: newAccessTokenData.access_token,
                expiresAt: Date.now() + (newAccessTokenData.expires_in * 1000),
            };
            this.setSession(newSession);

            return newAccessTokenData.access_token;
        } catch (error) {
            console.error('Token refresh network error:', error);
            this.clearSession();
            return null;
        }
    }
};

export default sessionService;
