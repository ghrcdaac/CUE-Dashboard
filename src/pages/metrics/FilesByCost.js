import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, Grid,
    CircularProgress, Alert, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, TablePagination, Container, Skeleton, OutlinedInput, InputAdornment, TableSortLabel
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useOutletContext } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hooks, Components & Utils
import usePageTitle from "../../hooks/usePageTitle";
import useAuth from '../../hooks/useAuth';
import MetricsFilter from './MetricsFilter';
import { parseApiError } from '../../utils/errorUtils';
import * as costApi from '../../api/costApi';
import { generateCostReport } from '../reports/PdfReport';
import ExportMenu from '../reports/ExportMenu';


// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';
import SearchIcon from '@mui/icons-material/Search';

const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
 
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
 
    const i = Math.floor(Math.log(bytes) / Math.log(k));
 
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const DATE_FORMAT_API_DAYJS = 'YYYY-MM-DD';
const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();

function FilesByCost() {
    usePageTitle("Files by Cost");
    const { setMenuItems } = useOutletContext();
    // Get the reactive activeNgroupId from useAuth.
    const { activeNgroupId } = useAuth();

    // State
    const [activeFilters, setActiveFilters] = useState({
        start_date: getDefaultStartDate().format(DATE_FORMAT_API_DAYJS),
        end_date: getDefaultEndDate().format(DATE_FORMAT_API_DAYJS),
    });
    
    // Summary State
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    
    // Collection Cost State
    const [collectionCosts, setCollectionCosts] = useState([]);
    const [collectionPagination, setCollectionPagination] = useState({ page: 0, pageSize: 5, total: 0 });
    const [loadingCollections, setLoadingCollections] = useState(true);

    // File Cost State
    const [fileCosts, setFileCosts] = useState([]);
    const [filePagination, setFilePagination] = useState({ page: 0, pageSize: 10, total: 0 });
    const [loadingFiles, setLoadingFiles] = useState(true);

    // Combined error state
    const [error, setError] = useState(null);

    const [fileSearchTerm, setFileSearchTerm] = useState('');
    const [fileSort, setFileSort] = useState({ field: 'cost', direction: 'desc' });

    // Side Nav Menu
    useEffect(() => {
        const metricsMenuItems = [
            { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
            { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
            { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> }
        ];
        setMenuItems(metricsMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    // --- Data Fetching Callbacks ---
    const fetchAllData = useCallback((filters) => {
        setError(null);

        // Fetch Summary
        setLoadingSummary(true);
        costApi.getCostSummary(filters).then(setSummary).catch(err => {
            const msg = `Failed to load summary: ${parseApiError(err)}`;
            setError(msg); toast.error(msg);
        }).finally(() => setLoadingSummary(false));

        // Fetch first page of Collections
        setLoadingCollections(true);
        const collectionParams = { filters, page: 1, page_size: collectionPagination.pageSize };
        costApi.getCostByCollection(collectionParams).then(res => {
            setCollectionCosts(res.items || []);
            setCollectionPagination(prev => ({ ...prev, total: res.total || 0, page: 0 }));
        }).catch(err => toast.error(`Failed to load collections: ${parseApiError(err)}`)).finally(() => setLoadingCollections(false));
        
        // Fetch first page of Files
        setLoadingFiles(true);
        const fileParams = { filters, page: 1, page_size: filePagination.pageSize };
        costApi.getCostByFile(fileParams).then(res => {
            setFileCosts(res.items || []);
            setFilePagination(prev => ({ ...prev, total: res.total || 0, page: 0 }));
        }).catch(err => toast.error(`Failed to load files: ${parseApiError(err)}`)).finally(() => setLoadingFiles(false));
    }, [collectionPagination.pageSize, filePagination.pageSize]);

    // MODIFICATION: This useEffect now depends on activeNgroupId and will re-fetch all data when it changes.
    useEffect(() => {
        if (activeNgroupId) {
            fetchAllData(activeFilters);
        }
    }, [fetchAllData, activeFilters, activeNgroupId]);

    const handleApplyFilters = (filters) => {
        setActiveFilters(filters);
    };

    const handleClearFilters = () => {
        setActiveFilters({
            start_date: getDefaultStartDate().format(DATE_FORMAT_API_DAYJS),
            end_date: getDefaultEndDate().format(DATE_FORMAT_API_DAYJS),
        });
    };

    // --- Pagination Handlers ---
    const handleCollectionPageChange = useCallback((event, newPage) => {
        setLoadingCollections(true);
        const apiPage = newPage + 1;
        const params = { filters: activeFilters, page: apiPage, page_size: collectionPagination.pageSize };
        costApi.getCostByCollection(params).then(res => {
            setCollectionCosts(res.items || []);
            setCollectionPagination(prev => ({ ...prev, page: newPage }));
        }).catch(err => toast.error(`Failed to load collections page: ${parseApiError(err)}`)).finally(() => setLoadingCollections(false));
    }, [activeFilters, collectionPagination.pageSize]);

    const handleFilePageChange = (event, newPage) => {
        setLoadingFiles(true);
        const params = { filters: activeFilters, page: newPage + 1, page_size: filePagination.pageSize };
        costApi.getCostByFile(params).then(res => {
            setFileCosts(res.items || []);
            setFilePagination(prev => ({ ...prev, page: newPage }));
        }).catch(err => toast.error(`Failed to load files page: ${parseApiError(err)}`)).finally(() => setLoadingFiles(false));
    };

    const handleFileRowsPerPageChange = (event) => {
        const newPageSize = parseInt(event.target.value, 10);
        setLoadingFiles(true);
        const params = { filters: activeFilters, page: 1, page_size: newPageSize };
        costApi.getCostByFile(params).then(res => {
            setFileCosts(res.items || []);
            setFilePagination({ total: res.total || 0, pageSize: newPageSize, page: 0 });
        }).catch(err => toast.error(`Failed to load files: ${parseApiError(err)}`)).finally(() => setLoadingFiles(false));
    };

    const handleFileSort = (field) => {
        const isAsc = fileSort.field === field && fileSort.direction === 'asc';
        setFileSort({ field, direction: isAsc ? 'desc' : 'asc' });
    };

    const handleFileSearchChange = (event) => {
        setFileSearchTerm(event.target.value);
    };

    const filteredAndSortedFiles = useMemo(() => {
        const filtered = fileCosts.filter(file => 
            file.name.toLowerCase().includes(fileSearchTerm.toLowerCase())
        );

        return [...filtered].sort((a, b) => {
            const aValue = a[fileSort.field];
            const bValue = b[fileSort.field];
            const isAsc = fileSort.direction === 'asc' ? 1 : -1;

            if (aValue < bValue) return -1 * isAsc;
            if (aValue > bValue) return 1 * isAsc;
            return 0;
        });
    }, [fileCosts, fileSearchTerm, fileSort]);

    const handleExportCostReport = async () => {
        try {
            toast.info("Generating Files by Cost report. This may take a moment...");
            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            const startDate = activeFilters?.start_date || sevenDaysAgo.toISOString().split('T')[0];
            const endDate = activeFilters?.end_date || now.toISOString().split('T')[0];
            const userInfo = {
                name: localStorage.getItem('CUE_username') || 'Unknown User',
                start: startDate,
                end: endDate
            };

            const summaryData = await costApi.getCostSummary({ filters: activeFilters });
            const daily = summaryData?.daily_cost || [];
            
            let collections = [];
            let page = 1;
            let total = 0;
            const pageSize = 100;
            do {
                const res = await costApi.getCostByCollection({ filters: activeFilters, page, page_size: pageSize });
                collections = collections.concat(res.items || []);
                total = res.total || 0;
                page++;
            } while (collections.length < total);

            let files = [];
            page = 1;
            total = 0;
            do {
                const res = await costApi.getCostByFile({ filters: activeFilters, page, page_size: pageSize });
                files = files.concat(res.items || []);
                total = res.total || 0;
                page++;
            } while (files.length < total);

            const summaryInfo = {
                "Total Cost": `$${summaryData?.total_cost?.value?.toFixed(2) ?? '0.00'}`,
                "Total Files": summaryData?.total_files?.toLocaleString() ?? 0,
                "Total Size": formatBytes(summaryData?.total_size_bytes ?? 0)
            };

            generateCostReport(summaryInfo, daily, collections, files, userInfo);
            toast.success("Files by Cost report downloaded successfully!");
        } catch (err) {
            toast.error("Failed to generate report: " + parseApiError(err));
        }
    };

    return (
        <Container maxWidth={false} disableGutters>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <ToastContainer position="top-center" />
                <MetricsFilter 
                    onApplyFilters={handleApplyFilters} 
                    onClearFilters={handleClearFilters}
                    isDataLoading={loadingSummary || loadingCollections || loadingFiles}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">Cost Overview</Typography>
                    <ExportMenu onExport={handleExportCostReport} />
                </Box>
                
                {loadingSummary ? (
                    <Grid container sx={{ mb: 3, ml: -1.5, mr: -1.5 }}>
                        <Grid item sx={{ width: '33.333%', p: 1.5 }}><Skeleton variant="rounded" height={100} /></Grid>
                        <Grid item sx={{ width: '33.333%', p: 1.5 }}><Skeleton variant="rounded" height={100} /></Grid>
                        <Grid item sx={{ width: '33.333%', p: 1.5 }}><Skeleton variant="rounded" height={100} /></Grid>
                    </Grid>
                ) : error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : (
                    <Grid container sx={{ mb: 3, ml: -1.5, mr: -1.5 }}>
                        <Grid item sx={{ width: '33.333%', p: 1.5 }}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary">Total Cost</Typography>
                                    <Typography variant="h4">{`$${summary?.total_cost?.value?.toFixed(2) ?? '0.00'}`}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item sx={{ width: '33.333%', p: 1.5 }}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary">Total Files</Typography>
                                    <Typography variant="h4">{summary?.total_files?.toLocaleString() ?? 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item sx={{ width: '33.333%', p: 1.5 }}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary">Total Size</Typography>
                                    <Typography variant="h4">{formatBytes(summary?.total_size_bytes ?? 0)}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Chart Cards */}
                <Grid container sx={{ mb: 3, ml: -1.5, mr: -1.5 }}>
                    <Grid item sx={{ width: '50%', p: 1.5 }}>
                        <Card sx={{ height: 450 }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>Daily Cost</Typography>
                                {loadingSummary ? <Skeleton variant="rounded" height={300} /> : !summary?.daily_cost?.length ? <Typography variant="body2">No data available.</Typography> : 
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={summary.daily_cost} margin={{ right: 30, left: 20 }}>
                                        <CartesianGrid /><XAxis dataKey="day" /><YAxis /><Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Cost"]}/><Legend /><Line type="monotone" dataKey="value" stroke="#8884d8" name="Cost"/>
                                    </LineChart>
                                </ResponsiveContainer>}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item sx={{ width: '50%', p: 1.5 }}>
                        <Card sx={{ height: 450 }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>Cost by Collection</Typography>
                                {loadingCollections ? <Skeleton variant="rounded" height={300} /> : !collectionCosts?.length ? <Typography variant="body2">No data available.</Typography> : 
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={collectionCosts} margin={{ right: 30, left: 20 }}>
                                        <CartesianGrid />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 'dataMax']} />
                                        <Tooltip cursor={{fill: 'transparent'}} formatter={(value) => [`$${value.toFixed(2)}`, "Cost"]}/>
                                        <Legend />
                                        <Bar dataKey="cost" fill="#82ca9d" name="Total Cost" />
                                    </BarChart>
                                </ResponsiveContainer>}
                            </CardContent>
                            <TablePagination component="div" count={collectionPagination.total} page={collectionPagination.page} onPageChange={handleCollectionPageChange} rowsPerPage={collectionPagination.pageSize} rowsPerPageOptions={[collectionPagination.pageSize]}/>
                        </Card>
                    </Grid>
                </Grid>

                {/* Table: Cost by File */}
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">Files by Cost</Typography>
                            <OutlinedInput
                                placeholder="Search files..."
                                size="small"
                                value={fileSearchTerm}
                                onChange={handleFileSearchChange}
                                endAdornment={<InputAdornment position="end"><SearchIcon /></InputAdornment>}
                            />
                        </Box>
                        {loadingFiles ? <CircularProgress /> :
                            <>
                                <TableContainer component={Paper}><Table><TableHead><TableRow>
                                    <TableCell sortDirection={fileSort.field === 'name' ? fileSort.direction : false}>
                                        <TableSortLabel active={fileSort.field === 'name'} direction={fileSort.field === 'name' ? fileSort.direction : 'asc'} onClick={() => handleFileSort('name')}>File Name</TableSortLabel>
                                    </TableCell>
                                    <TableCell align="left" sortDirection={fileSort.field === 'size_bytes' ? fileSort.direction : false}>
                                        <TableSortLabel active={fileSort.field === 'size_bytes'} direction={fileSort.field === 'size_bytes' ? fileSort.direction : 'asc'} onClick={() => handleFileSort('size_bytes')}>Size</TableSortLabel>
                                    </TableCell>
                                    <TableCell align="left" sortDirection={fileSort.field === 'cost' ? fileSort.direction : false}>
                                        <TableSortLabel active={fileSort.field === 'cost'} direction={fileSort.field === 'cost' ? fileSort.direction : 'asc'} onClick={() => handleFileSort('cost')}>Cost</TableSortLabel>
                                    </TableCell>
                                </TableRow></TableHead>
                                <TableBody>
                                    {filteredAndSortedFiles.map((file, index) => (
                                        <TableRow key={`${file.name}-${index}`}>
                                            <TableCell>{file.name}</TableCell>
                                            <TableCell align="left">{formatBytes(file.size_bytes)}</TableCell>
                                            <TableCell align="left">${file.cost.toFixed(3)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody></Table></TableContainer>
                                <TablePagination rowsPerPageOptions={[10, 25, 50]} component="div" count={filePagination.total} rowsPerPage={filePagination.pageSize} page={filePagination.page} onPageChange={handleFilePageChange} onRowsPerPageChange={handleFileRowsPerPageChange}/>
                            </>
                        }
                    </CardContent>
                </Card>

            </LocalizationProvider>
        </Container>
    );
}

export default FilesByCost;
