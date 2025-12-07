import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { parseApiError } from '../../utils/errorUtils';

// Import all the necessary API functions
import * as providerApi from '../../api/providerApi';
import * as collectionApi from '../../api/collectionApi';
import * as egressApi from '../../api/egressAPI';
import * as roleApi from '../../api/roleApi';
import { listCueusers } from '../../api/cueUser';

// --- Async Thunks for each data entity ---

export const fetchProviders = createAsyncThunk(
  'dataCache/fetchProviders',
  async ({ page, pageSize }, { rejectWithValue }) => {
    try {
      const response = await providerApi.listProviders(page, pageSize);
      response.cacheStart = (page - 1) * pageSize;
      response.cacheSize = pageSize
      return response;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'dataCache/fetchUsers',
  async ({ page, pageSize }, { rejectWithValue }) => {
    try {
      const response = await listCueusers(page, pageSize);
      response.cacheStart = (page - 1) * pageSize;
      response.cacheSize = pageSize
      return response;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

export const fetchCollections = createAsyncThunk( 
  'dataCache/fetchCollections', async ({ page, pageSize }, { rejectWithValue }) => {
     try { 
      const response = await collectionApi.listCollections(page, pageSize); 
      response.cacheStart = (page - 1) * pageSize;
      response.cacheSize = pageSize
      return response; // response = { collections, page, page_size, total } 
    } 
    catch (error) { 
      return rejectWithValue(parseApiError(error)); } 
  } );

export const fetchRoles = createAsyncThunk(
  'dataCache/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await roleApi.listRoles();
      return response || [];
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

export const fetchEgresses = createAsyncThunk(
  'dataCache/fetchEgresses',
  async ({ page, pageSize }, { rejectWithValue }) => {
    try {
      const response = await egressApi.listEgresses(page, pageSize);
      response.cacheStart = (page - 1) * pageSize;
      response.cacheSize = pageSize
      return response;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

// --- Initial State ---

const initialState = {
  providers: { data: [], status: 'idle', page: 1, pageSize: 50, total: 0, cacheStart: 0, cacheSize: 50}, // status: 'idle' | 'loading' | 'succeeded' | 'failed'
  users: { data: [], status: 'idle', page: 1, pageSize: 50, total: 0, cacheStart: 0, cacheSize: 50},
  collections: { data: [], page: 1, pageSize: 50, total: 0, status: 'idle', cacheStart: 0, cacheSize: 50},
  roles: { data: [], status: 'idle' },
  egresses: { data: [], status: 'idle', page: 1, pageSize: 50, total: 0, cacheStart: 0, cacheSize: 50},
  error: null,
};

// --- The Slice ---

const dataCacheSlice = createSlice({
  name: 'dataCache',
  initialState,
  reducers: {
    // Action to reset the cache, e.g., when the activeNgroupId changes
    resetCache: (state) => {
      state.providers = { data: [], status: 'idle', page: 1, pageSize: 50, total: 0, cacheStart: 0, cacheSize: 50};
      state.users = { data: [], status: 'idle', page: 1, pageSize: 50, total: 0, cacheStart: 0, cacheSize: 50};
      state.collections = { data: [], status: 'idle', page: 1, pageSize: 50, total: 0, cacheStart: 0, cacheSize: 50};
      state.roles = { data: [], status: 'idle' };
      state.egresses = { data: [], status: 'idle', page: 1, pageSize: 50, total: 0, cacheStart: 0, cacheSize: 50};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generic handler for pending state
    const handlePending = (state, action) => {
      const entity = action.type.split('/')[1].split('fetch')[1].toLowerCase(); // e.g., 'providers'
      state[entity].status = 'loading';
    };
    // Generic handler for fulfilled state
    const handleFulfilled = (state, action) => {
      const entity = action.type.split('/')[1].split('fetch')[1].toLowerCase();
      state[entity].status = 'succeeded';
      state[entity].data = action.payload;
    };
    // Generic handler for rejected state
    const handleRejected = (state, action) => {
      const entity = action.type.split('/')[1].split('fetch')[1].toLowerCase();
      state[entity].status = 'failed';
      state.error = action.payload; // Store the error message
    };

    const handlePaginationFulfilled = (state, action) => {
        const entity = action.type.split('/')[1].split('fetch')[1].toLowerCase();

        const page = action.payload.page;
        const pageSize = action.payload.page_size;
        const items = action.payload[entity];

        state[entity].status = 'succeeded';
        state[entity].data = items;
        state[entity].page = page;
        state[entity].pageSize = pageSize;
        state[entity].total = action.payload.total;
        state[entity].cacheStart = (page - 1) * pageSize;  
        state[entity].cacheSize = items.length;           
    };


    builder
      .addCase(fetchProviders.pending, handlePending)
      .addCase(fetchProviders.fulfilled, handlePaginationFulfilled)
      .addCase(fetchProviders.rejected, handleRejected)
      .addCase(fetchUsers.pending, handlePending)
      .addCase(fetchUsers.fulfilled, handlePaginationFulfilled)
      .addCase(fetchUsers.rejected, handleRejected)
      .addCase(fetchCollections.pending, handlePending)
      .addCase(fetchCollections.fulfilled, handlePaginationFulfilled)
      .addCase(fetchCollections.rejected, handleRejected)
      .addCase(fetchRoles.pending, handlePending)
      .addCase(fetchRoles.fulfilled, handleFulfilled)
      .addCase(fetchRoles.rejected, handleRejected)
      .addCase(fetchEgresses.pending, handlePending)
      .addCase(fetchEgresses.fulfilled, handlePaginationFulfilled)
      .addCase(fetchEgresses.rejected, handleRejected);
  },
});

export const { resetCache } = dataCacheSlice.actions;

export default dataCacheSlice.reducer;
