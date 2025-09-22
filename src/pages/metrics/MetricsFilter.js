// src/pages/metrics/MetricsFilter.js

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Autocomplete,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import useAuth from '../../hooks/useAuth';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import { fetchFilterOptions } from '../../app/reducers/filterOptionsSlice';

const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();

function MetricsFilter({ onApplyFilters, onClearFilters, isDataLoading }) {
  const dispatch = useDispatch();
  const { activeNgroupId, accessToken } = useAuth();

  const {
    providers,
    users,
    collections,
    status: optionsStatus,
  } = useSelector((state) => state.filterOptions);
  const loadingOptions = optionsStatus === 'loading';

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);

  useEffect(() => {
    if (optionsStatus === 'idle' && activeNgroupId && accessToken) {
      dispatch(fetchFilterOptions({ accessToken, ngroupId: activeNgroupId }));
    }
  }, [optionsStatus, activeNgroupId, accessToken, dispatch]);

  const handleApplyClick = () => {
    const filters = {
      start_date: startDate ? startDate.format('YYYY-MM-DD') : null,
      end_date: endDate ? endDate.format('YYYY-MM-DD') : null,
      provider_id: selectedProvider ? selectedProvider.id : null,
      user_id: selectedUser ? selectedUser.id : null,
      collection_id: selectedCollection ? selectedCollection.id : null,
    };
    onApplyFilters(filters);
  };

  const handleClearClick = () => {
    setSelectedProvider(null);
    setSelectedUser(null);
    setSelectedCollection(null);
    setStartDate(getDefaultStartDate());
    setEndDate(getDefaultEndDate());
    onClearFilters();
  };

  return (
    <Card sx={{ marginBottom: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Metrics Filters
        </Typography>
        {!activeNgroupId && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            A DAAC must be selected to use filters.
          </Alert>
        )}

        {/* UPDATED: Manual widths and flex-grow */}
        <Grid container spacing={2} alignItems="center">
          <Grid item sx={{ flexGrow: 1 }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              maxDate={endDate}
              disabled={loadingOptions || !activeNgroupId}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid item sx={{ flexGrow: 1 }}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              minDate={startDate}
              disableFuture
              disabled={loadingOptions || !activeNgroupId}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid item sx={{ flexGrow: 1, minWidth: '200px' }}>
            <Autocomplete
              fullWidth
              options={providers}
              getOptionLabel={(o) => o.short_name || ''}
              value={selectedProvider}
              onChange={(e, v) => setSelectedProvider(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField {...params} label="Provider" size="small" />
              )}
              disabled={loadingOptions || !activeNgroupId}
            />
          </Grid>
          <Grid item sx={{ flexGrow: 1, minWidth: '200px' }}>
            <Autocomplete
              fullWidth
              options={users}
              getOptionLabel={(o) => o.name || ''}
              value={selectedUser}
              onChange={(e, v) => setSelectedUser(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField {...params} label="User" size="small" />
              )}
              disabled={loadingOptions || !activeNgroupId}
            />
          </Grid>
          <Grid item sx={{ flexGrow: 1, minWidth: '200px' }}>
            <Autocomplete
              fullWidth
              options={collections}
              getOptionLabel={(o) => o.short_name || ''}
              value={selectedCollection}
              onChange={(e, v) => setSelectedCollection(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField {...params} label="Collection" size="small" />
              )}
              disabled={loadingOptions || !activeNgroupId}
            />
          </Grid>
        </Grid>

        <Grid container justifyContent="flex-end" spacing={2} sx={{ mt: 1 }}>
          <Grid item>
            <Button
              variant="outlined"
              onClick={handleClearClick}
              startIcon={<ClearIcon />}
              disabled={loadingOptions || isDataLoading}
            >
              Clear Filters
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleApplyClick}
              startIcon={<FilterListIcon />}
              disabled={loadingOptions || isDataLoading}
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default MetricsFilter;