// src/pages/metrics/FilesByStatus.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, CircularProgress, Alert, Table, 
    TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    TablePagination, TableSortLabel, Tabs, Tab
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hooks, Components & Utils
import usePageTitle from "../../hooks/usePageTitle";
import useAuth from '../../hooks/useAuth';
import { parseApiError } from '../../utils/errorUtils';
import MetricsFilter from './MetricsFilter'; // Import the reusable filter component

// --- V2 MIGRATION: Import from the new V2 API files ---
import { listFiles } from '../../api/fileApi';
import { listCollections } from '../../api/collectionApi';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';

const FILE_STATUSES = ["unscanned", "clean", "infected", "scan_failed", "distributed"];

// Helper function
const formatBytes = (bytes) => {
    if (bytes == null || isNaN(bytes)) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

function FilesByStatus() {
    usePageTitle("Files by Status");
    const { activeNgroupId } = useAuth();
    const { setMenuItems } = useOutletContext();

    // State
    const [files, setFiles] = useState([]);
    const [collectionMap, setCollectionMap] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State managed by this component
    const [activeFilters, setActiveFilters] = useState({});
    const [selectedStatusTab, setSelectedStatusTab] = useState(FILE_STATUSES[0]);
    
    // Pagination state
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });

    useEffect(() => {
        const metricsMenuItems = [
            { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
            { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
            { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> }
        ];
        setMenuItems(metricsMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    // Fetch collections once to map names to IDs in the table
    useEffect(() => {
        if (activeNgroupId) {
            listCollections()
                .then(data => setCollectionMap(new Map(data.map(c => [c.id, c.short_name]))))
                .catch(err => toast.error(`Could not load collection names: ${parseApiError(err)}`));
        }
    }, [activeNgroupId]);

    // Main data fetching function
    const fetchFiles = useCallback(() => {
        if (!activeNgroupId) return;
        setLoading(true);
        setError(null);

        const params = {
            ...activeFilters,
            status: selectedStatusTab,
            page: pagination.page + 1, // API is 1-based, MUI is 0-based
            page_size: pagination.pageSize,
        };

        listFiles(params)
            .then(response => {
                setFiles(response.items || []);
                setPagination(prev => ({ ...prev, total: response.total || 0 }));
            })
            .catch(err => {
                setError(parseApiError(err));
                toast.error(`Failed to load files: ${parseApiError(err)}`);
            })
            .finally(() => setLoading(false));
    }, [activeNgroupId, activeFilters, selectedStatusTab, pagination.page, pagination.pageSize]);
    
    // Trigger fetch when dependencies change
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);
    
    // --- Event Handlers ---
    const handleApplyFilters = (filters) => {
        setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page on new filter
        setActiveFilters(filters);
    };

    const handleClearFilters = () => {
        setPagination(prev => ({ ...prev, page: 0 }));
        setActiveFilters({});
    };

    const handleTabChange = (event, newValue) => {
        setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page on tab change
        setSelectedStatusTab(newValue);
    };

    const handlePageChange = (event, newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleRowsPerPageChange = (event) => {
        setPagination({ page: 0, pageSize: parseInt(event.target.value, 10), total: 0 });
    };

    return (
        <Box>
            <ToastContainer position="top-center" />
            <MetricsFilter 
                onApplyFilters={handleApplyFilters} 
                onClearFilters={handleClearFilters}
                isDataLoading={loading}
            />

            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>Files by Status</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={selectedStatusTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                            {FILE_STATUSES.map(status => <Tab label={status} value={status} key={status} />)}
                        </Tabs>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
                    ) : (
                        <>
                            <TableContainer component={Paper}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>File Name</TableCell>
                                            <TableCell>Collection</TableCell>
                                            <TableCell>Size</TableCell>
                                            <TableCell>Upload Time</TableCell>
                                            {/* Conditional Headers */}
                                            {(selectedStatusTab === 'infected' || selectedStatusTab === 'scan_failed') && <TableCell>Scan Results</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {files.length > 0 ? files.map((file) => (
                                            <TableRow hover key={file.id}>
                                                <TableCell>{file.name}</TableCell>
                                                <TableCell>{collectionMap.get(file.collection_id) || file.collection_id}</TableCell>
                                                <TableCell>{formatBytes(file.size_bytes)}</TableCell>
                                                <TableCell>{new Date(file.upload_time).toLocaleString()}</TableCell>
                                                {(selectedStatusTab === 'infected' || selectedStatusTab === 'scan_failed') && 
                                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                        {JSON.stringify(file.scan_results)}
                                                    </TableCell>
                                                }
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">No files found for this status and filter combination.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                component="div"
                                count={pagination.total}
                                rowsPerPage={pagination.pageSize}
                                page={pagination.page}
                                onPageChange={handlePageChange}
                                onRowsPerPageChange={handleRowsPerPageChange}
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}

export default FilesByStatus;