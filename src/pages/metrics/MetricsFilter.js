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

// Import fetch actions from the new central data cache
import { 
    fetchProviders, 
    fetchUsers, 
    fetchCollections 
} from '../../app/reducers/dataCacheSlice';

const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();

function MetricsFilter({ onApplyFilters, onClearFilters, isDataLoading }) {
  const dispatch = useDispatch();
  const { activeNgroupId } = useAuth();

  // Read data and status from the new dataCacheSlice
  const { 
    providers, 
    users, 
    collections 
  } = useSelector((state) => state.dataCache);

  const loadingOptions = providers.status === 'loading' || users.status === 'loading' || collections.status === 'loading';

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);

  useEffect(() => {
    // Fetch each data type only if it hasn't been fetched yet for this session
    if (activeNgroupId) {
        if (providers.status === 'idle') {
            dispatch(fetchProviders());
        }
        if (users.status === 'idle') {
            dispatch(fetchUsers());
        }
        if (collections.status === 'idle') {
            dispatch(fetchCollections());
        }
    }
  }, [activeNgroupId, providers.status, users.status, collections.status, dispatch]);

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
              maxDate={dayjs()}
              disabled={loadingOptions || !activeNgroupId}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid item sx={{ flexGrow: 1, minWidth: '200px' }}>
            <Autocomplete
              fullWidth
              options={providers.data}
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
              options={users.data}
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
              options={collections.data}
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

