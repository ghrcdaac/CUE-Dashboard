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
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
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
            if (collections.status === 'idle') dispatch(fetchCollections());
            if (providers.status === 'idle') dispatch(fetchProviders());
            if (egresses.status === 'idle') dispatch(fetchEgresses());
        }
    }, [activeNgroupId, collections.status, providers.status, egresses.status, dispatch]);

    // Derives the page's loading state from the cache statuses
    useEffect(() => {
        const isLoading = collections.status === 'loading' || providers.status === 'loading' || egresses.status === 'loading';
        setLoading(isLoading);
    }, [collections.status, providers.status, egresses.status]);

    const processedCollections = useMemo(() => {
        if (!collections.data || !providers.data || !egresses.data) return [];
        
        const providerMap = new Map(providers.data.map(p => [p.id, p.short_name]));
        const egressMap = new Map(egresses.data.map(e => [e.id, e.path]));

        const collectionsWithDetails = collections.data.map(collection => ({
            ...collection,
            provider_name: providerMap.get(collection.provider_id) || 'N/A',
            egress_path: egressMap.get(collection.egress_id) || 'N/A',
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

        return filtered.sort((a, b) => {
            const isAsc = sorting.order === 'asc' ? 1 : -1;
            const aValue = a[sorting.orderBy];
            const bValue = b[sorting.orderBy];
            if (aValue === null || aValue === undefined) return 1 * isAsc;
            if (bValue === null || bValue === undefined) return -1 * isAsc;
            if (typeof aValue === 'boolean') return (aValue === bValue ? 0 : aValue ? -1 : 1) * isAsc;
            return aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true }) * isAsc;
        });
    }, [collections.data, providers.data, egresses.data, sorting, searchTerm]);
    
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
            if (dialog.open === 'create') {
                await collectionApi.createCollection(dialog.data);
                toast.success("Collection created successfully!");
            } else if (dialog.open === 'edit') {
                const { id, short_name, provider_id, egress_id, active } = dialog.data;
                await collectionApi.updateCollection(id, { short_name, provider_id, egress_id, active });
                toast.success("Collection updated successfully");
            }
            handleCloseDialog();
            setSelected([]);
            dispatch(fetchCollections()); // Refresh the cache
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
            dispatch(fetchCollections()); // Refresh the cache
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
            dispatch(fetchCollections()); // Refresh the cache
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

    const handlePageChange = (event, newPage) => setPagination(prev => ({...prev, page: newPage}));
    const handleRowsPerPageChange = (event) => setPagination({ ...pagination, pageSize: parseInt(event.target.value, 10), page: 0 });

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
                                        .slice(pagination.page * pagination.pageSize, pagination.page * pagination.pageSize + pagination.pageSize)
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
                        count={processedCollections.length}
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
                    {dialog.data && (
                        <Box component="form" id="collection-form" onSubmit={handleFormSubmit} noValidate sx={{ mt: 1 }}>
                            <TextField autoFocus margin="dense" name="short_name" label="Collection Short Name" fullWidth value={dialog.data.short_name} onChange={(e) => setDialog({...dialog, data: {...dialog.data, short_name: e.target.value}})} required />
                            <Autocomplete options={providers.data} getOptionLabel={(option) => option.short_name} value={providers.data.find(o => o.id === dialog.data.provider_id) || null} onChange={(e, val) => setDialog({...dialog, data: {...dialog.data, provider_id: val?.id || null}})} renderInput={(params) => <TextField {...params} label="Provider" margin="dense" fullWidth required />} />
                            <Autocomplete options={egresses.data} getOptionLabel={(option) => option.path} value={egresses.data.find(o => o.id === dialog.data.egress_id) || null} onChange={(e, val) => setDialog({...dialog, data: {...dialog.data, egress_id: val?.id || null}})} renderInput={(params) => <TextField {...params} label="Egress Path" margin="dense" fullWidth required />} />
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