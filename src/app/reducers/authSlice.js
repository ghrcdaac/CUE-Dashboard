// src/app/reducers/authSlice.js (Modified)
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    username: null,
    challengeName: null,
    user: null,
    isLoading: true,
    ngroupId: null, // Add ngroupId
    roleId: null,   // Add roleId
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
            state.username = action.payload.username;
            state.challengeName = null;
            state.user = null;
            state.isLoading = false;
            state.ngroupId = action.payload.ngroupId; // Store ngroupId
            state.roleId = action.payload.roleId;     // Store roleId
        },
        logoutSuccess: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.username = null;
            state.challengeName = null;
            state.user = null;
            state.isLoading = false;
            state.ngroupId = null; // Clear ngroupId
            state.roleId = null;   // Clear roleId
        },
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
        },
        setChallengeName: (state, action) => {
            state.challengeName = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        // Add reducers for setting ngroupId and roleId if needed separately
        setNgroupId: (state, action) => {
          state.ngroupId = action.payload;
        },
        setRoleId: (state, action) => {
          state.roleId = action.payload;
        }
    },
});

export const { loginSuccess, logoutSuccess, setAccessToken, setChallengeName, setUser, setLoading, setNgroupId, setRoleId } = authSlice.actions;
export default authSlice.reducer;