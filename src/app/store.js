// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/authSlice'; // Import the auth reducer
import filterOptionsReducer from './reducers/filterOptionsSlice';

const store = configureStore({
    reducer: {
        auth: authReducer, // Add the auth reducer to the store
        filterOptions: filterOptionsReducer,
    },
    // Add middleware or enhancers here, if needed.
});

export default store;