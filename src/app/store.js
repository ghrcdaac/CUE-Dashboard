// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/authSlice'; // Import the auth reducer

const store = configureStore({
    reducer: {
        auth: authReducer, // Add the auth reducer to the store
        // Add other reducers here, if you have them
    },
    // Add middleware or enhancers here, if needed.
});

export default store;