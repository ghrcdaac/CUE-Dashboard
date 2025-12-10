import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Box, Card, CardContent, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Typography, Checkbox,
    TablePagination, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, TableSortLabel, CircularProgress, MenuItem, Container, Alert,
    Autocomplete
} from "@mui/material";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useOutletContext, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBoxIcon from '@mui/icons-material/AccountBox';

import usePageTitle from '../hooks/usePageTitle';
import useAuth from '../hooks/useAuth';
import usePrivileges from '../hooks/usePrivileges';
import { parseApiError } from '../utils/errorUtils';
import * as providerApi from '../api/providerApi';
import ExportMenu from "./reports/ExportMenu";
import { generatePDFReport } from "./reports/PdfReport";

// Import the new Redux cache actions
import { fetchProviders, fetchUsers } from '../app/reducers/dataCacheSlice';

const headCells = [
    { id: 'short_name', label: 'Short Name' },
    { id: 'long_name', label: 'Long Name' },
    { id: 'can_upload', label: 'Can Upload' },
    { id: 'point_of_contact.id', label: 'Point of Contact' },
    { id: 'reason', label: 'Reason' },
];

function Providers() {
    usePageTitle("Providers");
    const dispatch = useDispatch();
    const { activeNgroupId } = useAuth();
    const { hasPrivilege } = usePrivileges();
    const { setMenuItems } = useOutletContext();
    const location = useLocation();
    
    const { providers, users } = useSelector((state) => state.dataCache);

    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0); // 0-based for MUI TablePagination
    const pagination = {
        page: currentPage,
        pageSize: rowsPerPage,
        total: providers.total ?? 0
    };
    const [loadingPages, setLoadingPages] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [dialog, setDialog] = useState({ open: null, data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UPDATED: Restored the missing state declaration for sorting
    const [sorting, setSorting] = useState({ orderBy: 'short_name', order: 'asc' });

    const [mergedUsers, setMergedUsers] = useState([]);
    const [filteredCount, setFilteredCount] = useState(0);
    const didMount = useRef(false);
    
    useEffect(() => {
        const providersMenuItems = [{ text: 'Providers', path: '/providers', icon: <AccountBoxIcon /> }];
        setMenuItems(providersMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    useEffect(() => {
        if (activeNgroupId) {
            if (providers.status === 'idle' || !didMount.current) {
                dispatch(fetchProviders({ page: 1, pageSize: 50 }));
                didMount.current = true;
            }
            if (users.status === 'idle') dispatch(fetchUsers({ page: 1, pageSize: 50 }));
        }
    }, [activeNgroupId, providers.status, users.status, dispatch]);

    useEffect(() => {
        const isLoading = providers.status === 'loading' || users.status === 'loading';
        setLoading(isLoading);
    }, [providers.status, users.status]);

    useEffect(() => {
        if (!users || !users.data) return;

        const page = users.page;

        // avoids duplicate user calls when scrolling 
        // Remove this page from loadingPages when it finishes
        setLoadingPages(prev => {
            const newSet = new Set(prev);
            newSet.delete(page);
            return newSet;
        });

        const newPageStart = users.cacheStart;
        const newPageSize = users.data.length;

        setMergedUsers(prev => {
            // First load → set directly
            if (prev.length === 0) {
                return users.data;
            }

            // SCROLL DOWN (next page)
            if (newPageStart > prev.length - newPageSize) {
                return [...prev, ...users.data];
            }

            // SCROLL UP (previous page)
            if (newPageStart < 0) {
                return [...users.data, ...prev];
            }

            return prev; // default
        });
    }, [users.data]);

    useEffect(() => {
        setCurrentPage(0);
    }, [searchTerm, filter]);

    useEffect(() => {
        const maxPage = Math.floor((providers.total - 1) / rowsPerPage) || 0;

        // if currentPage is invalid, reset to 0
        if (currentPage > maxPage) {
            setCurrentPage(0);
        }
    }, [activeNgroupId, providers.total]);

    const processedProviders = useMemo(() => {
        if (!providers.data || !users.data) return [];
        
        const allProvidersWithDetails = providers.data.map(provider => ({
            ...provider,
        }));

        let list = [...allProvidersWithDetails];
        if (filter === 'active') list = list.filter(p => p.can_upload);
        else if (filter === 'suspended') list = list.filter(p => !p.can_upload);

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            list = list.filter(p =>
                p.short_name?.toLowerCase().includes(lowercasedTerm) ||
                p.long_name?.toLowerCase().includes(lowercasedTerm) ||
                p.point_of_contact.name?.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        list.sort((a, b) => {
            const isAsc = sorting.order === 'asc' ? 1 : -1;
            const aValue = a[sorting.orderBy];
            const bValue = b[sorting.orderBy];
            if (aValue === null || aValue === undefined) return 1 * isAsc;
            if (bValue === null || bValue === undefined) return -1 * isAsc;
            if (typeof aValue === 'boolean') return (aValue === bValue ? 0 : aValue ? -1 : 1) * isAsc;
            return aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true }) * isAsc;
        });

        const newFilteredCount = list.length;

        if (newFilteredCount !== filteredCount) {
            setFilteredCount(newFilteredCount);
        }
        
        let startIndex, endIndex;
        // Prevent negative or out-of-range pages
        const safePage = Math.max(
            0,
            Math.min(
                currentPage,
                Math.floor((list.length - 1) / rowsPerPage)  // max valid page
            )
        );

        if (searchTerm || filter !== 'all') {
            // SCENARIO 1: SEARCHING/FILTERING
            // List contains the *entire* locally filtered/sorted set.
            startIndex = safePage * rowsPerPage;
            endIndex = startIndex + rowsPerPage;
        } else {
            // SCENARIO 2: NORMAL VIEW (PAGINATING THROUGH CACHE CHUNKS)
            startIndex = Math.max(0, pagination.page * rowsPerPage - (providers.cacheStart ?? 0));
            endIndex = Math.min(list.length, startIndex + rowsPerPage);
        }
        
        return list.slice(startIndex, endIndex);
    }, [providers.data, users.data, sorting, searchTerm, filter, pagination.page, rowsPerPage]);

    const handleOpenDialog = (type, data = null) => {
        if (type === 'edit') {
            const providerToEdit = processedProviders.find(p => p.id === selected[0]);
            setDialog({ open: 'edit', data: { ...providerToEdit } });
        } else {
            setDialog({ open: type, data });
        }
    };

    const handleCloseDialog = () => setDialog({ open: null, data: null });

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const { data } = dialog;
        if (!data.can_upload && !data.reason?.trim()) {
            toast.error("Reason is required when a provider cannot upload.");
            return;
        }
        setIsSubmitting(true);
        try {
            const { id, short_name, long_name, can_upload, point_of_contact, reason } = data;
            const payload = {
                    short_name,
                    long_name,
                    can_upload,
                    point_of_contact: point_of_contact?.id || null, // send only the ID
                    reason: can_upload ? null : reason
            };
            if (dialog.open === 'create') {
                await providerApi.createProvider({ ...payload, ngroup_id: activeNgroupId });
                toast.success("Provider created successfully!");
            } else if (dialog.open === 'edit') {
                await providerApi.updateProvider(id, payload);
                toast.success("Provider updated successfully");
            }
            handleCloseDialog();
            setSelected([]);

            if (users.page !== 1) {
                dispatch(fetchUsers({ page: 1, pageSize: 50 }));
            }

            const apiPage = Math.floor((currentPage * rowsPerPage) / 50) + 1;
            dispatch(fetchProviders({ page: apiPage, pageSize: 50 }));
           
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleConfirmDelete = async () => {
        setIsSubmitting(true);
        try {
            await Promise.all(selected.map(providerId => providerApi.deleteProvider(providerId)));
            toast.success("Provider(s) deleted successfully!");
            setSelected([]);
            handleCloseDialog();
            const apiPage = Math.floor((currentPage * rowsPerPage) / 50) + 1;
            dispatch(fetchProviders({ page: apiPage, pageSize: 50 }));
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestSort = (property) => {
        const isAsc = sorting.orderBy === property && sorting.order === 'asc';
        setSorting({ order: isAsc ? 'desc' : 'asc', orderBy: property });
    };

    const handleSelectAllClick = (event) => setSelected(event.target.checked ? processedProviders.map(p => p.id) : []);

    const handleRowClick = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) { newSelected = newSelected.concat(selected, id); }
        else if (selectedIndex > -1) { newSelected = selected.filter(selId => selId !== id); }
        setSelected(newSelected);
    };

    const isWithinCache = (newPage) => {

        if (providers.total <= providers.cacheSize) {
            return true;
        }

        const startIndex = newPage * rowsPerPage;// use UI rowsPerPage
        const endIndex = startIndex + rowsPerPage;

        const cacheStart = providers.cacheStart ?? 0;
        const cacheEnd = cacheStart + (providers.cacheSize ?? 0);  // usually 50

        return startIndex >= cacheStart && endIndex <= cacheEnd;
    };

    const handlePageChange = (event, newPage) => {
         setCurrentPage(newPage); // Pagination.page gets updated

        if (!isWithinCache(newPage)) {
            const apiPageSize = 50; // chunk size
            const startIndex = newPage * rowsPerPage;
            const apiPage = Math.floor(startIndex / apiPageSize) + 1;
            dispatch(fetchProviders({ page: apiPage, pageSize: apiPageSize }));
        }
    };

    const handleRowsPerPageChange = (event) => {
        const newSize = parseInt(event.target.value, 10);
        setCurrentPage(0);//bring back the page to 0 when the rowsperpage change
        
        if (!isWithinCache(0)) {
            const apiPageSize = 50; // chunk size
            const startIndex = 0;
            const apiPage = Math.floor(startIndex / apiPageSize) + 1;
            dispatch(fetchProviders({ page: apiPage, pageSize: apiPageSize }));
        }
        setRowsPerPage(newSize);  // only update UI rows per page
    };
    
    const handleExportProviders = async (format) => {
        const info = {
                start: new Date().toLocaleString(),
                end: new Date().toLocaleString()
        };
        if (format !== 'pdf') return;
        try {
            const suspended = processedProviders.filter(p => !p.can_upload);
            if (suspended.length === 0) {
                toast.info("There are no suspended providers to export based on current filters.");
                return;
            }
            const columns = [
                { header: "Short Name", dataKey: "short_name" },
                { header: "Long Name", dataKey: "long_name" },
                { header: "Point of Contact", dataKey: "point_of_contact_name" },
                { header: "Reason", dataKey: "reason" },
            ];
            generatePDFReport("Suspended Providers Report", columns, suspended, null, info);
        } catch (err) {
            toast.error("Failed to export suspended providers: " + parseApiError(err));
        }
    };

    if (location.pathname !== '/providers') {
        return <Outlet key={location.pathname} />;
    }

    const handleUsersScroll = (event) => {
        const listbox = event.currentTarget;

        // Scroll Down
        if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 20) {

            const nextPage = Math.floor(mergedUsers.length / users.pageSize) + 1;

            // STOP if all data is loaded
            if (mergedUsers.length >= users.total) return;

            // STOP if already loaded
            if (users.loadedPages?.includes(nextPage)) return;

            // STOP if already loading
            if (loadingPages.has(nextPage)) return;

            // Mark as loading
            setLoadingPages(prev => new Set(prev).add(nextPage));

            dispatch(fetchUsers({ page: nextPage, pageSize: users.pageSize }));
        }

        // Scroll up
        if (listbox.scrollTop === 0) {

            // Stop if already at the beginning
            if (mergedUsers.length >= users.total) return;

            const previousPage = Math.max(1, users.cacheStart / users.pageSize);

            // Avoid re-fetch
            if (users.loadedPages?.includes(previousPage)) return;

            dispatch(fetchUsers({ page: previousPage, pageSize: users.pageSize }));
        }
    };


    return (
        <Container maxWidth={false} disableGutters>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h5">Providers</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <TextField label="Search Providers" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <TextField select label="Filter by Status" value={filter} onChange={(e) => setFilter(e.target.value)} size="small" sx={{ minWidth: 180 }}>
                                <MenuItem value="all">All Providers</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="suspended">Suspended</MenuItem>
                            </TextField>
                            {hasPrivilege('provider:read') && <ExportMenu onExport={handleExportProviders} />}
                            <Button variant="contained" onClick={() => handleOpenDialog('create', { short_name: '', long_name: '', can_upload: true, point_of_contact: null, reason: ''})} startIcon={<AddIcon />} disabled={!hasPrivilege('provider:create')}>Add</Button>
                            <Button variant="contained" onClick={() => handleOpenDialog('edit')} disabled={selected.length !== 1 || !hasPrivilege('provider:update')} startIcon={<EditIcon />}>Edit</Button>
                            <Button variant="contained" color="error" onClick={() => handleOpenDialog('delete')} disabled={selected.length === 0 || !hasPrivilege('provider:delete')} startIcon={<DeleteIcon />}>Delete</Button>
                        </Box>
                    </Box>
                    
                    {(providers.error || users.error) && <Alert severity="error" sx={{ mb: 2 }}>{providers.error || users.error}</Alert>}
                    
                    <TableContainer component={Paper}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < processedProviders.length} checked={processedProviders.length > 0 && selected.length === processedProviders.length} onChange={handleSelectAllClick} /></TableCell>
                                    {headCells.map(headCell => (
                                        <TableCell key={headCell.id} sortDirection={sorting.orderBy === headCell.id ? sorting.order : false}>
                                            <TableSortLabel active={sorting.orderBy === headCell.id} direction={sorting.orderBy === headCell.id ? sorting.order : 'asc'} onClick={() => handleRequestSort(headCell.id)}>
                                                {headCell.label}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                                ) : processedProviders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography sx={{ py: 5 }} color="text.secondary">
                                                {searchTerm || filter !== 'all' ? "No providers match your search or filter." : "No providers found."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    processedProviders.map(provider => {
                                        const isItemSelected = selected.indexOf(provider.id) !== -1;
                                        return (
                                            <TableRow key={provider.id} hover onClick={() => handleRowClick(provider.id)} role="checkbox" tabIndex={-1} selected={isItemSelected}>
                                                <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                <TableCell>{provider.short_name}</TableCell>
                                                <TableCell>{provider.long_name}</TableCell>
                                                <TableCell>{provider.can_upload ? 'Yes' : 'No'}</TableCell>
                                                <TableCell>{provider.point_of_contact.name}</TableCell>
                                                <TableCell>{provider.reason || ''}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={searchTerm || filter !== 'all' ? filteredCount : pagination.total}
                        rowsPerPage={pagination.pageSize}
                        page={pagination.page}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                    />
                </CardContent>
            </Card>

            <Dialog open={dialog.open === 'create' || dialog.open === 'edit'} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>{dialog.open === 'create' ? 'Create New Provider' : 'Edit Provider'}</DialogTitle>
                <Box component="form" id="provider-form" onSubmit={handleFormSubmit}>
                    <DialogContent>
                        {dialog.data && (
                            <>
                                <TextField autoFocus margin="dense" name="short_name" label="Provider Short Name" fullWidth value={dialog.data.short_name} onChange={(e) => setDialog({...dialog, data: {...dialog.data, short_name: e.target.value}})} required />
                                <TextField margin="dense" name="long_name" label="Provider Long Name" fullWidth value={dialog.data.long_name} onChange={(e) => setDialog({...dialog, data: {...dialog.data, long_name: e.target.value}})} />
                                <Autocomplete
                                    fullWidth
                                    options={mergedUsers}
                                    getOptionLabel={(option) => option.name || ""}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    
                                    // Use cached user OR fallback to provider's existing point_of_contact
                                    value={
                                        mergedUsers.find(u => u.id === dialog.data.point_of_contact?.id) ||
                                        (dialog.data.point_of_contact?.id ? dialog.data.point_of_contact : null)
                                    }

                                    ListboxProps={{ onScroll: handleUsersScroll }}
                                    loading={users.status === 'loading'}

                                    onChange={(e, newValue) => {
                                        // Store both id and name
                                        setDialog({
                                            ...dialog,
                                            data: { 
                                                ...dialog.data, 
                                                point_of_contact: newValue 
                                                    ? { id: newValue.id, name: newValue.name } 
                                                    : null 
                                            }
                                        });
                                    }}

                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Point of Contact"
                                            margin="dense"
                                        />
                                    )}
                                />
                                <TextField fullWidth select label="Can Upload" name="can_upload" value={dialog.data.can_upload} onChange={(e) => setDialog({...dialog, data: {...dialog.data, can_upload: e.target.value === true }})} margin="dense">
                                    <MenuItem value={true}>Yes</MenuItem>
                                    <MenuItem value={false}>No</MenuItem>
                                </TextField>
                                {!dialog.data.can_upload && (
                                    <TextField margin="dense" name="reason" label="Reason for Suspension" fullWidth value={dialog.data.reason || ""} onChange={(e) => setDialog({...dialog, data: {...dialog.data, reason: e.target.value}})} required />
                                )}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : (dialog.open === 'create' ? 'Create' : 'Save')}</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={dialog.open === 'delete'} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>Are you sure you want to delete the {selected.length} selected provider(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : 'Delete'}</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Providers;