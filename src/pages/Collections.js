import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    TablePagination, TableSortLabel, Checkbox, CircularProgress, Dialog, 
    DialogTitle, DialogContent, DialogActions, Autocomplete, MenuItem, Container, Alert
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CollectionsIcon from '@mui/icons-material/Collections';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

import usePageTitle from "../hooks/usePageTitle";
import usePrivileges from '../hooks/usePrivileges';
import { parseApiError } from '../utils/errorUtils';
import sessionService from '../services/sessionService';

import * as collectionApi from '../api/collectionApi';
import { listProviders } from '../api/providerApi';
import { listEgresses } from '../api/egressAPI';

const headCells = [
    { id: 'short_name', label: 'Short Name' },
    { id: 'provider_name', label: 'Provider' },
    { id: 'egress_path', label: 'Egress Path' },
    { id: 'active', label: 'Status' },
];

function Collections() {
    usePageTitle("Collections");

    const { setMenuItems } = useOutletContext();
    const { hasPrivilege } = usePrivileges();
    const location = useLocation();
    const ngroupId = useMemo(() => sessionService.getSession()?.active_ngroup_id || null, []);

    // State
    const [allCollections, setAllCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState([]);
    
    // Client-side operation state
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
    const [sorting, setSorting] = useState({ orderBy: 'short_name', order: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');
    
    // Dialog & Form State
    const [dialog, setDialog] = useState({ open: null, data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [providerOptions, setProviderOptions] = useState([]);
    const [egressOptions, setEgressOptions] = useState([]);

    // UPDATED: Moved this hook before the conditional return statement
    const firstSelectedStatus = useMemo(() => {
        if (selected.length === 0) return true; // Default to 'Activate' text
        return allCollections.find(c => c.id === selected[0])?.active;
    }, [selected, allCollections]);

    useEffect(() => {
        const collectionsMenuItems = [
            { text: 'Collections List', path: '/collections', icon: <CollectionsIcon /> },
            { text: 'Create Collection', path: '/collections/create', icon: <FolderIcon /> },
            { text: 'Browse Files', path: '/collections/files', icon: <InsertDriveFileIcon /> },
        ];
        setMenuItems(collectionsMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    const fetchPageData = useCallback(async () => {
        if (!ngroupId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [collectionsData, providersData, egressesData] = await Promise.all([
                collectionApi.listCollections(),
                listProviders(),
                listEgresses()
            ]);

            const providerMap = new Map(providersData.map(p => [p.id, p.short_name]));
            const egressMap = new Map(egressesData.map(e => [e.id, e.path]));

            const collectionsWithDetails = (collectionsData || []).map(collection => ({
                ...collection,
                provider_name: providerMap.get(collection.provider_id) || 'N/A',
                egress_path: egressMap.get(collection.egress_id) || 'N/A',
            }));
            
            setAllCollections(collectionsWithDetails);
            setProviderOptions(providersData || []);
            setEgressOptions(egressesData || []);

        } catch (err) {
            const apiError = parseApiError(err);
            setError(apiError);
            toast.error(`Failed to load page data: ${apiError}`);
        } finally {
            setLoading(false);
        }
    }, [ngroupId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const processedCollections = useMemo(() => {
        let filtered = [...allCollections];
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
            
            if (typeof aValue === 'boolean') {
                return (aValue === bValue ? 0 : aValue ? -1 : 1) * isAsc;
            }
            return aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true }) * isAsc;
        });
    }, [allCollections, sorting, searchTerm]);
    
    const handleOpenDialog = (dialogType, data = null) => {
        if (dialogType === 'edit') {
            const collectionToEdit = allCollections.find(c => c.id === selected[0]);
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
            fetchPageData();
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
            fetchPageData();
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
                const collection = allCollections.find(c => c.id === id);
                return collection.active ? collectionApi.deactivateCollection(id) : collectionApi.activateCollection(id);
            }));
            toast.success("Collection status updated successfully!");
            setSelected([]);
            fetchPageData();
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
        else if (selectedIndex === 0) { newSelected = newSelected.concat(selected.slice(1)); }
        else if (selectedIndex === selected.length - 1) { newSelected = newSelected.concat(selected.slice(0, -1)); }
        else if (selectedIndex > 0) { newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1)); }
        setSelected(newSelected);
    };

    const handlePageChange = (event, newPage) => setPagination(prev => ({...prev, page: newPage}));
    const handleRowsPerPageChange = (event) => setPagination({ ...pagination, pageSize: parseInt(event.target.value, 10), page: 0 });

    // This is the conditional return that was causing the error
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
                    
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
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
                            <Autocomplete options={providerOptions} getOptionLabel={(option) => option.short_name} value={providerOptions.find(o => o.id === dialog.data.provider_id) || null} onChange={(e, val) => setDialog({...dialog, data: {...dialog.data, provider_id: val?.id || null}})} renderInput={(params) => <TextField {...params} label="Provider" margin="dense" fullWidth required />} />
                            <Autocomplete options={egressOptions} getOptionLabel={(option) => option.path} value={egressOptions.find(o => o.id === dialog.data.egress_id) || null} onChange={(e, val) => setDialog({...dialog, data: {...dialog.data, egress_id: val?.id || null}})} renderInput={(params) => <TextField {...params} label="Egress Path" margin="dense" fullWidth required />} />
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