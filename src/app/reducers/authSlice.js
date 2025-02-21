// src/app/reducers/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const initialState = {
    accessToken: null,
    isAuthenticated: false,
    username: null,
    challengeName: null, // Add challengeName to the state
    user: null // to store the cognito user object
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.accessToken = action.payload.accessToken;
            state.isAuthenticated = true;
            state.username = action.payload.username;
            state.challengeName = null; // Clear challenge on successful login
            state.user = null; //clear user data
            // Set the refresh token as an httpOnly cookie
            Cookies.set('refreshToken', action.payload.refreshToken, {
                secure: true,  // Only send over HTTPS
                httpOnly: true, // Inaccessible to JavaScript
                sameSite: 'strict', // Protect against CSRF
                expires: 7, // Expires in 7 days (adjust as needed)
                path: '/',    // Available on all paths
             });
        },
        logoutSuccess: (state) => {
            state.accessToken = null;
            state.isAuthenticated = false;
            state.username = null;
            state.challengeName = null; // Clear on logout
            state.user = null;
            Cookies.remove('refreshToken', { path: '/', secure: true, sameSite: 'strict' });
        },
        // You can add other reducers here (e.g., for handling token refresh)
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
        },
        setChallengeName: (state, action) => { // Add this reducer
            state.challengeName = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        }
    },
});

export const { loginSuccess, logoutSuccess, setAccessToken, setChallengeName, setUser } = authSlice.actions;
export default authSlice.reducer;