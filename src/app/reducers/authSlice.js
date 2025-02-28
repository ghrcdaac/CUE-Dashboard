// src/app/reducers/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
//import Cookies from 'js-cookie'; // REMOVE THIS - no cookies

const initialState = {
    accessToken: null,
    refreshToken: null, // Store refresh token in Redux
    isAuthenticated: false,
    username: null,
    challengeName: null, // Add challengeName to the state
    user: null, // to store the cognito user object
    isLoading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken; // Store refresh token
            state.isAuthenticated = true;
            state.username = action.payload.username;
            state.challengeName = null; // Clear challenge on successful login
            state.user = null; //clear user data
            state.isLoading = false;
        },
        logoutSuccess: (state) => {
            state.accessToken = null;
            state.refreshToken = null; // Clear refresh token
            state.isAuthenticated = false;
            state.username = null;
            state.challengeName = null; // Clear on logout
            state.user = null;
            state.isLoading = false;
            //Cookies.remove('refreshToken', { path: '/', secure: true, sameSite: 'strict' }); -- No cookies
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
        },
        setLoading: (state, action) => { // Add a setLoading reducer
            state.isLoading = action.payload;
        },
    },
});

export const { loginSuccess, logoutSuccess, setAccessToken, setChallengeName, setUser, setLoading  } = authSlice.actions;
export default authSlice.reducer;