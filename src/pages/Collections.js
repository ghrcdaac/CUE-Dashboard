import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    TablePagination, TableSortLabel, Checkbox, CircularProgress, Dialog, 
    DialogTitle, DialogContent, DialogActions, Autocomplete, MenuItem, Container, Alert
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CollectionsIcon from '@mui/icons-material/Collections';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

import usePageTitle from "../hooks/usePageTitle";
import useAuth from '../hooks/useAuth';
import usePrivileges from '../hooks/usePrivileges';
import { parseApiError } from '../utils/errorUtils';

import * as collectionApi from '../api/collectionApi';
// UPDATED: Import the new Redux cache actions
import { fetchCollections, fetchProviders, fetchEgresses } from '../app/reducers/dataCacheSlice';

const headCells = [
    { id: 'short_name', label: 'Short Name' },
    { id: 'provider_name', label: 'Provider' },
    { id: 'egress_path', label: 'Egress Path' },
    { id: 'active', label: 'Status' },
];

function Collections() {
    usePageTitle("Collections");

    const dispatch = useDispatch();
    const { setMenuItems } = useOutletContext();
    const { hasPrivilege } = usePrivileges();
    const location = useLocation();
    const { activeNgroupId } = useAuth(); // Use reactive value for DAAC changes

    // Get all foundational data from the central Redux cache
    const { collections, providers, egresses } = useSelector((state) => state.dataCache);

    // Local state for UI operations
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0); // 0-based for MUI TablePagination
    const pagination = {
        page: currentPage,
        pageSize: rowsPerPage,
        total: collections.total ?? 0
    };
    const [providerLoadingPages, setProviderLoadingPages] = useState(new Set());
    const [egressLoadingPages, setEgressLoadingPages] = useState(new Set());
    const [mergedProviders, setMergedProviders] = useState([]);
    const [mergedEgress, setMergedEgress] = useState([]);
    const [sorting, setSorting] = useState({ orderBy: 'short_name', order: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [dialog, setDialog] = useState({ open: null, data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const firstSelectedStatus = useMemo(() => {
        if (selected.length === 0) return true;
        return collections.data.find(c => c.id === selected[0])?.active;
    }, [selected, collections.data]);

    useEffect(() => {
        const collectionsMenuItems = [
            { text: 'Collections List', path: '/collections', icon: <CollectionsIcon /> },
            // { text: 'Create Collection', path: '/collections/create', icon: <FolderIcon /> },
            // { text: 'Browse Files', path: '/collections/files', icon: <InsertDriveFileIcon /> },
        ];
        setMenuItems(collectionsMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    // "Smart" data fetching effect that uses the cache
    useEffect(() => {
        if (activeNgroupId) {
            if (collections.status === 'idle') dispatch(fetchCollections({ page: 1, pageSize: 50 }));
            if (providers.status === 'idle') dispatch(fetchProviders({ page: 1, pageSize: 50 }));
            if (egresses.status === 'idle') dispatch(fetchEgresses({ page: 1, pageSize: 50 }));
        }
    }, [activeNgroupId, collections.status, providers.status, egresses.status, dispatch]);

    // Derives the page's loading state from the cache statuses
    useEffect(() => {
        const isLoading = collections.status === 'loading' || providers.status === 'loading' || egresses.status === 'loading';
        setLoading(isLoading);
    }, [collections.status, providers.status, egresses.status]);

    useEffect(() => {
        if (!providers || !providers.data) return;

        const page = providers.page;

        // avoids duplicate provider calls when scrolling 
        // Remove this page from loadingPages when it finishes
        setProviderLoadingPages(prev => {
            const newSet = new Set(prev);
            newSet.delete(page);
            return newSet;
        });

        const newPageStart = providers.cacheStart;
        const newPageSize = providers.data.length;

        setMergedProviders(prev => {
            // First load → set directly
            if (prev.length === 0) {
                return providers.data;
            }

            // SCROLL DOWN (next page)
            if (newPageStart > prev.length - newPageSize) {
                return [...prev, ...providers.data];
            }

            // SCROLL UP (previous page)
            if (newPageStart < 0) {
                return [...providers.data, ...prev];
            }

            return prev; // default
        });
    }, [providers.data]);

    useEffect(() => {
        if (!egresses || !egresses.data) return;

        const page = egresses.page;

        // avoids duplicate egress calls when scrolling 
        // Remove this page from loadingPages when it finishes
        setEgressLoadingPages(prev => {
            const newSet = new Set(prev);
            newSet.delete(page);
            return newSet;
        });

        const newPageStart = egresses.cacheStart;
        const newPageSize = egresses.data.length;

        setMergedEgress(prev => {
            // First load → set directly
            if (prev.length === 0) {
                return egresses.data;
            }

            // SCROLL DOWN (next page)
            if (newPageStart > prev.length - newPageSize) {
                return [...prev, ...egresses.data];
            }

            // SCROLL UP (previous page)
            if (newPageStart < 0) {
                return [...egresses.data, ...prev];
            }

            return prev; // default
        });
    }, [egresses.data]);


    const processedCollections = useMemo(() => {
        if (!collections.data || !providers.data || !egresses.data) return [];

        const collectionsWithDetails = collections.data.map(collection => ({
            ...collection,
            provider_name: collection.provider?.name || 'N/A',
            egress_path: collection.egress?.path || 'N/A',
        }));



        let filtered = [...collectionsWithDetails];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(c => 
                c.short_name.toLowerCase().includes(lowercasedTerm) ||
                c.provider_name.toLowerCase().includes(lowercasedTerm) ||
                c.egress_path.toLowerCase().includes(lowercasedTerm)
            );
        }

        filtered.sort((a, b) => {
            const isAsc = sorting.order === 'asc' ? 1 : -1;
            const aValue = a[sorting.orderBy];
            const bValue = b[sorting.orderBy];
            if (aValue === null || aValue === undefined) return 1 * isAsc;
            if (bValue === null || bValue === undefined) return -1 * isAsc;
            if (typeof aValue === 'boolean') return (aValue === bValue ? 0 : aValue ? -1 : 1) * isAsc;
            return aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true }) * isAsc;
        });
        const startIndex = pagination.page * rowsPerPage - (collections.cacheStart ?? 0);
        const endIndex = startIndex + rowsPerPage;

        return filtered.slice(startIndex, endIndex);
    }, [collections.data, providers.data, egresses.data, sorting, searchTerm, pagination.page, rowsPerPage]);
    
    const handleOpenDialog = (dialogType, data = null) => {
        if (dialogType === 'edit') {
            const collectionToEdit = processedCollections.find(c => c.id === selected[0]);
            setDialog({ open: 'edit', data: { ...collectionToEdit } });
        } else {
            setDialog({ open: dialogType, data });
        }
    };
    const handleCloseDialog = () => setDialog({ open: null, data: null });

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { short_name, provider, egress, active } = dialog.data;
            const payload = {
                    short_name: short_name,
                    provider_id: provider?.id || null,
                    egress_id: egress?.id || null,
                    active: active
            };
            if (dialog.open === 'create') {
                await collectionApi.createCollection({...payload});
                toast.success("Collection created successfully!");
            } else if (dialog.open === 'edit') {
                await collectionApi.updateCollection(dialog.data.id, {...payload });
                toast.success("Collection updated successfully");
            }
            handleCloseDialog();
            setSelected([]);

            if (providers.page !== 1) {
                dispatch(fetchProviders({ page: 1, pageSize: 50 }));
            }
            if (egresses.page !== 1) {
                dispatch(fetchEgresses({ page: 1, pageSize: 50 }));
            }

            const apiPage = Math.floor((currentPage * rowsPerPage) / 50) + 1;
            dispatch(fetchCollections({ page: apiPage, pageSize: 50 })); // Refresh the cache
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleConfirmDelete = async () => {
        setIsSubmitting(true);
        try {
            await Promise.all(selected.map(id => collectionApi.deleteCollection(id)));
            toast.success(`${selected.length} collection(s) deleted successfully!`);
            handleCloseDialog();
            setSelected([]);
            const apiPage = Math.floor((currentPage * rowsPerPage) / 50) + 1;
            dispatch(fetchCollections({ page: apiPage, pageSize: 50 })); // Refresh the cache
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleActiveToggle = async () => {
        if (selected.length === 0) return;
        setIsSubmitting(true);
        try {
            await Promise.all(selected.map(id => {
                const collection = processedCollections.find(c => c.id === id);
                return collection.active ? collectionApi.deactivateCollection(id) : collectionApi.activateCollection(id);
            }));
            toast.success("Collection status updated successfully!");
            setSelected([]);
            const apiPage = Math.floor((currentPage * rowsPerPage) / 50) + 1;
            dispatch(fetchCollections({ page: apiPage, pageSize: 50 })); // Refresh the cache
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestSort = (property) => {
        const isAsc = sorting.orderBy === property && sorting.order === 'asc';
        setSorting({ orderBy: property, order: isAsc ? 'desc' : 'asc' });
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            setSelected(processedCollections.map((n) => n.id));
            return;
        }
        setSelected([]);
    };

    const handleRowClick = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) { newSelected = newSelected.concat(selected, id); }
        else if (selectedIndex > -1) { newSelected = selected.filter(selId => selId !== id); }
        setSelected(newSelected);
    };

    const isWithinCache = (newPage) => {

        if (collections.total <= collections.cacheSize) {
            return true;
        }

        const startIndex = newPage * rowsPerPage;// use UI rowsPerPage
        const endIndex = startIndex + rowsPerPage;

        const cacheStart = collections.cacheStart ?? 0;
        const cacheEnd = cacheStart + (collections.cacheSize ?? 0);  // usually 50

        return startIndex >= cacheStart && endIndex <= cacheEnd;
    };

    const handlePageChange = (event, newPage) => {
         setCurrentPage(newPage); // Pagination.page gets updated

        if (!isWithinCache(newPage)) {
            const apiPageSize = 50; // chunk size
            const startIndex = newPage * rowsPerPage;
            const apiPage = Math.floor(startIndex / apiPageSize) + 1;
            dispatch(fetchCollections({ page: apiPage, pageSize: apiPageSize }));
        }
    };

    const handleRowsPerPageChange = (event) => {
        const newSize = parseInt(event.target.value, 10);
        setCurrentPage(0);//bring back the page to 0 when the rowsperpage change
        
        if (!isWithinCache(0)) {
            const apiPageSize = 50; // chunk size
            const startIndex = 0;
            const apiPage = Math.floor(startIndex / apiPageSize) + 1;
            dispatch(fetchCollections({ page: apiPage, pageSize: apiPageSize }));
        }
        setRowsPerPage(newSize);  // only update UI rows per page
    };

    const handleProvidersScroll = (event) => {
        const listbox = event.currentTarget;

        // Scroll Down
        if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 20) {

            const nextPage = Math.floor(mergedProviders.length / providers.pageSize) + 1;

            // STOP if all data is loaded
            if (mergedProviders.length >= providers.total) return;

            // STOP if already loaded
            if (providers.loadedPages?.includes(nextPage)) return;

            // STOP if already loading
            if (providerLoadingPages.has(nextPage)) return;

            // Mark as loading
            setProviderLoadingPages(prev => new Set(prev).add(nextPage));

            dispatch(fetchProviders({ page: nextPage, pageSize: providers.pageSize }));
        }

        // Scroll up
        if (listbox.scrollTop === 0) {

            // Stop if already at the beginning
            if (mergedProviders.length >= providers.total) return;

            const previousPage = Math.max(1, providers.cacheStart / providers.pageSize);

            // Avoid re-fetch
            if (providers.loadedPages?.includes(previousPage)) return;

            dispatch(fetchProviders({ page: previousPage, pageSize: providers.pageSize }));
        }
    };

    const handleEgressScroll = (event) => {
        const listbox = event.currentTarget;

        // Scroll Down
        if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 20) {

            const nextPage = Math.floor(mergedEgress.length / egresses.pageSize) + 1;

            // STOP if all data is loaded
            if (mergedEgress.length >= egresses.total) return;

            // STOP if already loaded
            if (egresses.loadedPages?.includes(nextPage)) return;

            // STOP if already loading
            if (egressLoadingPages.has(nextPage)) return;

            // Mark as loading
            setEgressLoadingPages(prev => new Set(prev).add(nextPage));

            dispatch(fetchEgresses({ page: nextPage, pageSize: egresses.pageSize }));
        }

        // Scroll up
        if (listbox.scrollTop === 0) {

            // Stop if already at the beginning
            if (mergedEgress.length >= egresses.total) return;

            const previousPage = Math.max(1, egresses.cacheStart / egresses.pageSize);

            // Avoid re-fetch
            if (egresses.loadedPages?.includes(previousPage)) return;

            dispatch(fetchEgresses({ page: previousPage, pageSize: egresses.pageSize }));
        }
    };

    if (location.pathname !== '/collections') {
        return <Outlet key={location.pathname} />;
    }

    return (
        <Container maxWidth={false} disableGutters>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h5">Collections</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <TextField label="Search" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Button variant="contained" onClick={() => handleOpenDialog('create', { short_name: '', provider_id: null, active: true, egress_id: null })} startIcon={<AddIcon />} disabled={!hasPrivilege('collection:create')}>Add</Button>
                            <Button variant="contained" onClick={() => handleOpenDialog('edit')} disabled={selected.length !== 1 || !hasPrivilege('collection:update')} startIcon={<EditIcon />}>Edit</Button>
                            <Button variant="outlined" onClick={handleActiveToggle} disabled={selected.length === 0 || !hasPrivilege('collection:update')} startIcon={firstSelectedStatus ? <CloseIcon /> : <DoneIcon />}>
                                {firstSelectedStatus ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button variant="contained" color="error" onClick={() => handleOpenDialog('delete')} disabled={selected.length === 0 || !hasPrivilege('collection:delete')} startIcon={<DeleteIcon />}>Delete</Button>
                        </Box>
                    </Box>
                    
                    {collections.status === 'failed' && <Alert severity="error" sx={{ mb: 2 }}>{collections.error}</Alert>}
                    
                    <TableContainer component={Paper}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < processedCollections.length} checked={processedCollections.length > 0 && selected.length === processedCollections.length} onChange={handleSelectAllClick} /></TableCell>
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
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                                ) : processedCollections.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography variant="subtitle1" color="text.secondary" sx={{ py: 5 }}>
                                                {searchTerm ? "No collections match your search." : "No collections found."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    processedCollections
                                        .map((collection) => {
                                            const isItemSelected = selected.indexOf(collection.id) !== -1;
                                            return (
                                                <TableRow key={collection.id} hover onClick={() => handleRowClick(collection.id)} role="checkbox" tabIndex={-1} selected={isItemSelected}>
                                                    <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                    <TableCell>{collection.short_name}</TableCell>
                                                    <TableCell>{collection.provider_name}</TableCell>
                                                    <TableCell>{collection.egress_path}</TableCell>
                                                    <TableCell>{collection.active ? 'Active' : 'Inactive'}</TableCell>
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
                        count={pagination.total}
                        rowsPerPage={pagination.pageSize}
                        page={pagination.page}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                    />
                </CardContent>
            </Card>

            <Dialog open={dialog.open === 'create' || dialog.open === 'edit'} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>{dialog.open === 'create' ? 'Create New Collection' : 'Edit Collection'}</DialogTitle>
                <DialogContent>
                    {
                    dialog.data && (
                        <Box component="form" id="collection-form" onSubmit={handleFormSubmit} noValidate sx={{ mt: 1 }}>
                            <TextField autoFocus margin="dense" name="short_name" label="Collection Short Name" fullWidth value={dialog.data.short_name} onChange={(e) => setDialog({...dialog, data: {...dialog.data, short_name: e.target.value}})} required />
                            <Autocomplete
                                    fullWidth
                                    options={mergedProviders}
                                    getOptionLabel={(option) => option.short_name || ""}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    
                                    // Use cached user OR fallback to collections's existing provider
                                    value={
                                        mergedProviders.find(u => u.id === dialog.data.provider?.id) ||
                                        (dialog.data.provider?.id ? dialog.data.provider : null)
                                    }

                                    ListboxProps={{ onScroll: handleProvidersScroll }}
                                    loading={providers.status === 'loading'}

                                    onChange={(e, newValue) => {
                                        // Store both id and name
                                        setDialog({
                                            ...dialog,
                                            data: { 
                                                ...dialog.data, 
                                                provider: newValue 
                                                    ? { id: newValue.id, name: newValue.name } 
                                                    : null 
                                            }
                                        });
                                    }}

                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Provider"
                                            margin="dense"
                                        />
                                    )}
                                />


                                <Autocomplete
                                    fullWidth
                                    options={mergedEgress}
                                    getOptionLabel={(option) => option.path || ""}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    
                                    // Use cached user OR fallback to collection's existing egress path
                                    value={
                                        mergedEgress.find(u => u.id === dialog.data.egress?.id) ||
                                        (dialog.data.egress?.id ? dialog.data.egress : null)
                                    }

                                    ListboxProps={{ onScroll: handleEgressScroll }}
                                    loading={egresses.status === 'loading'}

                                    onChange={(e, newValue) => {
                                        // Store both id and name
                                        setDialog({
                                            ...dialog,
                                            data: { 
                                                ...dialog.data, 
                                                egress: newValue 
                                                    ? { id: newValue.id, name: newValue.path } 
                                                    : null 
                                            }
                                        });
                                    }}

                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Egress Path"
                                            margin="dense"
                                        />
                                    )}
                                />
                            
                            <TextField select margin="dense" label="Status" fullWidth value={dialog.data.active} onChange={(e) => setDialog({...dialog, data: {...dialog.data, active: e.target.value }})}>
                                <MenuItem value={true}>Active</MenuItem>
                                <MenuItem value={false}>Inactive</MenuItem>
                            </TextField>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button type="submit" form="collection-form" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : (dialog.open === 'create' ? 'Create' : 'Save')}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialog.open === 'delete'} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>Are you sure you want to delete the {selected.length} selected collection(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : 'Delete'}</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Collections;