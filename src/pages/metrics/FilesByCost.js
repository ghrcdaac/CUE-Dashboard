import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, Grid, TextField,
    CircularProgress, Alert, Pagination, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, TablePagination,
    TableSortLabel
  } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useOutletContext } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import usePageTitle from "../../hooks/usePageTitle";
import MetricsFilter from './MetricsFilter';

import * as costMetricsApi from '../../api/costApi';

import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';

const DEFAULT_ROWS_PER_PAGE = 10;
const DATE_FORMAT_API_DAYJS = 'YYYY-MM-DD';
const ITEMS_PER_PAGE = 10;

const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();

const getComparator = (order, orderBy) => {
    return (a, b) => {
      if (!a[orderBy]) return 1;
      if (!b[orderBy]) return -1;
      const aValue = typeof a[orderBy] === 'string' ? a[orderBy].toLowerCase() : a[orderBy];
      const bValue = typeof b[orderBy] === 'string' ? b[orderBy].toLowerCase() : b[orderBy];
      if (order === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    };
  };

function FilesByCost() {
    usePageTitle("Files by Cost");
    const { accessToken } = useAuth();
    const ngroupId = useMemo(() => localStorage.getItem('CUE_ngroup_id'), []);


    const [summary, setSummary] = useState(null);
    const [collectionCost, setCollectionCost] = useState([]);
    const [filesByCostData, setFilesByCostData] = useState([]);
    const [filesSearchTerm, setFilesSearchTerm] = useState('');
    const [filesOrder, setFilesOrder] = useState('asc');
    const [filesOrderBy, setFilesOrderBy] = useState('name');
    const [filesListPage, setFilesListPage] = useState(0);
    const [filesListRowsPerPage, setFilesListRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    const [filesListTotalCount, setFilesListTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    const [startDate, setStartDate] = useState(getDefaultStartDate);
    const [endDate, setEndDate] = useState(getDefaultEndDate);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null); 

    const [collectionTotalPages, setCollectionTotalPages] = useState(1);
    const [collectionPage, setCollectionPage] = useState(1);
    const [collectionsOrder, setCollectionsOrder] = useState('asc');
    const [collectionsOrderBy, setCollectionsOrderBy] = useState('name');

    const metricsMenuItems = [
        { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
        { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
        { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> }
    ];

    const { setMenuItems } = useOutletContext();
    
    useEffect(() => {
        setMenuItems(metricsMenuItems);
        // Optional: clear the menu when the page is left
        return () => setMenuItems([]);
    }, [setMenuItems]);

    function handleDataFilter({provider, user, collection, startDate, endDate}) {
        setSelectedProvider(provider ?? null);
        setSelectedUser(user ?? null);
        setSelectedCollection(collection ?? null);
        setStartDate(startDate ?? getDefaultStartDate());
        setEndDate(endDate ?? getDefaultEndDate());
        setFilesListPage(0);
        setCollectionPage(1);
    }

    function clearDataFilter() {
        setSelectedProvider(null); setSelectedUser(null); setSelectedCollection(null);
        setStartDate(getDefaultStartDate()); setEndDate(getDefaultEndDate());
    }

    const fetchSummary = useCallback(async () => {
        if (!accessToken || !ngroupId) return;
        try {
            const params = {
                ngroup_id: ngroupId,
                provider_id: selectedProvider?.id,
                user_id: selectedUser?.id,
                collection_id: selectedCollection?.id,
                start_date: startDate?.format(DATE_FORMAT_API_DAYJS),
                end_date: endDate?.format(DATE_FORMAT_API_DAYJS),
            };
            const summaryRes = await costMetricsApi.getCostSummary(params, accessToken);
            setSummary(summaryRes);
        } catch (err) {
            toast.error("Error loading summary");
        }
    }, [accessToken, ngroupId, selectedProvider, selectedUser, selectedCollection, startDate, endDate]);

    const fetchCollections = useCallback(async () => {
        if (!accessToken || !ngroupId) return;
        try {
            const params = {
                ngroup_id: ngroupId,
                provider_id: selectedProvider?.id,
                user_id: selectedUser?.id,
                collection_id: selectedCollection?.id,
                start_date: startDate?.format(DATE_FORMAT_API_DAYJS),
                end_date: endDate?.format(DATE_FORMAT_API_DAYJS),
                page: collectionPage,
                page_size: 4,
                sort_by: collectionsOrderBy,
                sort_order: collectionsOrder,
            };
            const res = await costMetricsApi.getCollectionByCost(params, accessToken);
            setCollectionCost(res?.costs || []);
            setCollectionTotalPages(res?.pages || 1);
        } catch (err) {
            toast.error("Error loading collection cost");
        }
    }, [accessToken, ngroupId, selectedProvider, selectedUser, selectedCollection, startDate, endDate, collectionPage, collectionsOrderBy, collectionsOrder]);

    const fetchFiles = useCallback(async () => {
        if (!accessToken || !ngroupId) return;
        try {
            const params = {
                ngroup_id: ngroupId,
                provider_id: selectedProvider?.id,
                user_id: selectedUser?.id,
                collection_id: selectedCollection?.id,
                start_date: startDate?.format(DATE_FORMAT_API_DAYJS),
                end_date: endDate?.format(DATE_FORMAT_API_DAYJS),
                page: filesListPage + 1,
                page_size: filesListRowsPerPage,
                sort_by: filesOrderBy,
                sort_order: filesOrder,
            };
            const res = await costMetricsApi.getFileByCost(params, accessToken);
            setFilesByCostData(Array.isArray(res) ? res : res?.costs || []);
            setFilesListTotalCount(res?.length || res?.total || 0);
        } catch (err) {
            toast.error("Error loading file cost");
        }
    }, [accessToken, ngroupId, selectedProvider, selectedUser, selectedCollection, startDate, endDate, filesListPage, filesListRowsPerPage, filesOrderBy, filesOrder]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    useEffect(() => {
        setFilesListPage(0);
    }, [filesSearchTerm]);

    const handleFilesPageChange = (event, newPage) => setFilesListPage(newPage);
    const handleFilesRowsPerPageChange = (event) => setFilesListRowsPerPage(parseInt(event.target.value, 10));
  
    const filteredFiles = useMemo(() => {
    const sorted = [...filesByCostData].sort(getComparator(filesOrder, filesOrderBy));
    const filtered = filesSearchTerm
        ? sorted.filter(f => f.name?.toLowerCase().includes(filesSearchTerm.toLowerCase()))
        : sorted;

    return filtered;
    }, [filesByCostData, filesSearchTerm, filesOrder, filesOrderBy]);

    const paginatedCollections = collectionCost.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(collectionCost.length / ITEMS_PER_PAGE);

    const handleRequestSort = (event, property) => {
        const isAsc = filesOrderBy === property && filesOrder === 'asc';
        setFilesOrder(isAsc ? 'desc' : 'asc');
        setFilesOrderBy(property);
    };

    const paginatedFiles = useMemo(() => {
        if (filesSearchTerm) {
            const start = filesListPage * filesListRowsPerPage;
            const end = start + filesListRowsPerPage;
            return filteredFiles.slice(start, end);
        }
        return filteredFiles;
    }, [filteredFiles, filesSearchTerm, filesListPage, filesListRowsPerPage]);

    return (
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
                                    <Typography variant="h4">${summary?.files_metadata?.cost_per_byte || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Card>
                            <CardContent sx={{ height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>Daily Cost</Typography>
                                    {summary?.daily_cost?.length ? (
                                        <ResponsiveContainer width="100%" height={350}>
                                            <LineChart data={summary.daily_cost}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" padding={{ left: 20, right: 20 }}/>
                                                <YAxis allowDataOverflow domain={[0, 'auto']} />
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
                            <CardContent sx={{ height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>Collection Cost</Typography>
                            {paginatedCollections.length > 0 ? (
                                <Box>
                                    <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={collectionCost}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip 
                                            cursor={false} //remove the grey background from tooltip
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
                                            }}/>
                                        <Bar dataKey="cost" fill="#82ca9d" />
                                    </BarChart>
                                    </ResponsiveContainer>
                                    <Pagination
                                        count={collectionTotalPages}
                                        page={collectionPage}
                                        onChange={(e, value) => setCollectionPage(value)}
                                        sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
                                    />
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
                                    {["name", "cost", "size"].map((col) => (
                                        <TableCell key={col} sortDirection={filesOrderBy === col ? filesOrder : false}>
                                        <TableSortLabel
                                            active={filesOrderBy === col}
                                            direction={filesOrderBy === col ? filesOrder : 'asc'}
                                            onClick={(e) => handleRequestSort(e, col)}>
                                            {col.charAt(0).toUpperCase() + col.slice(1)}
                                        </TableSortLabel>
                                        </TableCell>
                                    ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedFiles.map((row, idx) => (
                                        <TableRow key={idx} hover>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>${row.cost}</TableCell>
                                        <TableCell>{row.size}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50]}
                                component="div"
                                count={filesSearchTerm ? filteredFiles.length : filesListTotalCount}
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
    );
}

export default FilesByCost;
