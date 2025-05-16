// src/pages/Metrics.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, Grid, TextField, Button,
    Autocomplete, CircularProgress, Alert, Chip, Skeleton,
    TableSortLabel // Keep TableSortLabel if used elsewhere, removed table imports
} from '@mui/material';
// Removed Table components if not used elsewhere: Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination
// Removed visuallyHidden if not used elsewhere: import { visuallyHidden } from '@mui/utils';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Hooks & Components
import useAuth from '../hooks/useAuth';
import usePageTitle from "../hooks/usePageTitle";
import SideNav from "../components/SideNav";

// API Imports
import * as fileStatusApi from '../api/fileStatusApi';
import * as providerApi from '../api/providerApi';
import * as collectionApi from '../api/collectionApi';
import { listCueusers } from '../api/cueUser';

// Icons
import FilterListIcon from '@mui/icons-material/FilterList';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ClearIcon from '@mui/icons-material/Clear';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';

// --- Constants ---
const DATE_FORMAT_API_DAYJS = 'YYYY-MM-DD';

// --- Helper Functions ---
const formatBytes = (bytes, decimals = 2) => {
    if (bytes == null || bytes === 0) return '0 Bytes';
    if (typeof bytes !== 'number' || isNaN(bytes)) return 'N/A';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();

const getErrorMessage = (reason) => {
    if (reason instanceof Error) return reason.message;
    if (typeof reason === 'string') return reason;
    try { return JSON.stringify(reason); } catch { return 'An unknown error occurred.'; }
};

// --- Status Colors ---
const statusColors = {
  infected: '#ffcdd2', // light red (MUI red[100])
  clean: '#c8e6c9', // light green (MUI green[100])
  distributed: '#c8e6c9', // light green (MUI green[100])
  scan_failed: '#ffecb3', // light orange/amber (MUI amber[100])
  unscanned: '#fff9c4', // light yellow (MUI yellow[100])
  default: '#f5f5f5' // default grey (MUI grey[100])
};

const getStatusColor = (status) => {
    return statusColors[status?.toLowerCase()] || statusColors.default;
}

// --- Component ---
function Metrics() {
    usePageTitle("Metrics Overview"); // Changed title via hook if preferred
    const { accessToken, logout } = useAuth();
    const ngroupId = useMemo(() => localStorage.getItem('CUE_ngroup_id'), []);
    const hasNgroupId = useMemo(() => !!ngroupId, [ngroupId]);

    // --- State --- (Keep state variables as before)
    const [openSideNav, setOpenSideNav] = useState(true);
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
    const [dailyVolumeData, setDailyVolumeData] = useState([]);
    const [dailyCountData, setDailyCountData] = useState([]);
    const [statusCountsData, setStatusCountsData] = useState([]); // Expecting [{ status: '...', count: ... }] after fetch processing
    const [overallVolumeData, setOverallVolumeData] = useState(null); // Expecting { total_volume_gb: ... } after fetch processing
    const [overallCountData, setOverallCountData] = useState(null); // Expecting { total_count: ... } after fetch processing
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [errorMetrics, setErrorMetrics] = useState(null);
    const [metricsFetched, setMetricsFetched] = useState(false);

    // --- Side Navigation ---
    const handleToggleSideNav = () => { setOpenSideNav(!openSideNav); };
    // --- CHANGE: Updated SideNav Title ---
    const metricsMenuItems = [
        { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
        { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
        { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> }
    ];

    // --- Data Fetching Callbacks --- (fetchFilterOptions remains the same)
    const fetchFilterOptions = useCallback(async () => {
        if (!ngroupId || !accessToken) return;
        setLoadingOptions(true); setErrorOptions(null); let optionsLoaded = false;
        try { /* ... fetch options ... */
            const [providers, users, collections] = await Promise.all([
                providerApi.listProviders(accessToken, { ngroup_id: ngroupId }),
                listCueusers(ngroupId, accessToken),
                collectionApi.listCollections(ngroupId, accessToken)
            ]);
            setProviderOptions(providers || []); setUserOptions(users || []); setCollectionOptions(collections || []);
            optionsLoaded = true;
        } catch (error) { /* ... error handling ... */
            console.error("Error fetching filter options:", error); const message = `Failed to load filter options: ${getErrorMessage(error)}`; setErrorOptions(message); toast.error(message);
        } finally {
            setLoadingOptions(false);
            if (optionsLoaded && startDate?.isValid() && endDate?.isValid()) {
                fetchMetrics(false, true); // Trigger initial fetch
            }
        }
    }, [accessToken, ngroupId]); // Removed date dependency

    const fetchMetrics = useCallback(async (applyOptionalFilters = false, isInitialLoad = false) => {
      console.log("--- Triggering fetchMetrics (Summary Endpoint) ---");
      console.log("Initial Load:", isInitialLoad, "| Apply Optional Filters:", applyOptionalFilters);
  
      // --- Validation --- (Remains the same)
      if (!ngroupId) { /* ... handle missing ngroupId ... */ return; }
      if (!accessToken) { /* ... handle missing token ... */ return; }
      const useDates = applyOptionalFilters || isInitialLoad;
      if (useDates && (!startDate?.isValid() || !endDate?.isValid())) { /* ... handle invalid dates ... */ return; }
  
      setLoadingMetrics(true);
      setErrorMetrics(null);
      setMetricsFetched(true);
      // Reset data states
      setDailyVolumeData([]); setDailyCountData([]); setStatusCountsData([]);
      setOverallCountData(null); setOverallVolumeData(null);
  
      // --- Parameter Construction (Remains the same) ---
      const metricsParams = { ngroup_id: ngroupId };
      if (useDates) {
          metricsParams.start_date = startDate.format(DATE_FORMAT_API_DAYJS);
          metricsParams.end_date = endDate.format(DATE_FORMAT_API_DAYJS);
      }
      if (applyOptionalFilters) {
          if (selectedProvider) metricsParams.provider_id = selectedProvider.id;
          if (selectedUser) metricsParams.user_id = selectedUser.id;
          if (selectedCollection) metricsParams.collection_id = selectedCollection.id;
      }
      console.log("Params for Metrics Summary API Call:", metricsParams);
      // --- End Parameter Construction ---
  
      try {
          // --- CHANGE: Call the single summary endpoint ---
          const summaryData = await fileStatusApi.getMetricsSummary(metricsParams, accessToken);
          console.log("--- Received Metrics Summary Data ---");
          console.dir(summaryData, { depth: null }); // Log the full response
  
          // --- CHANGE: Process the single summary response ---
          if (summaryData) {
              // Daily Volume
              if (summaryData.daily_volume && Array.isArray(summaryData.daily_volume)) {
                  setDailyVolumeData(summaryData.daily_volume);
              } else { console.warn("Unexpected format for daily_volume", summaryData.daily_volume); setDailyVolumeData([]); }
  
              // Daily Count
              if (summaryData.daily_count && Array.isArray(summaryData.daily_count)) {
                  setDailyCountData(summaryData.daily_count);
              } else { console.warn("Unexpected format for daily_count", summaryData.daily_count); setDailyCountData([]); }
  
              // Status Counts (Transform object to array)
              if (summaryData.status_counts && typeof summaryData.status_counts === 'object' && !Array.isArray(summaryData.status_counts)) {
                  const transformed = Object.entries(summaryData.status_counts).map(([st, ct]) => ({ status: st, count: ct }));
                  setStatusCountsData(transformed);
              } else { console.warn("Unexpected format for status_counts", summaryData.status_counts); setStatusCountsData([]); }
  
              // Overall Count (Extract value)
              if (summaryData.overall_count && typeof summaryData.overall_count.value === 'number') {
                  setOverallCountData({ total_count: summaryData.overall_count.value });
              } else { console.warn("Unexpected format for overall_count", summaryData.overall_count); setOverallCountData(null); }
  
              // Overall Volume (Extract value)
              if (summaryData.overall_volume && typeof summaryData.overall_volume.value === 'number') {
                  setOverallVolumeData({ total_volume_gb: summaryData.overall_volume.value });
              } else { console.warn("Unexpected format for overall_volume", summaryData.overall_volume); setOverallVolumeData(null); }
  
              if (!isInitialLoad) {
                   toast.success("Metrics loaded successfully!");
              }
          } else {
              // Handle case where API call succeeded but returned null/undefined unexpectedly
               console.warn("Metrics summary API returned no data.");
               // Set empty/null states explicitly? Already done at the start.
          }
           // Clear any previous errors if successful
           setErrorMetrics(null);
  
      } catch (error) { // Catch errors from getMetricsSummary call
          console.error("Error fetching metrics summary:", error);
          const message = `Failed to load metrics: ${getErrorMessage(error)}`;
          setErrorMetrics(message);
          // Clear all data states on error?
          setDailyVolumeData([]); setDailyCountData([]); setStatusCountsData([]);
          setOverallCountData(null); setOverallVolumeData(null);
      } finally {
          setLoadingMetrics(false);
          console.log("--- fetchMetrics Finished ---");
      }
  // Dependencies remain the same as they influence the params object
  }, [accessToken, startDate, endDate, selectedProvider, selectedUser, selectedCollection, ngroupId]);

    // --- Effects --- 
    useEffect(() => {
        if (ngroupId) { fetchFilterOptions(); }
        else { setErrorOptions("Ngroup ID not found. Please log in again."); }
    }, [fetchFilterOptions, ngroupId]);

    // --- Event Handlers --- 
    const handleApplyFilters = () => { fetchMetrics(true, false); };
    const handleClearFilters = () => {
        setSelectedProvider(null); setSelectedUser(null); setSelectedCollection(null);
        setStartDate(getDefaultStartDate()); setEndDate(getDefaultEndDate());
        setErrorMetrics(null); setMetricsFetched(false);
        // Clear data? Optional - let's clear for consistency on Clear action
        setDailyVolumeData([]); setDailyCountData([]); setStatusCountsData([]);
        setOverallCountData(null); setOverallVolumeData(null);
        toast.info("Filters cleared. Loading default NGROUP overview...");
        fetchMetrics(false, true); // Reload default overview
    };

    // Removed files table handlers

    // --- Tooltip Formatter ---
    const volumeTooltipFormatter = (value, name, props) => {
        // Ensure value is a number before formatting
        if (typeof value === 'number') {
            return [`${value.toFixed(2)} GB`, name]; // Format to 2 decimal places
        }
        return [value, name]; // Return original value if not a number
    };
    const countTooltipFormatter = (value, name, props) => {
        // Ensure value is a number before formatting (though counts usually are integers)
        if (typeof value === 'number') {
            return [value.toLocaleString(), name]; // Format count with commas
        }
        return [value, name];
    };


     // --- Render ---
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)'  }}> {/* Adjust minHeight based on header */}
                <SideNav menuItems={metricsMenuItems} open={openSideNav} onToggle={handleToggleSideNav} />

                <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f4f6f8' }}>
                    {/* Filter Card */}
                    <Card sx={{ marginBottom: 3 }}>
                        <CardContent>
                             {/* ... Filter Title, Alerts, Grid ... */}
                             <Typography variant="h5" gutterBottom>Metrics Filters</Typography>
                             {!hasNgroupId && <Alert severity="error" sx={{ mb: 2 }}>NGROUP ID not found. Cannot load filters or metrics.</Alert>}
                             {errorOptions && <Alert severity="error" sx={{ mb: 2 }}>{errorOptions}</Alert>}
                             <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={6} md={3}> <DatePicker label="Start Date" value={startDate} onChange={setStartDate} maxDate={endDate || undefined} disabled={loadingOptions || !hasNgroupId} slotProps={{ textField: { fullWidth: true, size: 'small' } }} /> </Grid>
                                <Grid item xs={12} sm={6} md={3}> <DatePicker label="End Date" value={endDate} onChange={setEndDate} minDate={startDate || undefined} disableFuture disabled={loadingOptions || !hasNgroupId} slotProps={{ textField: { fullWidth: true, size: 'small' } }}/> </Grid>
                                <Grid item xs={12} sm={6} md={2}> <Autocomplete options={providerOptions} getOptionLabel={(o) => o?.short_name || ''} value={selectedProvider} onChange={(e, v) => setSelectedProvider(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="Provider" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /> </Grid>
                                <Grid item xs={12} sm={6} md={2}> <Autocomplete options={userOptions} getOptionLabel={(o) => o?.name || o?.email || ''} value={selectedUser} onChange={(e, v) => setSelectedUser(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="User" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /> </Grid>
                                <Grid item xs={12} sm={6} md={2}> <Autocomplete options={collectionOptions} getOptionLabel={(o) => o?.short_name || ''} value={selectedCollection} onChange={(e, v) => setSelectedCollection(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="Collection" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /> </Grid>
                                <Grid item xs={12} sm={12} md={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                     <Button variant="outlined" onClick={handleClearFilters} startIcon={<ClearIcon />} disabled={loadingMetrics || loadingOptions || !hasNgroupId}> Clear Filters </Button>
                                     <Button variant="contained" onClick={handleApplyFilters} startIcon={<FilterListIcon />} disabled={loadingMetrics || loadingOptions || !hasNgroupId || !startDate?.isValid() || !endDate?.isValid()}> Apply Filters </Button>
                                </Grid>
                                {loadingOptions && hasNgroupId && <Grid item xs={12}><CircularProgress size={20} /> Loading filter options...</Grid>}
                             </Grid>
                        </CardContent>
                    </Card>

                    {/* Metrics Overview Section */}
                    <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>Metrics Overview</Typography>
                     {loadingMetrics && ( /* ... Skeletons ... */ <Grid container spacing={3} sx={{ mb: 3 }}><Grid item xs={12} md={6} lg={3}><Skeleton variant="rounded" height={100} /></Grid><Grid item xs={12} md={6} lg={3}><Skeleton variant="rounded" height={100} /></Grid><Grid item xs={12} md={6} lg={6}><Skeleton variant="rounded" height={100} /></Grid><Grid item xs={12} lg={6}><Skeleton variant="rounded" height={350} /></Grid><Grid item xs={12} lg={6}><Skeleton variant="rounded" height={350} /></Grid></Grid> )}
                     {errorMetrics && !loadingMetrics && <Alert severity="warning" sx={{ my: 2 }}>{errorMetrics}</Alert>}
                     {!hasNgroupId && <Alert severity="error">NGROUP ID not found. Cannot load metrics.</Alert>}
                     {!metricsFetched && !loadingMetrics && !errorMetrics && hasNgroupId && <Alert severity="info">Loading initial metrics...</Alert>}
                     {metricsFetched && !errorMetrics && !loadingMetrics && (
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {/* --- CHANGE: Added height: 100% to Cards in first row --- */}
                           <Grid item xs={12} md={6} lg={3}><Card sx={{ height: '100%' }}><CardContent><Typography variant="subtitle1" color="text.secondary" gutterBottom>Total Volume</Typography><Typography variant="h4">{overallVolumeData && typeof overallVolumeData.total_volume_gb === 'number' ? formatBytes(overallVolumeData.total_volume_gb * 1024 * 1024 * 1024) : 'N/A'}</Typography></CardContent></Card></Grid>
                           <Grid item xs={12} md={6} lg={3}><Card sx={{ height: '100%' }}><CardContent><Typography variant="subtitle1" color="text.secondary" gutterBottom>Total Files</Typography><Typography variant="h4">{overallCountData && typeof overallCountData.total_count === 'number' ? overallCountData.total_count.toLocaleString() : 'N/A'}</Typography></CardContent></Card></Grid>
                           <Grid item xs={12} md={12} lg={6}> {/* Changed md span for Status Card */}
                               <Card sx={{ height: '100%' }}>
                                     <CardContent>
                                          <Typography variant="subtitle1" color="text.secondary" gutterBottom>Status Distribution</Typography>
                                          {statusCountsData && statusCountsData.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', /* Center vertically? */ minHeight: 50 /* Ensure some min height */ }}>
                                                 {/* --- CHANGE: Updated Chip styling --- */}
                                                 {statusCountsData.map(item => (
                                                      <Chip key={item.status} label={`${item.status}: ${item.count.toLocaleString()}`} sx={{ backgroundColor: getStatusColor(item.status), fontWeight: 500 }} />
                                                 ))}
                                            </Box>
                                           ) : (
                                               <Typography variant="body2" color="text.secondary">No status count data available.</Typography>
                                           )}
                                     </CardContent>
                                </Card>
                             </Grid>
                             {/* Charts remain in the next row */}
                             <Grid item xs={12} lg={6}>
                                 <Card>
                                     <CardContent>
                                         <Typography variant="subtitle1" color="text.secondary" gutterBottom>Daily Volume (GB)</Typography>
                                         {dailyVolumeData.length > 0 ? (
                                             <ResponsiveContainer width="100%" height={300}>
                                                 <LineChart data={dailyVolumeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                     <CartesianGrid strokeDasharray="3 3" />
                                                     <XAxis dataKey="day" />
                                                     <YAxis />
                                                     {/* --- CHANGE: Added formatter to Tooltip --- */}
                                                     <Tooltip formatter={volumeTooltipFormatter} />
                                                     <Legend />
                                                     <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} name="Volume (GB)"/>
                                                 </LineChart>
                                             </ResponsiveContainer>
                                         ) : (<Typography variant="body2" color="text.secondary">No daily volume data available for selected period/filters.</Typography>)}
                                     </CardContent>
                                 </Card>
                             </Grid>
                             <Grid item xs={12} lg={6}>
                                 <Card>
                                     <CardContent>
                                         <Typography variant="subtitle1" color="text.secondary" gutterBottom>Daily File Count</Typography>
                                          {dailyCountData.length > 0 ? (
                                             <ResponsiveContainer width="100%" height={300}>
                                                 <LineChart data={dailyCountData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                     <CartesianGrid strokeDasharray="3 3" />
                                                     <XAxis dataKey="day" />
                                                     <YAxis />
                                                     {/* --- CHANGE: Added formatter to Tooltip (optional but good practice) --- */}
                                                     <Tooltip formatter={countTooltipFormatter} />
                                                     <Legend />
                                                     <Line type="monotone" dataKey="value" stroke="#82ca9d" activeDot={{ r: 8 }} name="Files"/>
                                                 </LineChart>
                                             </ResponsiveContainer>
                                          ) : (<Typography variant="body2" color="text.secondary">No daily file count data available for selected period/filters.</Typography>)}
                                     </CardContent>
                                 </Card>
                             </Grid>
                        </Grid>
                     )}

                    {/* Files by Status Section Removed */}

                    <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
                </Box>
            </Box>
        </LocalizationProvider>
    );
}

export default Metrics;