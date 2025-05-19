// src/pages/metrics/FilesByCost.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, Grid, TextField,
    CircularProgress, Alert, Pagination, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, TablePagination,
    TableSortLabel
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import useAuth from '../../hooks/useAuth';
import usePageTitle from "../../hooks/usePageTitle";
import SideNav from "../../components/SideNav";
import MetricsFilter from './MetricsFilter';

import * as fileStatusApi from '../../api/fileStatusApi';

import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';

const DEFAULT_ROWS_PER_PAGE = 10;
const DATE_FORMAT_API_DAYJS = 'YYYY-MM-DD';
const ITEMS_PER_PAGE = 10;

const formatBytes = (bytesStr) => {
    if (!bytesStr || typeof bytesStr !== 'string') return '0 Bytes';
    return bytesStr;
};
const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();
const getErrorMessage = (reason) => {
    if (reason instanceof Error) return reason.message;
    if (typeof reason === 'string') return reason;
    try { return JSON.stringify(reason); } catch { return 'An unknown error occurred.'; }
};

function FilesByCost() {
    usePageTitle("Files by Cost");
    const { accessToken } = useAuth();
    const ngroupId = useMemo(() => localStorage.getItem('CUE_ngroup_id'), []);

    const [openSideNav, setOpenSideNav] = useState(true);

    const [summary, setSummary] = useState(null);
    const [collectionCost, setCollectionCost] = useState([]);
    const [filesByCostData, setFilesByCostData] = useState([]);
    const [filesSearchTerm, setFilesSearchTerm] = useState('');
    const [filesOrder, setFilesOrder] = useState('asc');
    const [filesOrderBy, setFilesOrderBy] = useState('name');
    const [filesListPage, setFilesListPage] = useState(0);
    const [filesListRowsPerPage, setFilesListRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    const [filesListTotalCount, setFilesListTotalCount] = useState(0);
    const [filesFetched, setFilesFetched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    const [startDate, setStartDate] = useState(getDefaultStartDate);
    const [endDate, setEndDate] = useState(getDefaultEndDate);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null); 

    const handleToggleSideNav = () => setOpenSideNav(!openSideNav);
    const metricsMenuItems = [
        { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
        { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
        { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> }
    ];

    function handleDataFilter(provider, user, collection, startDate, endDate) {
            setSelectedProvider(provider);
            setSelectedUser(user);
            setSelectedCollection(collection);
            setStartDate(startDate);
            setEndDate(endDate)
            fetchDataByCost();
    }

    function clearDataFilter() {
        setSelectedProvider(null); setSelectedUser(null); setSelectedCollection(null);
        setStartDate(getDefaultStartDate()); setEndDate(getDefaultEndDate());
        toast.info("Filters cleared.")
    }

    const fetchDataByCost = useCallback(async () => {
        if (!accessToken || !ngroupId) return;
        setLoading(true);
        setError(null);

        try {
            const params = {
                ngroup_id: ngroupId,
            };
            if (selectedProvider) params.provider_id = selectedProvider.id;
            if (selectedUser) params.user_id = selectedUser.id;
            if (selectedCollection) params.collection_id = selectedCollection.id;
            if (startDate?.isValid()) params.start_date = startDate.format(DATE_FORMAT_API_DAYJS);
            if (endDate?.isValid()) params.end_date = endDate.format(DATE_FORMAT_API_DAYJS);

            const collectionCostParams = {
                ...params,
                page: filesListPage + 1, 
                page_size: filesListRowsPerPage,
            };
            const fileCostParams = {
                ...params,
                page: filesListPage + 1, 
                page_size: filesListRowsPerPage,
            };
            const [summaryRes, collectionRes, fileCostResponse] = await Promise.all([
                fileStatusApi.getCostSummary(params, accessToken),
                fileStatusApi.getCollectionByCost(collectionCostParams, accessToken),
                fileStatusApi.getFileByCost(fileCostParams, accessToken)
            ]);

            setSummary(summaryRes);
            setCollectionCost(Array.isArray(collectionRes) ? collectionRes : []);
            setFilesByCostData(Array.isArray(fileCostResponse) ? fileCostResponse : fileCostResponse?.items || []);
            setFilesListTotalCount(fileCostResponse?.length || fileCostResponse?.total || 0);
            setFilesFetched(true);
        } catch (err) {
            setError("Failed to load cost metrics");
            toast.error("Error loading cost metrics");
        } finally {
            setLoading(false);
        }
    }, [accessToken, ngroupId, startDate, endDate, filesListPage, filesListRowsPerPage]);

    useEffect(() => { fetchDataByCost(); }, [fetchDataByCost]);

    const handleFilesPageChange = (event, newPage) => setFilesListPage(newPage);
    const handleFilesRowsPerPageChange = (event) => setFilesListRowsPerPage(parseInt(event.target.value, 10));

    const filteredFiles = useMemo(() => {
        const files = Array.isArray(filesByCostData) ? filesByCostData : [];
        if (filesSearchTerm) {
            return files.filter(f => f.name?.toLowerCase().includes(filesSearchTerm.toLowerCase()));
        }
        return files;
    }, [filesByCostData, filesSearchTerm]);

    const paginatedCollections = collectionCost.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(collectionCost.length / ITEMS_PER_PAGE);

    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
            <SideNav menuItems={metricsMenuItems} open={openSideNav} onToggle={handleToggleSideNav} />
            <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f4f6f8' }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <MetricsFilter handleDataFilter={handleDataFilter} clearData={clearDataFilter} />

                    {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
                        <>
                            <Grid container spacing={3} mb={3}>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>Total Cost</Typography>
                                            <Typography variant="h4">${summary?.total_cost?.cost || 0}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>Number of Files</Typography>
                                            <Typography variant="h4">{summary?.files_metadata?.number_of_files || 0}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>Cost per Byte</Typography>
                                            <Typography variant="h4">{summary?.files_metadata?.cost_per_byte || 0}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>Daily Cost</Typography>
                                            {summary?.daily_cost?.length ? (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={summary.daily_cost}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" padding={{ left: 20, right: 20 }}/>
                                                        <YAxis allowDataOverflow domain={['auto', 'auto']} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="cost" stroke="#8884d8" name="Daily Cost ($)" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">No daily cost data available for selected period/filters.</Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card>
                                    <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>Collection Cost</Typography>
                                    {paginatedCollections.length > 0 ? (
                                        <Box>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={paginatedCollections}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip
                                                        // THIS IS THE KEY CHANGE
                                                        cursor={false} // Disables the default grey hover background
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const { name, cost, size } = payload[0].payload;
                                                                return (
                                                                <Box sx={{ p: 1, borderRadius: 1, boxShadow: 2, backgroundColor: 'white' }}>
                                                                    <Typography variant="body2"><b>{name}</b></Typography>
                                                                    <Typography variant="body2">Cost: ${cost}</Typography>
                                                                    <Typography variant="body2">Size: {size}</Typography>
                                                                </Box>
                                                                );
                                                            }
                                                            return null;
                                                        }} />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="cost"
                                                        fill="#82ca9d"
                                                        name="Cost ($)"
                                                        isAnimationActive={false}
                                                        shape={({ x, y, width, height }) => (
                                                            <rect x={x} y={y} width={width} height={height} fill="#82ca9d" stroke="none" style={{ pointerEvents: 'none' }} />
                                                        )}
                                                        // activeBar={false}
                                                        />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">No collection cost data available.</Typography>
                                    )}
                                    {totalPages > 1 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                            <Pagination count={totalPages} page={page} onChange={(e, val) => setPage(val)} />
                                        </Box>
                                    )}
                                    </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Card sx={{ mt: 4 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="h5">Files</Typography>
                                        <TextField label="Search Files by Name" variant="outlined" size="small" value={filesSearchTerm} onChange={(e) => setFilesSearchTerm(e.target.value)} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }} sx={{ width: '300px' }} />
                                    </Box>
                                    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                        <Table stickyHeader sx={{ minWidth: 650 }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>File Name</TableCell>
                                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>Cost</TableCell>
                                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>Size</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredFiles.length > 0 ? (
                                                    filteredFiles.map((file, index) => (
                                                        <TableRow hover key={index}>
                                                            <TableCell>{file.name || '(No Name)'}</TableCell>
                                                            <TableCell>${file.cost}</TableCell>
                                                            <TableCell>{file.size}</TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center">No files found.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[10, 25, 50, 100]}
                                        component="div"
                                        count={filteredFiles.length}
                                        rowsPerPage={filesListRowsPerPage}
                                        page={filesListPage}
                                        onPageChange={handleFilesPageChange}
                                        onRowsPerPageChange={handleFilesRowsPerPageChange}
                                    />
                                </CardContent>
                            </Card>
                        </>
                    )}
                    <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
                </LocalizationProvider>
            </Box>
        </Box>
    );
}

export default FilesByCost;
