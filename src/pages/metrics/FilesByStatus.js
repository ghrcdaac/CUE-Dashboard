// src/pages/metrics/FilesByStatus.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // Added useRef
import {
    Box, Card, CardContent, Typography, Grid, TextField, Button,
    Autocomplete, CircularProgress, Alert, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, TablePagination,
    TableSortLabel, Tabs, Tab
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hooks & Components
import useAuth from '../../hooks/useAuth'; // Adjusted path
import usePageTitle from "../../hooks/usePageTitle"; // Adjusted path
import SideNav from "../../components/SideNav"; // Adjusted path

// API Imports
import * as fileStatusApi from '../../api/fileStatusApi'; // Adjusted path
import * as providerApi from '../../api/providerApi'; // Adjusted path
import * as collectionApi from '../../api/collectionApi'; // Adjusted path
import { listCueusers } from '../../api/cueUser'; // Adjusted path

// Icons
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';

// --- Constants ---
const FILE_STATUSES = ["unscanned", "clean", "infected", "scan_failed", "distributed"];
const DEFAULT_ROWS_PER_PAGE = 10;
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
};
const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();
const getErrorMessage = (reason) => {
    if (reason instanceof Error) return reason.message;
    if (typeof reason === 'string') return reason;
    try { return JSON.stringify(reason); } catch { return 'An unknown error occurred.'; }
};
function descendingComparator(a, b, orderBy) {
  const valA = a[orderBy] ?? ''; const valB = b[orderBy] ?? '';
  if (valB < valA) return -1; if (valB > valA) return 1; return 0;
};
function getComparator(order, orderBy) {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
};

const dateformatter = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      }).format(new Date(date))
}

// --- Component ---
function FilesByStatus() {
    usePageTitle("Files by Status");
    const { accessToken } = useAuth();
    const ngroupId = useMemo(() => localStorage.getItem('CUE_ngroup_id'), []);
    const hasNgroupId = useMemo(() => !!ngroupId, [ngroupId]);

    // --- State ---
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
    const [selectedStatusTab, setSelectedStatusTab] = useState(FILE_STATUSES[0]);
    const [filesByStatusData, setFilesByStatusData] = useState([]);
    const [filesListPage, setFilesListPage] = useState(0);
    const [filesListRowsPerPage, setFilesListRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    const [filesListTotalCount, setFilesListTotalCount] = useState(0);
    const [loadingFilesTable, setLoadingFilesTable] = useState(false);
    const [errorFilesTable, setErrorFilesTable] = useState(null);
    const [filesFetched, setFilesFetched] = useState(false); // True after first fetch attempt
    const [filesSearchTerm, setFilesSearchTerm] = useState('');
    const [filesOrder, setFilesOrder] = useState('asc');
    const [filesOrderBy, setFilesOrderBy] = useState('name');

    // Refs for pagination effect
    const prevPage = useRef(filesListPage);
    const prevRowsPerPage = useRef(filesListRowsPerPage);


    // --- Side Navigation ---
    const handleToggleSideNav = () => { setOpenSideNav(!openSideNav); };
    const metricsMenuItems = [
        { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
        { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
        { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> }
    ];

    // --- Data Fetching Callbacks ---
    // Fetches file list based on current state
    const fetchFilesByStatus = useCallback(async () => {
        if (!accessToken || !selectedStatusTab || !ngroupId || loadingFilesTable) return; // Added loadingFilesTable check

        setLoadingFilesTable(true); setErrorFilesTable(null);

        const params = {
            ngroup_id: ngroupId, status: selectedStatusTab,
            page: filesListPage + 1, page_size: filesListRowsPerPage,
        };
        if (selectedProvider) params.provider_id = selectedProvider.id;
        if (selectedUser) params.user_id = selectedUser.id;
        if (selectedCollection) params.collection_id = selectedCollection.id;
        if (startDate?.isValid()) params.start_date = startDate.format(DATE_FORMAT_API_DAYJS);
        if (endDate?.isValid()) params.end_date = endDate.format(DATE_FORMAT_API_DAYJS);

        console.log("Fetching Files with Params:", params);

        try {
            const response = await fileStatusApi.listFilesByStatus(params, accessToken);
            setFilesByStatusData(response?.items || []);
            setFilesListTotalCount(response?.total || 0);
            setFilesFetched(true); // Mark fetch attempt completed
            console.log("Files data received:", response);
        } catch (error) {
            console.error(`Error fetching files for status ${selectedStatusTab}:`, error);
            const message = `Failed to load files: ${getErrorMessage(error)}`;
            setErrorFilesTable(message); setFilesByStatusData([]); setFilesListTotalCount(0);
            setFilesFetched(true); // Still mark as fetched attempt even if error occurred
        } finally { setLoadingFilesTable(false); }
    }, [accessToken, ngroupId, selectedStatusTab, filesListPage, filesListRowsPerPage, selectedProvider, selectedUser, selectedCollection, startDate, endDate, loadingFilesTable]); // Include loadingFilesTable

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


    // --- Effects ---
    // Fetch filter options on load
    useEffect(() => {
        if (ngroupId) { fetchFilterOptions(); }
        else { setErrorOptions("Ngroup ID not found."); }
    }, [fetchFilterOptions, ngroupId]);

    // --- Effect for Initial File Fetch ---
     useEffect(() => {
        // Fetch only if we have ngroupId, accessToken, options aren't loading, and haven't fetched yet
        // Also check not currently loading files to prevent race condition on load
        if (ngroupId && accessToken && !loadingOptions && !filesFetched && !loadingFilesTable) {
             console.log(">>> Triggering Initial File Fetch <<<");
             fetchFilesByStatus();
        }
    }, [ngroupId, accessToken, loadingOptions, filesFetched, loadingFilesTable, fetchFilesByStatus]); // Dependencies control when this runs


    // Effect to reset page on filters/search/sort/tab change
    useEffect(() => {
        setFilesListPage(0);
    }, [filesSearchTerm, filesOrderBy, filesOrder, selectedStatusTab, selectedProvider, selectedUser, selectedCollection, startDate, endDate]);

    // --- Effect for fetching on page/rows change ---
   useEffect(() => {
       // Fetch only if an initial fetch/filter apply happened, not loading, AND page/rows actually changed
       if (filesFetched && !loadingFilesTable &&
           (filesListPage !== prevPage.current || filesListRowsPerPage !== prevRowsPerPage.current)
       ) {
           console.log(">>> Triggering Pagination/Rows Fetch <<<");
           prevPage.current = filesListPage; // Update refs *before* fetch call
           prevRowsPerPage.current = filesListRowsPerPage;
           fetchFilesByStatus();
       }
       // Update refs even if fetch doesn't run, to track current state for next check
       prevPage.current = filesListPage;
       prevRowsPerPage.current = filesListRowsPerPage;

   }, [filesListPage, filesListRowsPerPage, filesFetched, loadingFilesTable, fetchFilesByStatus]);


    // --- Event Handlers ---
    const handleApplyFilters = () => {
        // setFilesListPage(0); // Handled by useEffect
        fetchFilesByStatus(); // Explicitly trigger fetch with current filters
    };

    const handleClearFilters = () => {
        setSelectedProvider(null); setSelectedUser(null); setSelectedCollection(null);
        setStartDate(getDefaultStartDate()); setEndDate(getDefaultEndDate());
        setErrorFilesTable(null); setFilesByStatusData([]); setFilesListTotalCount(0);
        // setFilesListPage(0); // Handled by useEffect
        setFilesFetched(false); // Reset flag, requires Apply or initial load to fetch again
        setFilesSearchTerm(''); setFilesOrderBy('name'); setFilesOrder('asc');
        toast.info("Filters cleared. Apply filters to load data.");
    };

    const handleStatusTabChange = (event, newValue) => {
        // setFilesListPage(0); // Handled by useEffect
        setFilesSearchTerm('');
        setSelectedStatusTab(newValue);
        setFilesFetched(false); // Require Apply Filters for new tab
        setFilesByStatusData([]); // Clear old data
        setFilesListTotalCount(0);
    };
    const handleFilesPageChange = (event, newPage) => { setFilesListPage(newPage); /* Fetch handled by pagination effect */ };
    const handleFilesRowsPerPageChange = (event) => { setFilesListRowsPerPage(parseInt(event.target.value, 10)); /* Fetch handled by pagination effect */ };
    const handleFilesSearchChange = (event) => { setFilesSearchTerm(event.target.value); };
    const handleFilesRequestSort = (property) => {
        const isAsc = filesOrderBy === property && filesOrder === 'asc';
        setFilesOrder(isAsc ? 'desc' : 'asc'); setFilesOrderBy(property);
    };

    // --- Memos ---
    const collectionNameMap = useMemo(() => {
        return collectionOptions.reduce((acc, col) => { if (col && col.id) { acc[col.id] = col.short_name; } return acc; }, {});
    }, [collectionOptions]);

    const filteredAndSortedFiles = useMemo(() => {
        let filtered = [...filesByStatusData];
        if (filesSearchTerm) { const lowerSearch = filesSearchTerm.toLowerCase(); filtered = filtered.filter(file => file.name?.toLowerCase().includes(lowerSearch)); }
        filtered.sort((a, b) => { let compareResult = 0; const orderMultiplier = filesOrder === 'asc' ? 1 : -1; if (filesOrderBy === 'collection') { const nameA = collectionNameMap[a.collection_id] || ''; const nameB = collectionNameMap[b.collection_id] || ''; compareResult = nameA.localeCompare(nameB); } else if (filesOrderBy === 'size_bytes') { const sizeA = a.size_bytes ?? -Infinity; const sizeB = b.size_bytes ?? -Infinity; compareResult = sizeA - sizeB; } else { const valA = a[filesOrderBy] ?? ''; const valB = b[filesOrderBy] ?? ''; compareResult = valA.localeCompare(valB); } return compareResult * orderMultiplier; });
        return filtered;
    }, [filesByStatusData, filesSearchTerm, filesOrder, filesOrderBy, collectionNameMap]);

    const visibleFiles = useMemo(() =>
        filteredAndSortedFiles.slice( filesListPage * filesListRowsPerPage, filesListPage * filesListRowsPerPage + filesListRowsPerPage, ),
        [filteredAndSortedFiles, filesListPage, filesListRowsPerPage]
    );


     // --- Render ---
    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)'  }}>
            <SideNav menuItems={metricsMenuItems} open={openSideNav} onToggle={handleToggleSideNav} />

            <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f4f6f8' }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    {/* Filter Card */}
                    <Card sx={{ marginBottom: 3 }}>
                        <CardContent>
                             {/* ... Filters ... */}
                            <Typography variant="h5" gutterBottom>Filter Files by Status</Typography>
                            {!hasNgroupId && <Alert severity="error" sx={{ mb: 2 }}>NGROUP ID not found. Cannot load filters or files.</Alert>}
                            {errorOptions && <Alert severity="error" sx={{ mb: 2 }}>{errorOptions}</Alert>}
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={6} md={3}> <DatePicker label="Start Date" value={startDate} onChange={setStartDate} maxDate={endDate || undefined} disabled={loadingOptions || !hasNgroupId} slotProps={{ textField: { fullWidth: true, size: 'small' } }} /> </Grid>
                                <Grid item xs={12} sm={6} md={3}> <DatePicker label="End Date" value={endDate} onChange={setEndDate} minDate={startDate || undefined} disableFuture disabled={loadingOptions || !hasNgroupId} slotProps={{ textField: { fullWidth: true, size: 'small' } }}/> </Grid>
                                <Grid item xs={12} sm={6} md={2}> <Autocomplete options={providerOptions} getOptionLabel={(o) => o?.short_name || ''} value={selectedProvider} onChange={(e, v) => setSelectedProvider(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="Provider" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /> </Grid>
                                <Grid item xs={12} sm={6} md={2}> <Autocomplete options={userOptions} getOptionLabel={(o) => o?.name || o?.email || ''} value={selectedUser} onChange={(e, v) => setSelectedUser(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="User" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /> </Grid>
                                <Grid item xs={12} sm={6} md={2}> <Autocomplete options={collectionOptions} getOptionLabel={(o) => o?.short_name || ''} value={selectedCollection} onChange={(e, v) => setSelectedCollection(v)} isOptionEqualToValue={(o, v) => o?.id === v?.id} renderInput={(params) => <TextField {...params} label="Collection" size="small" />} disabled={loadingOptions || !hasNgroupId} fullWidth /> </Grid>
                                <Grid item xs={12} sm={12} md={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                     <Button variant="outlined" onClick={handleClearFilters} startIcon={<ClearIcon />} disabled={loadingFilesTable || loadingOptions || !hasNgroupId}> Clear Filters </Button>
                                     <Button variant="contained" onClick={handleApplyFilters} startIcon={<FilterListIcon />} disabled={loadingFilesTable || loadingOptions || !hasNgroupId || !startDate?.isValid() || !endDate?.isValid()}> Apply Filters </Button>
                                </Grid>
                                {loadingOptions && hasNgroupId && <Grid item xs={12}><CircularProgress size={20} /> Loading filter options...</Grid>}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Files by Status Card */}
                    <Card>
                        <CardContent>
                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>Files</Typography>
                                <TextField label="Search Files by Name" variant="outlined" size="small" value={filesSearchTerm} onChange={handleFilesSearchChange} InputProps={{ startAdornment: ( <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> ) }} sx={{ width: '300px' }} />
                             </Box>
                             <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                <Tabs value={selectedStatusTab} onChange={handleStatusTabChange} aria-label="File status tabs" variant="scrollable" scrollButtons="auto" >
                                    {FILE_STATUSES.map(status => (<Tab label={status} value={status} key={status} />))}
                                </Tabs>
                             </Box>

                             {loadingFilesTable && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
                             {errorFilesTable && !loadingFilesTable && <Alert severity="error" sx={{ my: 2 }}>{errorFilesTable}</Alert>}
                             {/* Show different message before initial fetch is complete */}
                             {!filesFetched && !loadingFilesTable && !errorFilesTable && <Alert severity="info">Loading initial files or apply filters...</Alert>}
                             {/* Render table section once first fetch attempt is done and not loading/error */}
                             {filesFetched && !errorFilesTable && !loadingFilesTable && (
                                <>
                                    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                        <Table stickyHeader sx={{ minWidth: 650 }} aria-label={`files table for status ${selectedStatusTab}`}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sortDirection={filesOrderBy === 'name' ? filesOrder : false} sx={{ bgcolor: "#E5E8EB", color: "black" }}>
                                                <TableSortLabel active={filesOrderBy === 'name'} direction={filesOrderBy === 'name' ? filesOrder : 'asc'} onClick={() => handleFilesRequestSort('name')}>
                                                    File Name
                                                    <Box component="span" sx={visuallyHidden}></Box>
                                                </TableSortLabel>
                                                </TableCell>

                                                <TableCell sortDirection={filesOrderBy === 'collection' ? filesOrder : false} sx={{ bgcolor: "#E5E8EB", color: "black" }}>
                                                <TableSortLabel active={filesOrderBy === 'collection'} direction={filesOrderBy === 'collection' ? filesOrder : 'asc'} onClick={() => handleFilesRequestSort('collection')}>
                                                    Collection
                                                    <Box component="span" sx={visuallyHidden}></Box>
                                                </TableSortLabel>
                                                </TableCell>

                                                <TableCell sortDirection={filesOrderBy === 'size_bytes' ? filesOrder : false} sx={{ bgcolor: "#E5E8EB", color: "black" }}>
                                                <TableSortLabel active={filesOrderBy === 'size_bytes'} direction={filesOrderBy === 'size_bytes' ? filesOrder : 'asc'} onClick={() => handleFilesRequestSort('size_bytes')}>
                                                    Size
                                                    <Box component="span" sx={visuallyHidden}></Box>
                                                </TableSortLabel>
                                                </TableCell>

                                                {selectedStatusTab === 'distributed' && (
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>
                                                    <TableSortLabel
                                                    active={filesOrderBy === 'egress_start'}
                                                    direction={filesOrderBy === 'egress_start' ? filesOrder : 'asc'}
                                                    onClick={() => handleFilesRequestSort('egress_start')}
                                                    >
                                                    Distributed Time
                                                    <Box component="span" sx={visuallyHidden}></Box>
                                                    </TableSortLabel>
                                                </TableCell>
                                                )}

                                                {selectedStatusTab === 'unscanned' && (
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>
                                                    <TableSortLabel
                                                    active={filesOrderBy === 'upload_time'}
                                                    direction={filesOrderBy === 'upload_time' ? filesOrder : 'asc'}
                                                    onClick={() => handleFilesRequestSort('upload_time')}
                                                    >
                                                    Upload Time
                                                    <Box component="span" sx={visuallyHidden}></Box>
                                                    </TableSortLabel>
                                                </TableCell>
                                                )}

                                                {selectedStatusTab === 'clean' && (
                                                <>
                                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>
                                                    <TableSortLabel
                                                        active={filesOrderBy === 'scan_start'}
                                                        direction={filesOrderBy === 'scan_start' ? filesOrder : 'asc'}
                                                        onClick={() => handleFilesRequestSort('scan_start')}
                                                    >
                                                        Scan Start
                                                        <Box component="span" sx={visuallyHidden}></Box>
                                                    </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>
                                                    <TableSortLabel
                                                        active={filesOrderBy === 'scan_end'}
                                                        direction={filesOrderBy === 'scan_end' ? filesOrder : 'asc'}
                                                        onClick={() => handleFilesRequestSort('scan_end')}
                                                    >
                                                        Scan End
                                                        <Box component="span" sx={visuallyHidden}></Box>
                                                    </TableSortLabel>
                                                    </TableCell>
                                                </>
                                                )}

                                                {(selectedStatusTab === 'infected' || selectedStatusTab === 'scan_failed') && (
                                                <TableCell
                                                    sx={{
                                                    bgcolor: "#E5E8EB",
                                                    color: "black",
                                                    whiteSpace: "nowrap",
                                                    minWidth: 200,
                                                    }}
                                                >
                                                    Scan Result
                                                </TableCell>
                                                )}
                                            </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {visibleFiles.length > 0 ? (
                                                    visibleFiles.map((file) => (
                                                        <TableRow hover key={file.id}>
                                                            <TableCell>{file.name || '(No Name)'}</TableCell>
                                                            <TableCell>{collectionNameMap[file.collection_id] || file.collection_id || 'N/A'}</TableCell>
                                                            <TableCell>{formatBytes(file.size_bytes)}</TableCell>
                                                            {selectedStatusTab === 'distributed' && (
                                                            <TableCell>{file.egress_start ? dateformatter(file.egress_start) : ''}</TableCell>
                                                     )}
                                                     {selectedStatusTab === 'unscanned' && (
                                                            <TableCell>{file.upload_time ? dateformatter(file.upload_time) : ''}</TableCell>
                                                     )}
                                                     {selectedStatusTab === 'clean' && (
                                                        <>
                                                            <TableCell>{file.scan_start ? dateformatter(file.scan_start) : ''}</TableCell>
                                                            <TableCell>{file.scan_end ? dateformatter(file.scan_end) : ''}</TableCell>
                                                        </>
                                                     )}
                                                     {(selectedStatusTab === 'infected' || selectedStatusTab === 'scan_failed') && (
                                                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word', minWidth: 200 }}>
                                                        {(() => {
                                                            if (!file.scan_results || file.scan_results === 'null' || file.scan_results.trim() === '') {
                                                            return '';
                                                            }

                                                            try {
                                                            const parsed = JSON.parse(file.scan_results);

                                                            if (!Array.isArray(parsed) || parsed.length === 0) {
                                                                return '';
                                                            }

                                                            return parsed.map((item, index) => {
                                                                if (!item || typeof item !== 'object') return null;

                                                                const virusName = Array.isArray(item.virusName) && item.virusName.length > 0
                                                                ? item.virusName.join(', ')
                                                                : 'N/A';

                                                                const message = Array.isArray(item.message) && item.message.length > 0
                                                                ? item.message.join(', ')
                                                                : '';
                                                                const dateScanned = item.dateScanned?dateformatter(item.dateScanned): 'N/A';

                                                                return (
                                                                <div key={index} style={{padding: 0 }}>
                                                                    <div><strong>Virus Name:</strong> {virusName}</div>
                                                                    <div><strong>Message:</strong> {message}</div>
                                                                    <div><strong>Date Scanned:</strong> {dateScanned}</div>
                                                                </div>
                                                                );
                                                            });
                                                            } catch {
                                                                return '';
                                                            }
                                                        })()}
                                                        </TableCell>
                                                     )}
                                                        </TableRow>
                                                    ))
                                                ) : ( <TableRow> <TableCell colSpan={3} align="center"> {filesSearchTerm ? 'No files match your search.' : `No files found for status '${selectedStatusTab}'. Apply filters or clear search.`} </TableCell> </TableRow> )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[10, 25, 50, 100]} component="div"
                                        count={filteredAndSortedFiles.length} rowsPerPage={filesListRowsPerPage} page={filesListPage}
                                        onPageChange={handleFilesPageChange} onRowsPerPageChange={handleFilesRowsPerPageChange}
                                    />
                                </>
                             )}
                        </CardContent>
                    </Card>

                    <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
                </LocalizationProvider>
            </Box> {/* End main content Box */}
        </Box> // End outer Flex Box
    );
}

export default FilesByStatus;