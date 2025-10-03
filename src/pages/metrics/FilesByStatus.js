import React, { useState, useEffect, useCallback, useMemo  } from 'react';
import {
    Box, Card, CardContent, Typography, CircularProgress, Alert, Table, 
    TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    TablePagination, Tabs, Tab, Container, TextField, TableSortLabel
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Hooks, Components & Utils
import usePageTitle from "../../hooks/usePageTitle";
import sessionService from '../../services/sessionService';
import { parseApiError } from '../../utils/errorUtils';
import MetricsFilter from './MetricsFilter';
import ExportMenu from '../reports/ExportMenu';
import { generatePDFReport } from '../reports/PdfReport';

// API
import { listFiles } from '../../api/fileApi';
import { fetchFilterOptions } from '../../app/reducers/filterOptionsSlice'; 

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';
import SearchIcon from '@mui/icons-material/Search';

const FILE_STATUSES = ["unscanned", "clean", "infected", "scan_failed", "distributed"];
const API_MAX_PAGE_SIZE = 100;

const formatBytes = (bytes) => {
    if (bytes == null || isNaN(bytes)) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Fix for non-standard ISO timestamps that may be missing the decimal separator
    const standardDateString = dateString.replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\d+)(Z)/, '$1.$2$3');
    const date = new Date(standardDateString);
    if (isNaN(date)) return 'Invalid Date';
    return date.toLocaleString();
};

const baseHeadCells = [
    { id: 'name', label: 'File Name' },
    { id: 'collection_name', label: 'Collection' },
    { id: 'size_bytes', label: 'Size' },
    { id: 'upload_time', label: 'Upload Time' },
];

const ScanResultsDisplay = ({ results }) => {
    if (!results) {
        return <Typography variant="body2" color="text.secondary">Scan result data not available.</Typography>;
    }
    
    let resultsArray = Array.isArray(results) ? results : [results];
    if (resultsArray.length > 0 && resultsArray[0].scanResults) {
        resultsArray = resultsArray[0].scanResults;
    }

    if (resultsArray.length === 0) {
        return <Typography variant="body2" color="text.secondary">No detailed results.</Typography>;
    }

    return (
        <Box>
            {resultsArray.map((scan, index) => (
                <Box key={index} sx={{ mb: index < resultsArray.length - 1 ? 2 : 0 }}>
                    <Typography variant="body2" component="div"><strong>Engine:</strong> {scan.engine || 'N/A'}</Typography>
                    <Typography variant="body2" component="div"><strong>Result:</strong> {scan.result || 'N/A'}</Typography>
                    {scan.virusName && scan.virusName.length > 0 && (
                        <Typography variant="body2" component="div"><strong>Viruses:</strong> {scan.virusName.join(', ')}</Typography>
                    )}
                    {scan.message && scan.message.length > 0 && (
                         <Typography variant="body2" component="div"><strong>File ID:</strong> {scan.message.join(', ')}</Typography>
                    )}
                    <Typography variant="body2" component="div"><strong>Scanned:</strong> {formatDisplayDate(scan.dateScanned)}</Typography>
                </Box>
            ))}
        </Box>
    );
};

function FilesByStatus() {
    usePageTitle("Files by Status");
    const { setMenuItems } = useOutletContext();
    const ngroupId = useMemo(() => sessionService.getSession()?.active_ngroup_id || null, []);
    const { collections, status } = useSelector((state) => state.filterOptions);
    const dispatch = useDispatch();

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilters, setActiveFilters] = useState({});
    const [selectedStatusTab, setSelectedStatusTab] = useState(FILE_STATUSES[0]);
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const [sorting, setSorting] = useState({ orderBy: 'name', order: 'asc' });

    useEffect(() => {
        if (status === 'idle' && ngroupId) {
            dispatch(fetchFilterOptions({ ngroupId }));
        }
    }, [status, dispatch, ngroupId]);

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

    const fetchFiles = useCallback(async () => {
        if (!ngroupId) { setLoading(false); return; }
        setLoading(true);
        setError(null);

        try {
            const initialParams = { ...activeFilters, status: selectedStatusTab, page: 1, page_size: API_MAX_PAGE_SIZE };
            const initialResponse = await listFiles(initialParams);
            let allItems = initialResponse.items || [];
            const totalItems = initialResponse.total || 0;

            if (totalItems > API_MAX_PAGE_SIZE) {
                const totalPages = Math.ceil(totalItems / API_MAX_PAGE_SIZE);
                const pagePromises = [];
                for (let page = 2; page <= totalPages; page++) {
                    pagePromises.push(listFiles({ ...initialParams, page }));
                }
                const additionalResponses = await Promise.all(pagePromises);
                additionalResponses.forEach(res => { allItems = allItems.concat(res.items || []); });
            }
            
            const filesWithCollectionNames = allItems.map(file => ({
                ...file,
                collection_name: collectionMap.get(file.collection_id) || file.collection_id,
            }));
            setFiles(filesWithCollectionNames);
            setPagination(prev => ({ ...prev, page: 0 }));
        } catch (err) {
            const errorMessage = parseApiError(err);
            setError(errorMessage);
            toast.error(`Failed to load files: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [ngroupId, activeFilters, selectedStatusTab, collectionMap]);
    
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);
    
    const processedFiles = useMemo(() => {
        let filtered = [...files];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(file => file.name?.toLowerCase().includes(lowercasedTerm));
        }

        return filtered.sort((a, b) => {
            const isAsc = sorting.order === 'asc' ? 1 : -1;
            const aValue = a[sorting.orderBy] || '';
            const bValue = b[sorting.orderBy] || '';
            return aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true }) * isAsc;
        });
    }, [files, sorting, searchTerm]);

    const handleApplyFilters = (filters) => {
        setPagination(prev => ({ ...prev, page: 0 }));
        setActiveFilters(filters);
    };

    const handleClearFilters = () => {
        setPagination(prev => ({ ...prev, page: 0 }));
        setActiveFilters({});
        setSearchTerm('');
    };

    const handleTabChange = (event, newValue) => {
        setPagination(prev => ({ ...prev, page: 0 }));
        setSelectedStatusTab(newValue);
    };

    const handleRequestSort = (property) => {
        const isAsc = sorting.orderBy === property && sorting.order === 'asc';
        setSorting({ order: isAsc ? 'desc' : 'asc', orderBy: property });
    };

    const visibleHeadCells = useMemo(() => {
        let dynamicCells = [...baseHeadCells];
        if (selectedStatusTab === 'distributed') {
            dynamicCells.push({ id: 'egress_start', label: 'Distributed Time' });
        }
        return dynamicCells;
    }, [selectedStatusTab]);

    const handleExport = async (format) => {
        if (format !== "pdf") return; //can extend for CSV/XLSX later
        
        try {
            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);

            const userInfo = {
            name: localStorage.getItem("CUE_username"),
            start: activeFilters?.start_date || sevenDaysAgo.toISOString().split('T')[0],
            end: activeFilters?.end_date || now.toISOString().split('T')[0],
            };

            // Fetch all files (if not already fully loaded)
            let allFiles = [];
            let page = 1;
            const pageSize = 100;
            let total = 0;

            do {
            const params = {
                ngroup_id: ngroupId,
                status: selectedStatusTab,
                ...activeFilters,
                page,
                page_size: pageSize,
            };

            const res = await listFiles(params);
            allFiles = allFiles.concat(res?.items || []);
            total = res?.total || 0;
            page++;
            } while (allFiles.length < total);

            // Add collection names
            const filesWithCollections = allFiles.map((file) => ({
            ...file,
            collection_name: collectionMap.get(file.collection_id) || file.collection_id,
            }));

            // Define columns dynamically
            let columns = [
            { header: "File Name", dataKey: "name" },
            { header: "Collection", dataKey: "collection_name" },
            { header: "Size", dataKey: "size_bytes" },
            ];

            if (selectedStatusTab === "failed") {
            columns.push({ header: "Failure Reason", dataKey: "failure_reason" });
            }

            if (selectedStatusTab === "infected" || selectedStatusTab === "scan_failed") {
            columns.push({ header: "Scan Result", dataKey: "scan_results" });
            }

            if (selectedStatusTab === "suspended") {
            columns.push({ header: "Suspension Reason", dataKey: "reason" });
            }

            if (selectedStatusTab === "distributed") {
            columns.push({ header: "Distributed Time", dataKey: "egress_start" });
            }

            if (selectedStatusTab === "clean") {
            columns.push({ header: "Scan Start", dataKey: "scan_start" });
            columns.push({ header: "Scan End", dataKey: "scan_end" });
            }

            if (selectedStatusTab === "unscanned") {
            columns.push({ header: "Upload Time", dataKey: "upload_time" });
            }

            const dateFields = [
            "upload_time",
            "egress_start",
            "scan_start",
            "scan_end",
            "dateScanned",
            ];

            const sizeFields = ["size_bytes"];

            const rows = filesWithCollections.map((f) => {
            const row = {};
            columns.forEach((c) => {
                let value = f[c.dataKey] ?? "";
                // Format date fields
                if (dateFields.includes(c.dataKey) && value) {
                value = formatDisplayDate(value);
                }

                // Format size fields
                if (sizeFields.includes(c.dataKey) && value !== "") {
                value = formatBytes(value);
                }

                row[c.dataKey] = value;
            });
            return row;
            });
            await generatePDFReport(`${selectedStatusTab} Files`, columns, rows, null, userInfo);
            toast.success("PDF report generated successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to download files report: " + err.message);
        }
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                            <Typography variant="h5">Files by Status</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField 
                                    label="Search by File Name"
                                    variant="outlined"
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{ startAdornment: ( <SearchIcon fontSize="small" sx={{ mr: 1 }} /> ) }}
                                />
                                <ExportMenu onExport={handleExport} />
                            </Box>
                        </Box>
                        
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs value={selectedStatusTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                                {FILE_STATUSES.map(status => <Tab label={status.replace('_', ' ').toUpperCase()} value={status} key={status} />)}
                            </Tabs>
                        </Box>

                        {loading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box> ) : 
                         error ? ( <Alert severity="error" sx={{ my: 2 }}>{error}</Alert> ) : (
                            <>
                                <TableContainer component={Paper}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {visibleHeadCells.map(headCell => (
                                                    <TableCell key={headCell.id} sortDirection={sorting.orderBy === headCell.id ? sorting.order : false}>
                                                        <TableSortLabel active={sorting.orderBy === headCell.id} direction={sorting.orderBy === headCell.id ? sorting.order : 'asc'} onClick={() => handleRequestSort(headCell.id)}>
                                                            {headCell.label}
                                                        </TableSortLabel>
                                                    </TableCell>
                                                ))}
                                                {(selectedStatusTab === 'infected' || selectedStatusTab === 'scan_failed' || selectedStatusTab === 'distributed') && <TableCell>Scan Results</TableCell>}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {processedFiles.length > 0 ? processedFiles.slice(pagination.page * pagination.pageSize, pagination.page * pagination.pageSize + pagination.pageSize).map((file) => (
                                                <TableRow hover key={file.id}>
                                                    <TableCell>{file.name}</TableCell>
                                                    <TableCell>{file.collection_name}</TableCell>
                                                    <TableCell>{formatBytes(file.size_bytes)}</TableCell>
                                                    <TableCell>{formatDisplayDate(file.upload_time)}</TableCell>
                                                    {selectedStatusTab === 'distributed' && (
                                                        <TableCell>{formatDisplayDate(file.egress_start)}</TableCell>
                                                    )}
                                                    {(selectedStatusTab === 'infected' || selectedStatusTab === 'scan_failed' || selectedStatusTab === 'distributed') && 
                                                        <TableCell>
                                                            <ScanResultsDisplay results={file.scan_results} />
                                                        </TableCell>
                                                    }
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={visibleHeadCells.length + 1} align="center">
                                                        <Typography sx={{ py: 3 }} color="text.secondary">
                                                            {searchTerm ? "No files match your search." : "No files found for this status."}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                    component="div"
                                    count={processedFiles.length}
                                    rowsPerPage={pagination.pageSize}
                                    page={pagination.page}
                                    onPageChange={(e, newPage) => setPagination(prev => ({...prev, page: newPage}))}
                                    onRowsPerPageChange={(e) => setPagination({ ...pagination, pageSize: parseInt(e.target.value, 10), page: 0 })}
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