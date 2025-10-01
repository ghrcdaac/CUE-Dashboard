import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, Grid,
    CircularProgress, Alert, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, TablePagination, Container
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useOutletContext } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hooks, Components & Utils
import usePageTitle from "../../hooks/usePageTitle";
import MetricsFilter from './MetricsFilter';

import { parseApiError } from '../../utils/errorUtils';
import * as costApi from '../../api/costApi';
import { generateCostReport } from '../reports/PdfReport';


// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';

function FilesByCost() {
    usePageTitle("Files by Cost");
    const { setMenuItems } = useOutletContext();

    // State
    const [activeFilters, setActiveFilters] = useState({});
    
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

    // Initial fetch
    useEffect(() => {
        fetchAllData({});
    }, [fetchAllData]);

    const handleApplyFilters = (filters) => {
        setActiveFilters(filters);
        fetchAllData(filters);
    };

    const handleClearFilters = () => {
        setActiveFilters({});
        fetchAllData({});
    };

    // --- Pagination Handlers ---
    const handleCollectionPageChange = (event, newPage) => {
        setLoadingCollections(true);
        const params = { filters: activeFilters, page: newPage, page_size: collectionPagination.pageSize }; // MUI Pagination is 1-based for display
        costApi.getCostByCollection(params).then(res => {
            setCollectionCosts(res.items || []);
            setCollectionPagination(prev => ({ ...prev, page: newPage - 1 })); // Store as 0-based
        }).catch(err => toast.error(`Failed to load collections page: ${parseApiError(err)}`)).finally(() => setLoadingCollections(false));
    };

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

    // const handleExportCostReport = async () => {
    //     try {
    //         toast.info("Generating Files by Cost report. This may take a moment...");

    //         const userInfo = {
    //             name: localStorage.getItem('CUE_username'),
    //             // ngroup: localStorage.getItem('CUE_ngroup_id'), // need to replace to name
    //             // role: localStorage.getItem('CUE_role_id'), //need to replace to name
    //             start: startDate.format(DATE_FORMAT_API_DAYJS),
    //             end: endDate.format(DATE_FORMAT_API_DAYJS)
    //         };

    //         //  Summary
    //         const summaryParams = {
    //         ngroup_id: ngroupId,
    //         start_date: startDate?.format(DATE_FORMAT_API_DAYJS),
    //         end_date: endDate?.format(DATE_FORMAT_API_DAYJS),
    //         };
    //         const summary = await costMetricsApi.getCostSummary(summaryParams, accessToken);

    //         //  Daily cost (fetch all pages)
    //         let daily = [];
    //         let page = 1;
    //         const pageSize = 100;
    //         let total = 0;
    //         daily = daily.concat(summary?.daily_cost || []);

    //         //  Collection cost (fetch all pages)
    //         let collections = [];
    //         do {
    //         const res = await costMetricsApi.getCollectionByCost(
    //             { ...summaryParams, page, page_size: pageSize },
    //             accessToken
    //         );
    //         collections = collections.concat(res?.costs || []);
    //         total = res?.total || 0;
    //         page++;
    //         } while (collections.length < total);

    //         //  Files by cost (fetch all pages)
    //         let files = [];
    //         page = 1;
    //         total = 0;
    //         do {
    //         const res = await costMetricsApi.getFileByCost(
    //             { ...summaryParams, page, page_size: pageSize },
    //             accessToken
    //         );
    //         const items = Array.isArray(res) ? res : res?.costs || [];
    //         files = files.concat(items);
    //         total = res?.total || items.length;
    //         page++;
    //         } while (files.length < total);

    //         // Build summary data
    //         const summaryData = {
    //         "Total Cost": `$${summary?.total_cost?.cost || 0}`,
    //         "Number of Files": summary?.files_metadata?.number_of_files || 0,
    //         "Cost per Byte": `$${summary?.files_metadata?.cost_per_byte || 0}`,
    //         };

    //         generateCostReport(summaryData, daily, collections, files, userInfo);

    //         toast.success("Files by Cost report downloaded successfully!");
    //     } catch (err) {
    //         toast.error("Failed to generate report: " + err.message);
    //     }
    // };

    return (

        <Container maxWidth={false} disableGutters>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <ToastContainer position="top-center" />
                <MetricsFilter 
                    onApplyFilters={handleApplyFilters} 
                    onClearFilters={handleClearFilters}
                    isDataLoading={loadingSummary || loadingCollections || loadingFiles}
                />
                
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                {/* Summary Cards */}
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} md={4}><Card sx={{ height: '100%' }}><CardContent><Typography variant="subtitle1" color="text.secondary">Total Cost</Typography><Typography variant="h4">{loadingSummary ? <CircularProgress size={20}/> : `$${summary?.total_cost?.value?.toFixed(2) ?? '0.00'}`}</Typography></CardContent></Card></Grid>
                    <Grid item xs={12} md={4}><Card sx={{ height: '100%' }}><CardContent><Typography variant="subtitle1" color="text.secondary">Total Files</Typography><Typography variant="h4">{loadingSummary ? <CircularProgress size={20}/> : summary?.total_files?.toLocaleString() ?? 0}</Typography></CardContent></Card></Grid>
                    <Grid item xs={12} md={4}><Card sx={{ height: '100%' }}><CardContent><Typography variant="subtitle1" color="text.secondary">Total Size (GB)</Typography><Typography variant="h4">{loadingSummary ? <CircularProgress size={20}/> : `${summary?.total_size_gb?.toFixed(2) ?? '0.00'} GB`}</Typography></CardContent></Card></Grid>
                </Grid>

                {/* Chart Cards */}
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} lg={6}>
                        <Card><CardContent><Typography variant="h5" gutterBottom>Daily Cost</Typography>
                            {loadingSummary ? <CircularProgress/> : !summary?.daily_cost?.length ? <Typography variant="body2">No data available.</Typography> : 
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={summary.daily_cost} margin={{ right: 30, left: 20 }}><CartesianGrid /><XAxis dataKey="day" /><YAxis /><Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Cost"]}/><Legend /><Line type="monotone" dataKey="value" stroke="#8884d8" name="Cost"/></LineChart>
                            </ResponsiveContainer>}
                        </CardContent></Card>

                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <Card><CardContent><Typography variant="h5" gutterBottom>Cost by Collection</Typography>
                            {loadingCollections ? <CircularProgress/> : !collectionCosts?.length ? <Typography variant="body2">No data available.</Typography> : 
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={collectionCosts} margin={{ right: 30, left: 20 }}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Cost"]}/><Legend /><Bar dataKey="cost" fill="#82ca9d" name="Total Cost" /></BarChart>
                            </ResponsiveContainer>}
                            <TablePagination component="div" count={collectionPagination.total} page={collectionPagination.page + 1} onPageChange={handleCollectionPageChange} rowsPerPage={collectionPagination.pageSize} rowsPerPageOptions={[collectionPagination.pageSize]}/>
                        </CardContent></Card>
                    </Grid>
                </Grid>

                {/* Table: Cost by File */}
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>Cost by File</Typography>
                        {loadingFiles ? <CircularProgress /> :
                            <>
                                <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>File Name</TableCell><TableCell>Collection</TableCell><TableCell align="right">Size (GB)</TableCell><TableCell align="right">Cost</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {fileCosts.map((file) => (
                                        <TableRow key={file.name}><TableCell>{file.name}</TableCell><TableCell>{file.collection_name}</TableCell><TableCell align="right">{file.size_gb.toFixed(4)}</TableCell><TableCell align="right">${file.cost.toFixed(6)}</TableCell></TableRow>
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