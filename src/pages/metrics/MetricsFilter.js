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
const OPTION_PAGE_SIZE = 50;
// Keeps all previously loaded autocomplete pages available while navigating
// between metrics screens, since the shared Redux cache only stores one page.
const metricsFilterOptionCache = new Map();

const getEmptyOptionCache = () => ({
  providers: [],
  users: [],
  collections: [],
});

const getOptionCacheForNgroup = (ngroupId) => {
  if (!ngroupId) {
    return getEmptyOptionCache();
  }

  return metricsFilterOptionCache.get(ngroupId) || getEmptyOptionCache();
};

function MetricsFilter({ onApplyFilters, onClearFilters, isDataLoading }) {
  const dispatch = useDispatch();
  const { activeNgroupId } = useAuth();

  // Read data and status from the new dataCacheSlice
  const { 
    providers, 
    users, 
    collections 
  } = useSelector((state) => state.dataCache);

  const [mergedProviders, setMergedProviders] = useState(() => getOptionCacheForNgroup(activeNgroupId).providers);
  const [mergedUsers, setMergedUsers] = useState(() => getOptionCacheForNgroup(activeNgroupId).users);
  const [mergedCollections, setMergedCollections] = useState(() => getOptionCacheForNgroup(activeNgroupId).collections);
  const [providerLoadingPages, setProviderLoadingPages] = useState(new Set());
  const [userLoadingPages, setUserLoadingPages] = useState(new Set());
  const [collectionLoadingPages, setCollectionLoadingPages] = useState(new Set());
  const [providerOpen, setProviderOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);

  const loadingOptions = providers.status === 'loading' || users.status === 'loading' || collections.status === 'loading';
  const isInitialOptionsLoading =
    (providers.status === 'loading' && mergedProviders.length === 0) ||
    (users.status === 'loading' && mergedUsers.length === 0) ||
    (collections.status === 'loading' && mergedCollections.length === 0);

  useEffect(() => {
    if (activeNgroupId) {
      if (providers.status === 'idle') {
        dispatch(fetchProviders({ page: 1, pageSize: OPTION_PAGE_SIZE }));
      }
      if (users.status === 'idle') {
        dispatch(fetchUsers({ page: 1, pageSize: OPTION_PAGE_SIZE }));
      }
      if (collections.status === 'idle') {
        dispatch(fetchCollections({ page: 1, pageSize: OPTION_PAGE_SIZE }));
      }
    }
  }, [activeNgroupId, providers.status, users.status, collections.status, dispatch]);

  useEffect(() => {
    if (!activeNgroupId) {
      setMergedProviders([]);
      setMergedUsers([]);
      setMergedCollections([]);
      setProviderLoadingPages(new Set());
      setUserLoadingPages(new Set());
      setCollectionLoadingPages(new Set());
      setProviderOpen(false);
      setUserOpen(false);
      setCollectionOpen(false);
      return;
    }

    // Rehydrate previously scrolled options when this filter remounts on
    // another metrics page, so the dropdown doesn't collapse back to one page.
    const cachedOptions = getOptionCacheForNgroup(activeNgroupId);
    setMergedProviders(cachedOptions.providers);
    setMergedUsers(cachedOptions.users);
    setMergedCollections(cachedOptions.collections);
  }, [activeNgroupId]);

  useEffect(() => {
    if (!providers.data) return;

    setProviderLoadingPages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(providers.page);
      return newSet;
    });

    setMergedProviders((prev) => {
      const mergedMap = new Map(prev.map((item) => [item.id, item]));
      providers.data.forEach((item) => mergedMap.set(item.id, item));
      const nextProviders = Array.from(mergedMap.values());
      // Persist the merged list outside component state so other metrics pages
      // can reuse everything loaded so far.
      metricsFilterOptionCache.set(activeNgroupId, {
        ...getOptionCacheForNgroup(activeNgroupId),
        providers: nextProviders,
      });
      return nextProviders;
    });
  }, [providers.data, providers.page, activeNgroupId]);

  useEffect(() => {
    if (!users.data) return;

    setUserLoadingPages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(users.page);
      return newSet;
    });

    setMergedUsers((prev) => {
      const mergedMap = new Map(prev.map((item) => [item.id, item]));
      users.data.forEach((item) => mergedMap.set(item.id, item));
      const nextUsers = Array.from(mergedMap.values());
      // Persist the merged list outside component state so other metrics pages
      // can reuse everything loaded so far.
      metricsFilterOptionCache.set(activeNgroupId, {
        ...getOptionCacheForNgroup(activeNgroupId),
        users: nextUsers,
      });
      return nextUsers;
    });
  }, [users.data, users.page, activeNgroupId]);

  useEffect(() => {
    if (!collections.data) return;

    setCollectionLoadingPages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(collections.page);
      return newSet;
    });

    setMergedCollections((prev) => {
      const mergedMap = new Map(prev.map((item) => [item.id, item]));
      collections.data.forEach((item) => mergedMap.set(item.id, item));
      const nextCollections = Array.from(mergedMap.values());
      // Persist the merged list outside component state so other metrics pages
      // can reuse everything loaded so far.
      metricsFilterOptionCache.set(activeNgroupId, {
        ...getOptionCacheForNgroup(activeNgroupId),
        collections: nextCollections,
      });
      return nextCollections;
    });
  }, [collections.data, collections.page, activeNgroupId]);

  const handleAutocompleteScroll = (event, entityState, mergedData, loadingPages, setLoadingPages, fetchAction) => {
    const listbox = event.currentTarget;
    const atBottom = listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 20;

    if (!atBottom) return;
    if (mergedData.length >= entityState.total) return;

    // Ask the shared cache for the next backend page, then merge that page into
    // the local session list when it arrives.
    const nextPage = Math.floor(mergedData.length / entityState.pageSize) + 1;
    if (loadingPages.has(nextPage)) return;

    setLoadingPages((prev) => new Set(prev).add(nextPage));
    dispatch(fetchAction({ page: nextPage, pageSize: entityState.pageSize || OPTION_PAGE_SIZE }));
  };

  const handleAutocompleteClose = (setOpen, loadingPages) => (event, reason) => {
    // Ignore blur closes during infinite-scroll fetches so the dropdown stays
    // open while the next page is appended.
    if (reason === 'blur' && loadingPages.size > 0) {
      return;
    }

    setOpen(false);
  };

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
              open={providerOpen}
              onOpen={() => setProviderOpen(true)}
              onClose={handleAutocompleteClose(setProviderOpen, providerLoadingPages)}
              options={mergedProviders}
              getOptionLabel={(o) => o.short_name || ''}
              value={selectedProvider}
              onChange={(e, v) => setSelectedProvider(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              ListboxProps={{
                onScroll: (event) =>
                  handleAutocompleteScroll(
                    event,
                    providers,
                    mergedProviders,
                    providerLoadingPages,
                    setProviderLoadingPages,
                    fetchProviders
                  ),
              }}
              renderInput={(params) => (
                <TextField {...params} label="Provider" size="small" />
              )}
              loading={providers.status === 'loading' && mergedProviders.length > 0}
              disabled={isInitialOptionsLoading || !activeNgroupId}
            />
          </Grid>
          <Grid item sx={{ flexGrow: 1, minWidth: '200px' }}>
            <Autocomplete
              fullWidth
              open={userOpen}
              onOpen={() => setUserOpen(true)}
              onClose={handleAutocompleteClose(setUserOpen, userLoadingPages)}
              options={mergedUsers}
              getOptionLabel={(o) => o.name || ''}
              value={selectedUser}
              onChange={(e, v) => setSelectedUser(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              ListboxProps={{
                onScroll: (event) =>
                  handleAutocompleteScroll(
                    event,
                    users,
                    mergedUsers,
                    userLoadingPages,
                    setUserLoadingPages,
                    fetchUsers
                  ),
              }}
              renderInput={(params) => (
                <TextField {...params} label="User" size="small" />
              )}
              loading={users.status === 'loading' && mergedUsers.length > 0}
              disabled={isInitialOptionsLoading || !activeNgroupId}
            />
          </Grid>
          <Grid item sx={{ flexGrow: 1, minWidth: '200px' }}>
            <Autocomplete
              fullWidth
              open={collectionOpen}
              onOpen={() => setCollectionOpen(true)}
              onClose={handleAutocompleteClose(setCollectionOpen, collectionLoadingPages)}
              options={mergedCollections}
              getOptionLabel={(o) => o.short_name || ''}
              value={selectedCollection}
              onChange={(e, v) => setSelectedCollection(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              ListboxProps={{
                onScroll: (event) =>
                  handleAutocompleteScroll(
                    event,
                    collections,
                    mergedCollections,
                    collectionLoadingPages,
                    setCollectionLoadingPages,
                    fetchCollections
                  ),
              }}
              renderInput={(params) => (
                <TextField {...params} label="Collection" size="small" />
              )}
              loading={collections.status === 'loading' && mergedCollections.length > 0}
              disabled={isInitialOptionsLoading || !activeNgroupId}
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

