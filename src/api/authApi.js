import apiClient from './apiClient';

/**
 * Retrieves the fully registered user's profile from the backend.
 * This requires the user to exist in the CUE database.
 */
export const getUserInfo = () => {
    return apiClient.get('/auth/userinfo');
};

/**
 * Retrieves the basic claims (name, email, username) from a user's token.
 * This does NOT require the user to be registered in the CUE database.
 * It's used specifically for pre-filling the new user application form.
 */
export const getUserClaims = () => {
    return apiClient.get('/auth/claims');
};

/**
 * Initiates Keycloak's 'forgot password' flow for the currently logged-in user.
 */
export const initiatePasswordReset = () => {
    return apiClient.post('/auth/initiate-password-reset');
};

/**
 * A debugging tool to check the status and claims of a given token.
 * @param {string} token - The access or refresh token to inspect.
 */
export const introspectToken = (token) => {
    return apiClient.post('/auth/introspect', { token });
};
