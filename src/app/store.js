// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/authSlice'; 
import filterOptionsReducer from './reducers/filterOptionsSlice';
import dataCacheReducer from './reducers/dataCacheSlice';

const store = configureStore({
    reducer: {
        auth: authReducer, 
        filterOptions: filterOptionsReducer,
        dataCache: dataCacheReducer,
    },
    // Add middleware or enhancers here, if needed.
});

export default store;