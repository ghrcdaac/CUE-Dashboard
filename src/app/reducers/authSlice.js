import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null, // Holds the full user profile for registered users
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    activeNgroupId: null, 
    // --- ADDED: To track the user's registration status ---
    status: null, 
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * Populates the entire auth state from a saved session.
         * This now handles both full sessions (for registered users) and
         * minimal sessions (for new/pending users).
         */
        sessionRestored: (state, action) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.activeNgroupId = action.payload.active_ngroup_id;
            state.status = action.payload.status;
            state.isAuthenticated = true; // The user has a valid token
            state.isLoading = false;
        },
        /**
         * Clears all session information from the state on logout.
         */
        logoutSuccess: (state) => {
            state.user = null;
            state.accessToken = null;
            state.activeNgroupId = null;
            state.status = null;
            state.isAuthenticated = false;
            state.isLoading = false;
        },
        /**
         * Updates the active ngroupId when the user changes it in the UI.
         */
        setActiveNgroup: (state, action) => {
            state.activeNgroupId = action.payload;
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
    setLoading, 
} = authSlice.actions;

export default authSlice.reducer;
