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
  async (_, { rejectWithValue }) => {
    try {
      const response = await providerApi.listProviders();
      return response || [];
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'dataCache/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await listCueusers();
      return response || [];
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

export const fetchCollections = createAsyncThunk(
  'dataCache/fetchCollections',
  async (_, { rejectWithValue }) => {
    try {
      const response = await collectionApi.listCollections();
      return response || [];
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

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
  async (_, { rejectWithValue }) => {
    try {
      const response = await egressApi.listEgresses();
      return response || [];
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

// --- Initial State ---

const initialState = {
  providers: { data: [], status: 'idle' }, // status: 'idle' | 'loading' | 'succeeded' | 'failed'
  users: { data: [], status: 'idle' },
  collections: { data: [], status: 'idle' },
  roles: { data: [], status: 'idle' },
  egresses: { data: [], status: 'idle' },
  error: null,
};

// --- The Slice ---

const dataCacheSlice = createSlice({
  name: 'dataCache',
  initialState,
  reducers: {
    // Action to reset the cache, e.g., when the activeNgroupId changes
    resetCache: (state) => {
      state.providers = { data: [], status: 'idle' };
      state.users = { data: [], status: 'idle' };
      state.collections = { data: [], status: 'idle' };
      state.roles = { data: [], status: 'idle' };
      state.egresses = { data: [], status: 'idle' };
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

    builder
      .addCase(fetchProviders.pending, handlePending)
      .addCase(fetchProviders.fulfilled, handleFulfilled)
      .addCase(fetchProviders.rejected, handleRejected)
      .addCase(fetchUsers.pending, handlePending)
      .addCase(fetchUsers.fulfilled, handleFulfilled)
      .addCase(fetchUsers.rejected, handleRejected)
      .addCase(fetchCollections.pending, handlePending)
      .addCase(fetchCollections.fulfilled, handleFulfilled)
      .addCase(fetchCollections.rejected, handleRejected)
      .addCase(fetchRoles.pending, handlePending)
      .addCase(fetchRoles.fulfilled, handleFulfilled)
      .addCase(fetchRoles.rejected, handleRejected)
      .addCase(fetchEgresses.pending, handlePending)
      .addCase(fetchEgresses.fulfilled, handleFulfilled)
      .addCase(fetchEgresses.rejected, handleRejected);
  },
});

export const { resetCache } = dataCacheSlice.actions;

export default dataCacheSlice.reducer;
