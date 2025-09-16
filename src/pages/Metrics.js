// src/pages/Metrics.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, Grid, TextField, Button,
    Autocomplete, CircularProgress, Alert, Chip, Skeleton
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useOutletContext } from 'react-router-dom';

// Hooks, Components & Utils
import useAuth from '../hooks/useAuth';
import usePageTitle from "../hooks/usePageTitle";
import { parseApiError } from '../utils/errorUtils';

// V2 API Imports
import * as metricsApi from '../api/fileMetricsApi';
import * as providerApi from '../api/providerApi';
import * as collectionApi from '../api/collectionApi';
import { listCueusers } from '../api/cueUser';

// Icons
import FilterListIcon from '@mui/icons-material/FilterList';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ClearIcon from '@mui/icons-material/Clear';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';

// Helper Functions
const DATE_FORMAT_API_DAYJS = 'YYYY-MM-DD';
const formatBytes = (bytes, decimals = 2) => {
    if (bytes == null || bytes === 0) return '0 Bytes';
    if (typeof bytes !== 'number' || isNaN(bytes)) return 'N/A';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();
const statusColors = {
    infected: '#ffcdd2', clean: '#c8e6c9', distributed: '#c8e6c9',
    scan_failed: '#ffecb3', unscanned: '#fff9c4', default: '#f5f5f5'
};
const getStatusColor = (status) => statusColors[status?.toLowerCase()] || statusColors.default;

function Metrics() {
    usePageTitle("Metrics Overview");
    const { activeNgroupId } = useAuth();
    const hasNgroupId = useMemo(() => !!activeNgroupId, [activeNgroupId]);

    // State for filter dropdown options
    const [providerOptions, setProviderOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [collectionOptions, setCollectionOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [errorOptions, setErrorOptions] = useState(null);

    // State for selected filter values
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [startDate, setStartDate] = useState(getDefaultStartDate);
    const [endDate, setEndDate] = useState(getDefaultEndDate);
    
    // State for metrics data
    const [dailyVolumeData, setDailyVolumeData] = useState([]);
    const [dailyCountData, setDailyCountData] = useState([]);
    const [statusCountsData, setStatusCountsData] = useState([]);
    const [overallVolumeData, setOverallVolumeData] = useState(null);
    const [overallCountData, setOverallCountData] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [errorMetrics, setErrorMetrics] = useState(null);
    const [metricsFetched, setMetricsFetched] = useState(false);
    
    const { setMenuItems } = useOutletContext();
    useEffect(() => {
        const metricsMenuItems = [
            { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
            { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
            { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> }
        ];
        setMenuItems(metricsMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    const fetchMetrics = useCallback(async (applyOptionalFilters = false, isInitialLoad = false) => {
        if (!activeNgroupId) return;
        setLoadingMetrics(true);
        setErrorMetrics(null);
        setMetricsFetched(true);
        
        const apiFilters = {
            start_date: startDate?.format(DATE_FORMAT_API_DAYJS),
            end_date: endDate?.format(DATE_FORMAT_API_DAYJS),
        };
        if (applyOptionalFilters) {
            if (selectedProvider) apiFilters.provider_id = selectedProvider.id;
            if (selectedUser) apiFilters.user_id = selectedUser.id;
            if (selectedCollection) apiFilters.collection_id = selectedCollection.id;
        }

        try {
            const summaryData = await metricsApi.getMetricsSummary(apiFilters);
            setDailyVolumeData(summaryData.daily_volume || []);
            setDailyCountData(summaryData.daily_count || []);
            setStatusCountsData(summaryData.status_counts || []);
            setOverallCountData({ total_count: summaryData.overall_count.value });
            setOverallVolumeData({ total_volume_gb: summaryData.overall_volume.value });
            if (!isInitialLoad) toast.success("Metrics loaded successfully!");
        } catch (error) {
            const friendlyError = parseApiError(error);
            setErrorMetrics(friendlyError);
            setDailyVolumeData([]); setDailyCountData([]); setStatusCountsData([]);
            setOverallCountData(null); setOverallVolumeData(null);
        } finally {
            setLoadingMetrics(false);
        }
    }, [activeNgroupId, startDate, endDate, selectedProvider, selectedUser, selectedCollection]);

    const fetchFilterOptions = useCallback(async () => {
        if (!activeNgroupId) return;
        setLoadingOptions(true);
        setErrorOptions(null);
        try {
            const [providers, users, collections] = await Promise.all([
                providerApi.listProviders(),
                listCueusers(),
                collectionApi.listCollections()
            ]);
            setProviderOptions(providers || []);
            setUserOptions(users || []);
            setCollectionOptions(collections || []);
            fetchMetrics(false, true);
        } catch (error) {
            const friendlyError = parseApiError(error);
            setErrorOptions(friendlyError);
            toast.error(`Failed to load filter options: ${friendlyError}`);
        } finally {
            setLoadingOptions(false);
        }
    }, [activeNgroupId, fetchMetrics]);

    useEffect(() => {
        if (activeNgroupId) {
            fetchFilterOptions();
        } else {
            setLoadingOptions(false);
            setErrorOptions("DAAC/NGROUP not selected. Cannot load data.");
        }
    }, [activeNgroupId, fetchFilterOptions]);

    const handleApplyFilters = () => fetchMetrics(true, false);

    const handleClearFilters = () => {
        setSelectedProvider(null);
        setSelectedUser(null);
        setSelectedCollection(null);
        setStartDate(getDefaultStartDate());
        setEndDate(getDefaultEndDate());
        setMetricsFetched(false);
        toast.info("Filters cleared. Loading default overview...");
        fetchMetrics(false, true); 
    };
    
    const volumeTooltipFormatter = (value) => [`${value.toFixed(2)} GB`, 'Volume'];
    const countTooltipFormatter = (value) => [value.toLocaleString(), 'Files'];
    
    return (
        // --- LAYOUT FIX: Added top-level Box to allow content to grow to full width ---
        <Box sx={{ flexGrow: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <ToastContainer position="top-center" autoClose={3000} />
                <Card sx={{ marginBottom: 3 }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>Metrics Filters</Typography>
                        {!hasNgroupId && <Alert severity="error" sx={{ mb: 2 }}>DAAC/NGROUP ID not found. Cannot load filters or metrics.</Alert>}
                        {errorOptions && <Alert severity="error" sx={{ mb: 2 }}>{errorOptions}</Alert>}
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6} md={3}><DatePicker label="Start Date" value={startDate} onChange={setStartDate} maxDate={endDate} disabled={loadingOptions || !hasNgroupId} slotProps={{ textField: { fullWidth: true, size: 'small' } }} /></Grid>
                            <Grid item xs={12} sm={6} md={3}><DatePicker label="End Date" value={endDate} onChange={setEndDate} minDate={startDate} disableFuture disabled={loadingOptions || !hasNgroupId} slotProps={{ textField: { fullWidth: true, size: 'small' } }} /></Grid>
                            <Grid item xs={12} sm={4} md={2}><Autocomplete options={providerOptions} getOptionLabel={(o) => o?.short_name || ''} value={selectedProvider} onChange={(e, v) => setSelectedProvider(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="Provider" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /></Grid>
                            <Grid item xs={12} sm={4} md={2}><Autocomplete options={userOptions} getOptionLabel={(o) => o?.name || o?.email || ''} value={selectedUser} onChange={(e, v) => setSelectedUser(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="User" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /></Grid>
                            <Grid item xs={12} sm={4} md={2}><Autocomplete options={collectionOptions} getOptionLabel={(o) => o?.short_name || ''} value={selectedCollection} onChange={(e, v) => setSelectedCollection(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="Collection" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /></Grid>
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button variant="outlined" onClick={handleClearFilters} startIcon={<ClearIcon />} disabled={loadingMetrics || loadingOptions || !hasNgroupId}>Clear Filters</Button>
                                <Button variant="contained" onClick={handleApplyFilters} startIcon={<FilterListIcon />} disabled={loadingMetrics || loadingOptions || !hasNgroupId || !startDate?.isValid() || !endDate?.isValid()}>Apply Filters</Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>Metrics Overview</Typography>
                {loadingMetrics ? (
                    <Grid container spacing={3}><Grid item xs={12} sm={6}><Skeleton variant="rounded" height={118} /></Grid><Grid item xs={12} sm={6}><Skeleton variant="rounded" height={118} /></Grid><Grid item xs={12}><Skeleton variant="rounded" height={118} /></Grid><Grid item xs={12} lg={6}><Skeleton variant="rounded" height={350} /></Grid><Grid item xs={12} lg={6}><Skeleton variant="rounded" height={350} /></Grid></Grid>
                ) : errorMetrics ? (
                    <Alert severity="warning" sx={{ my: 2 }}>{errorMetrics}</Alert>
                ) : metricsFetched && (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}><Card sx={{ minHeight: 118 }}><CardContent><Typography variant="subtitle1" color="text.secondary">Total Volume</Typography><Typography variant="h4">{overallVolumeData ? formatBytes(overallVolumeData.total_volume_gb * 1024 * 1024 * 1024) : 'N/A'}</Typography></CardContent></Card></Grid>
                    <Grid item xs={12} sm={6}><Card sx={{ minHeight: 118 }}><CardContent><Typography variant="subtitle1" color="text.secondary">Total Files</Typography><Typography variant="h4">{overallCountData ? overallCountData.total_count.toLocaleString() : 'N/A'}</Typography></CardContent></Card></Grid>
                    <Grid item xs={12}><Card sx={{ minHeight: 118 }}><CardContent><Typography variant="subtitle1" color="text.secondary">Status Distribution</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', pt: 1 }}>{statusCountsData.length > 0 ? (statusCountsData.map(item => (<Chip key={item.status} label={`${item.status}: ${item.count.toLocaleString()}`} sx={{ backgroundColor: getStatusColor(item.status) }} />))) : (<Typography variant="body2" color="text.secondary">No data available.</Typography>)}</Box></CardContent></Card></Grid>
                    <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="subtitle1" color="text.secondary">Daily Volume (GB)</Typography><ResponsiveContainer width="100%" height={300}>{dailyVolumeData.length > 0 ? (<LineChart data={dailyVolumeData}><CartesianGrid /><XAxis dataKey="day" /><YAxis /><Tooltip formatter={volumeTooltipFormatter} /><Legend /><Line type="monotone" dataKey="value" stroke="#8884d8" name="Volume (GB)"/></LineChart>) : (<Box sx={{height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Typography color="text.secondary">No data for this period</Typography></Box>)}</ResponsiveContainer></CardContent></Card></Grid>
                    <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="subtitle1" color="text.secondary">Daily File Count</Typography><ResponsiveContainer width="100%" height={300}>{dailyCountData.length > 0 ? (<LineChart data={dailyCountData}><CartesianGrid /><XAxis dataKey="day" /><YAxis allowDecimals={false}/><Tooltip formatter={countTooltipFormatter} /><Legend /><Line type="monotone" dataKey="value" stroke="#82ca9d" name="Files"/></LineChart>) : (<Box sx={{height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Typography color="text.secondary">No data for this period</Typography></Box>)}</ResponsiveContainer></CardContent></Card></Grid>
                </Grid>
                )}
            </LocalizationProvider>
        </Box>
    );
}

export default Metrics;