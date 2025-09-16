// src/pages/metrics/MetricsFilter.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardContent, Typography, Grid, TextField, Button,
    Autocomplete, CircularProgress, Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

import useAuth from '../../hooks/useAuth';
import * as providerApi from '../../api/providerApi';
import * as collectionApi from '../../api/collectionApi';
import { listCueusers } from '../../api/cueUser';
import { parseApiError } from '../../utils/errorUtils';

import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();

function MetricsFilter({ onApplyFilters, onClearFilters, isDataLoading }) {
    const { activeNgroupId } = useAuth();

    const [providerOptions, setProviderOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [collectionOptions, setCollectionOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [startDate, setStartDate] = useState(getDefaultStartDate);
    const [endDate, setEndDate] = useState(getDefaultEndDate);
    
    const fetchFilterOptions = useCallback(async () => {
        if (!activeNgroupId) return;
        setLoadingOptions(true);
        try {
            const [providers, users, collections] = await Promise.all([
                providerApi.listProviders(),
                listCueusers(),
                collectionApi.listCollections()
            ]);
            setProviderOptions(providers || []);
            setUserOptions(users || []);
            setCollectionOptions(collections || []);
        } catch (error) {
            toast.error(`Failed to load filter options: ${parseApiError(error)}`);
        } finally {
            setLoadingOptions(false);
        }
    }, [activeNgroupId]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    const handleApplyFilters = () => {
        const filters = {
            start_date: startDate ? startDate.format('YYYY-MM-DD') : null,
            end_date: endDate ? endDate.format('YYYY-MM-DD') : null,
            provider_id: selectedProvider ? selectedProvider.id : null,
            user_id: selectedUser ? selectedUser.id : null,
            collection_id: selectedCollection ? selectedCollection.id : null,
        };
        onApplyFilters(filters);
    };

    const handleClearFilters = () => {
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
                <Typography variant="h5" gutterBottom>Filters</Typography>
                {!activeNgroupId && <Alert severity="error" sx={{ mb: 2 }}>Cannot load filters. Please select a DAAC.</Alert>}
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}><DatePicker label="Start Date" value={startDate} onChange={setStartDate} maxDate={endDate} disabled={loadingOptions} slotProps={{ textField: { fullWidth: true, size: 'small' } }} /></Grid>
                    <Grid item xs={12} sm={6} md={3}><DatePicker label="End Date" value={endDate} onChange={setEndDate} minDate={startDate} disableFuture disabled={loadingOptions} slotProps={{ textField: { fullWidth: true, size: 'small' } }} /></Grid>
                    <Grid item xs={12} sm={6} md={2}><Autocomplete options={providerOptions} getOptionLabel={(o) => o.short_name || ''} value={selectedProvider} onChange={(e, v) => setSelectedProvider(v)} isOptionEqualToValue={(o, v) => o.id === v.id} renderInput={(params) => <TextField {...params} label="Provider" size="small" />} disabled={loadingOptions} /></Grid>
                    <Grid item xs={12} sm={6} md={2}><Autocomplete options={userOptions} getOptionLabel={(o) => o.name || ''} value={selectedUser} onChange={(e, v) => setSelectedUser(v)} isOptionEqualToValue={(o, v) => o.id === v.id} renderInput={(params) => <TextField {...params} label="User" size="small" />} disabled={loadingOptions} /></Grid>
                    <Grid item xs={12} sm={6} md={2}><Autocomplete options={collectionOptions} getOptionLabel={(o) => o.short_name || ''} value={selectedCollection} onChange={(e, v) => setSelectedCollection(v)} isOptionEqualToValue={(o, v) => o.id === v.id} renderInput={(params) => <TextField {...params} label="Collection" size="small" />} disabled={loadingOptions} /></Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button variant="outlined" onClick={handleClearFilters} startIcon={<ClearIcon />} disabled={loadingOptions || isDataLoading}>Clear</Button>
                        <Button variant="contained" onClick={handleApplyFilters} startIcon={<FilterListIcon />} disabled={loadingOptions || isDataLoading}>Apply Filters</Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

export default MetricsFilter;