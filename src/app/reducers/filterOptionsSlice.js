// src/app/reducers/filterOptionsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as providerApi from '../../api/providerApi';
import * as collectionApi from '../../api/collectionApi';
import { listCueusers } from '../../api/cueUser';

// This is an async "thunk" that will fetch all options
export const fetchFilterOptions = createAsyncThunk(
  'filterOptions/fetchOptions',
  async ({ accessToken, ngroupId }, { rejectWithValue }) => {
    try {
      const [providers, users, collections] = await Promise.all([
        providerApi.listProviders(accessToken, { ngroup_id: ngroupId }),
        listCueusers(ngroupId, accessToken),
        collectionApi.listCollections(ngroupId, accessToken),
      ]);
      return { providers, users, collections };
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const initialState = {
  providers: [],
  users: [],
  collections: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const filterOptionsSlice = createSlice({
  name: 'filterOptions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFilterOptions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.providers = action.payload.providers || [];
        state.users = action.payload.users || [];
        state.collections = action.payload.collections || [];
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default filterOptionsSlice.reducer;