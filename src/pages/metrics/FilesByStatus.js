import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, CircularProgress, Alert, Table, 
    TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    TablePagination, Tabs, Tab, Container
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Localization for MetricsFilter
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Hooks, Components & Utils
import usePageTitle from "../../hooks/usePageTitle";
import { parseApiError } from '../../utils/errorUtils';
import MetricsFilter from './MetricsFilter';

// API
import { listFiles } from '../../api/fileApi';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';
import ExportMenu from '../reports/ExportMenu';
import { generatePDFReport } from '../reports/PdfReport';

const FILE_STATUSES = ["unscanned", "clean", "infected", "scan_failed", "distributed"];

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
    const { setMenuItems } = useOutletContext();
    
    const { collections } = useSelector((state) => state.filterOptions);

    // State
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilters, setActiveFilters] = useState({});
    const [selectedStatusTab, setSelectedStatusTab] = useState(FILE_STATUSES[0]);
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });

    const collectionMap = useMemo(() => {
        if (!collections || collections.length === 0) return new Map();
        return new Map(collections.map(c => [c.id, c.short_name]));
    }, [collections]);

    useEffect(() => {
        const metricsMenuItems = [
            { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
            { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
            { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> }
        ];
        setMenuItems(metricsMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    const fetchFiles = useCallback(() => {
        setLoading(true);
        setError(null);

        const params = {
            ...activeFilters,
            status: selectedStatusTab,
            page: pagination.page + 1,
            page_size: pagination.pageSize,
        };
        // Note: ngroup_id is sent automatically as a header by your apiClient

        listFiles(params)
            .then(response => {
                setFiles(response.items || []);
                setPagination(prev => ({ ...prev, total: response.total || 0 }));
            })
            .catch(err => {
                const errorMessage = parseApiError(err);
                setError(errorMessage);
                toast.error(`Failed to load files: ${errorMessage}`);
            })
            .finally(() => setLoading(false));
    }, [activeFilters, selectedStatusTab, pagination.page, pagination.pageSize]);
    
    useEffect(() => {

        fetchFiles();
    }, [fetchFiles]);
    
    const handleApplyFilters = (filters) => {
        setPagination(prev => ({ ...prev, page: 0 }));
        setActiveFilters(filters);

    };

    const handleClearFilters = () => {
        setPagination(prev => ({ ...prev, page: 0 }));
        setActiveFilters({});
    };

    const handleTabChange = (event, newValue) => {
        setPagination(prev => ({ ...prev, page: 0 }));
        setSelectedStatusTab(newValue);
    };


    const handlePageChange = (event, newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleRowsPerPageChange = (event) => {
        setPagination(prev => ({ ...prev, pageSize: parseInt(event.target.value, 10), page: 0 }));

    };

    return (

        <Container maxWidth={false} disableGutters>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                                {FILE_STATUSES.map(status => <Tab label={status.replace('_', ' ').toUpperCase()} value={status} key={status} />)}
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
                                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                                            {JSON.stringify(file.scan_results, null, 2)}
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
            </LocalizationProvider>
        </Container>

    );
}

export default FilesByStatus;