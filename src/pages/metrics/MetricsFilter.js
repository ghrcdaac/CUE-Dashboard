import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Card, CardContent, Typography, Grid, TextField, Button,
    Autocomplete, CircularProgress, Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hooks & Components
import useAuth from '../../hooks/useAuth'; // Adjusted path
import usePageTitle from "../../hooks/usePageTitle"; // Adjusted path

// API Imports
import * as providerApi from '../../api/providerApi'; // Adjusted path
import * as collectionApi from '../../api/collectionApi'; // Adjusted path
import { listCueusers } from '../../api/cueUser'; // Adjusted path

// Icons
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

// --- Constants ---
const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();
const getErrorMessage = (reason) => {
    if (reason instanceof Error) return reason.message;
    if (typeof reason === 'string') return reason;
    try { return JSON.stringify(reason); } catch { return 'An unknown error occurred.'; }
};

// --- Component ---
function MetricsFilter({handleDataFilter, clearData}) {
    usePageTitle("Files by Status");
    const { accessToken } = useAuth();
    const ngroupId = useMemo(() => localStorage.getItem('CUE_ngroup_id'), []);
    const hasNgroupId = useMemo(() => !!ngroupId, [ngroupId]);

    // --- State ---
    const [providerOptions, setProviderOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [collectionOptions, setCollectionOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [errorOptions, setErrorOptions] = useState(null);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [startDate, setStartDate] = useState(getDefaultStartDate);
    const [endDate, setEndDate] = useState(getDefaultEndDate);
    

    // --- Data Fetching Callbacks ---
    // Fetches file list based on current state
    const loadData = useCallback(async () => {
        if (!accessToken || !ngroupId) return;
        handleDataFilter(
            {
                provider: selectedProvider,
                user: selectedUser,
                collection: selectedCollection,
                startDate: startDate,
                endDate: endDate
            });
    }, [accessToken, ngroupId, selectedProvider, selectedUser, selectedCollection, startDate, endDate]); 
    
    // Fetches filter dropdown options
    const fetchFilterOptions = useCallback(async () => {
            if (!ngroupId || !accessToken) return;
            setLoadingOptions(true); setErrorOptions(null);
            try {
                const [providers, users, collections] = await Promise.all([
                    providerApi.listProviders(accessToken, { ngroup_id: ngroupId }),
                    listCueusers(ngroupId, accessToken),
                    collectionApi.listCollections(ngroupId, accessToken)
                ]);
                setProviderOptions(providers || []);
                setUserOptions(users || []);
                setCollectionOptions(collections || []);
                // Initial file fetch is now handled by a separate useEffect
            } catch (error) {
                console.error("Error fetching filter options:", error); const message = `Failed to load filter options: ${getErrorMessage(error)}`; setErrorOptions(message); toast.error(message);
            } finally { setLoadingOptions(false); }
        }, [accessToken, ngroupId]);

    // --- Event Handlers ---
    const handleApplyFilters = () => {
        loadData(); 
    };

    const handleClearFilters = () => {
        setSelectedProvider(null); setSelectedUser(null); setSelectedCollection(null);
        setStartDate(getDefaultStartDate()); setEndDate(getDefaultEndDate());
        clearData()
        toast.info("Filters cleared. Apply filters to load data.");
    };

    useEffect(() => {
        if (ngroupId) { fetchFilterOptions(); }
        else { setErrorOptions("Ngroup ID not found."); }
    }, [fetchFilterOptions, ngroupId]);

     // --- Render ---
    return (
            <Card sx={{ marginBottom: 3 }}>
                <CardContent>
                        {/* ... Filters ... */}
                    <Typography variant="h5" gutterBottom>Filter Files by Cost</Typography>
                    {!hasNgroupId && <Alert severity="error" sx={{ mb: 2 }}>NGROUP ID not found. Cannot load filters or files.</Alert>}
                    {errorOptions && <Alert severity="error" sx={{ mb: 2 }}>{errorOptions}</Alert>}
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}> <DatePicker label="Start Date" value={startDate} onChange={setStartDate} maxDate={endDate || undefined} disabled={loadingOptions || !hasNgroupId} slotProps={{ textField: { fullWidth: true, size: 'small' } }} /> </Grid>
                        <Grid item xs={12} sm={6} md={3}> <DatePicker label="End Date" value={endDate} onChange={setEndDate} minDate={startDate || undefined} disableFuture disabled={loadingOptions || !hasNgroupId} slotProps={{ textField: { fullWidth: true, size: 'small' } }}/> </Grid>
                        <Grid item xs={12} sm={6} md={2}> <Autocomplete options={providerOptions} getOptionLabel={(o) => o?.short_name || ''} value={selectedProvider} onChange={(e, v) => setSelectedProvider(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="Provider" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /> </Grid>
                        <Grid item xs={12} sm={6} md={2}> <Autocomplete options={userOptions} getOptionLabel={(o) => o?.name || o?.email || ''} value={selectedUser} onChange={(e, v) => setSelectedUser(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="User" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /> </Grid>
                        <Grid item xs={12} sm={6} md={2}> <Autocomplete options={collectionOptions} getOptionLabel={(o) => o?.short_name || ''} value={selectedCollection} onChange={(e, v) => setSelectedCollection(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="Collection" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /> </Grid>
                        <Grid item xs={12} sm={12} md={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button variant="outlined" onClick={handleClearFilters} startIcon={<ClearIcon />} disabled={ loadingOptions || !hasNgroupId}> Clear Filters </Button>
                                <Button variant="contained" onClick={handleApplyFilters} startIcon={<FilterListIcon />} disabled={loadingOptions || !hasNgroupId || !startDate?.isValid() || !endDate?.isValid()}> Apply Filters </Button>
                        </Grid>
                        {loadingOptions && hasNgroupId && <Grid item xs={12}><CircularProgress size={20} /> Loading filter options...</Grid>}
                    </Grid>
                </CardContent>
            </Card>
    );
}

export default MetricsFilter;