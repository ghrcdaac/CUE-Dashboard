import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // --- UPDATED: The entire user profile is now stored ---
    user: null, // Will contain name, email, ngroups, privileges, etc.
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    // --- ADDED: Store the active ngroupId separately for easy access ---
    activeNgroupId: null, 
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * Populates the entire auth state from a saved session.
         */
        sessionRestored: (state, action) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.activeNgroupId = action.payload.active_ngroup_id;
            state.isAuthenticated = true;
            state.isLoading = false;
        },
        /**
         * Clears all session information from the state on logout.
         */
        logoutSuccess: (state) => {
            state.user = null;
            state.accessToken = null;
            state.activeNgroupId = null;
            state.isAuthenticated = false;
            state.isLoading = false;
        },
        /**
         * Updates the active ngroupId when the user changes it in the UI.
         */
        setActiveNgroup: (state, action) => {
            state.activeNgroupId = action.payload;
        },
        /**
         * Updates the access token after a refresh.
         */
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
    },
});

export const { 
    sessionRestored, 
    logoutSuccess, 
    setActiveNgroup,
    setAccessToken,
    setLoading, 
} = authSlice.actions;

export default authSlice.reducer;
