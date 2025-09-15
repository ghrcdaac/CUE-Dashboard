// src/pages/Collections.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, Autocomplete, CircularProgress, MenuItem
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
import useAuth from '../hooks/useAuth';
import usePrivileges from '../hooks/usePrivileges';
import { parseApiError } from '../utils/errorUtils';

import * as collectionApi from '../api/collectionApi';
import { listProviders } from '../api/providerApi';
import { listEgresses } from '../api/egressAPI';

function Collections() {
    usePageTitle("Collections");
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        short_name: '',
        provider_id: null,
        active: true,
        egress_id: null,
    });
    const [providerOptions, setProviderOptions] = useState([]);
    const [egressOptions, setEgressOptions] = useState([]);
    const [editCollection, setEditCollection] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selected, setSelected] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('short_name');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const { setMenuItems } = useOutletContext();
    const { activeNgroupId } = useAuth();
    const { hasPrivilege } = usePrivileges();
    const location = useLocation();

    useEffect(() => {
        const collectionsMenuItems = [
            { text: 'Collection', path: '/collections', icon: <CollectionsIcon /> },
            { text: 'Overview', path: '/collections/create', icon: <FolderIcon /> },
            { text: 'Files', path: '/collections/files', icon: <InsertDriveFileIcon /> },
        ];
        setMenuItems(collectionsMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    const fetchPageData = useCallback(async () => {
        if (!activeNgroupId) return;
        setLoading(true);
        try {
            const [collectionsData, providersData, egressesData] = await Promise.all([
                collectionApi.listCollections(),
                listProviders(),
                listEgresses()
            ]);

            const providerOpts = providersData.map(p => ({ id: p.id, short_name: p.short_name }));
            const egressOpts = egressesData.map(e => ({ id: e.id, path: e.path }));
            setProviderOptions(providerOpts);
            setEgressOptions(egressOpts);
            
            const providerMap = new Map(providerOpts.map(p => [p.id, p.short_name]));
            const egressMap = new Map(egressOpts.map(e => [e.id, e.path]));

            const collectionsWithDetails = collectionsData.map(collection => ({
                ...collection,
                provider_name: providerMap.get(collection.provider_id) || 'N/A',
                egress_path: egressMap.get(collection.egress_id) || 'N/A',
            }));
            setCollections(collectionsWithDetails);
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setLoading(false);
        }
    }, [activeNgroupId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleCreateClose = () => {
        setCreateFormData({ short_name: '', provider_id: null, active: true, egress_id: null });
        setOpenCreateDialog(false);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await collectionApi.createCollection(createFormData);
            toast.success("Collection created successfully!");
            handleCreateClose();
            fetchPageData();
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClose = () => {
        setOpenEditDialog(false);
        setEditCollection(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { id, short_name, provider_id, egress_id, active } = editCollection;
            const updateData = { short_name, provider_id, egress_id, active };
            await collectionApi.updateCollection(id, updateData);
            toast.success("Collection updated successfully");
            handleEditClose();
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
                const collection = collections.find(c => c.id === id);
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

    const handleConfirmDelete = async () => {
        setIsSubmitting(true);
        try {
            await Promise.all(selected.map(id => collectionApi.deleteCollection(id)));
            toast.success("Collection(s) deleted successfully!");
            setOpenDeleteDialog(false);
            setSelected([]);
            fetchPageData();
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = () => {
        if (selected.length !== 1) return;
        const collectionToEdit = collections.find(c => c.id === selected[0]);
        setEditCollection(collectionToEdit);
        setOpenEditDialog(true);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) newSelected = [...selected, id];
        else newSelected = selected.filter(selId => selId !== id);
        setSelected(newSelected);
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedAndFilteredCollections = useMemo(() => {
        const filtered = collections.filter(c => 
            c.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.egress_path.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const comparator = (a, b) => {
            const isAsc = order === 'asc';
            let aValue = a[orderBy];
            let bValue = b[orderBy];
            if (typeof aValue === 'string') return isAsc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            if (typeof aValue === 'boolean') return isAsc ? (aValue === bValue ? 0 : aValue ? -1 : 1) : (aValue === bValue ? 0 : aValue ? 1 : -1);
            return 0;
        };
        return filtered.sort(comparator);
    }, [collections, order, orderBy, searchTerm]);

    const isSelected = (id) => selected.indexOf(id) !== -1;

    if (location.pathname !== '/collections' && location.pathname !== '/collections/') {
        return <Outlet key={location.pathname} />;
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Collections</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField label="Search" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Button variant="contained" color="primary" onClick={() => setOpenCreateDialog(true)} startIcon={<AddIcon />} disabled={!hasPrivilege('collection:create')}>Add</Button>
                            <Button variant="contained" onClick={handleEditClick} disabled={selected.length !== 1 || !hasPrivilege('collection:update')} startIcon={<EditIcon />}>Edit</Button>
                            <Button variant="contained" color="secondary" onClick={handleActiveToggle} disabled={selected.length === 0 || !hasPrivilege('collection:update')} startIcon={collections.find(c => selected.includes(c.id))?.active ? <CloseIcon /> : <DoneIcon />}>
                                {collections.find(c => selected.includes(c.id))?.active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button variant="contained" color="error" onClick={() => setOpenDeleteDialog(true)} disabled={selected.length === 0 || !hasPrivilege('collection:delete')} startIcon={<DeleteIcon />}>Delete</Button>
                        </Box>
                    </Box>
                    
                    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box> :
                    <>
                        <TableContainer component={Paper}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < sortedAndFilteredCollections.length} checked={sortedAndFilteredCollections.length > 0 && selected.length === sortedAndFilteredCollections.length} onChange={(e) => setSelected(e.target.checked ? sortedAndFilteredCollections.map(c => c.id) : [])} /></TableCell>
                                        <TableCell><TableSortLabel active={orderBy === 'short_name'} direction={order} onClick={() => handleRequestSort('short_name')}>Short Name</TableSortLabel></TableCell>
                                        <TableCell><TableSortLabel active={orderBy === 'provider_name'} direction={order} onClick={() => handleRequestSort('provider_name')}>Provider</TableSortLabel></TableCell>
                                        <TableCell><TableSortLabel active={orderBy === 'egress_path'} direction={order} onClick={() => handleRequestSort('egress_path')}>Egress Path</TableSortLabel></TableCell>
                                        <TableCell><TableSortLabel active={orderBy === 'active'} direction={order} onClick={() => handleRequestSort('active')}>Active</TableSortLabel></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedAndFilteredCollections.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((collection) => {
                                        const isItemSelected = isSelected(collection.id);
                                        return (
                                            <TableRow key={collection.id} hover onClick={(event) => handleClick(event, collection.id)} role="checkbox" tabIndex={-1} selected={isItemSelected}>
                                                <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                <TableCell>{collection.short_name}</TableCell>
                                                <TableCell>{collection.provider_name}</TableCell>
                                                <TableCell>{collection.egress_path}</TableCell>
                                                <TableCell>{collection.active ? 'Yes' : 'No'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={sortedAndFilteredCollections.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        />
                    </>}
                </CardContent>
            </Card>

            {/* --- FIX: Restored Dialogs for Create, Edit, and Delete --- */}
            <Dialog open={openCreateDialog} onClose={handleCreateClose} fullWidth maxWidth="sm">
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" name="short_name" label="Collection Short Name" fullWidth value={createFormData.short_name} onChange={(e) => setCreateFormData({...createFormData, short_name: e.target.value})} required />
                    <Autocomplete options={providerOptions} getOptionLabel={(option) => option.short_name} value={providerOptions.find(o => o.id === createFormData.provider_id) || null} onChange={(e, val) => setCreateFormData({...createFormData, provider_id: val ? val.id : null})} renderInput={(params) => <TextField {...params} label="Provider" margin="dense" fullWidth required />} />
                    <Autocomplete options={egressOptions} getOptionLabel={(option) => option.path} value={egressOptions.find(o => o.id === createFormData.egress_id) || null} onChange={(e, val) => setCreateFormData({...createFormData, egress_id: val ? val.id : null})} renderInput={(params) => <TextField {...params} label="Egress Path" margin="dense" fullWidth required />} />
                    <TextField select margin="dense" label="Active" fullWidth value={createFormData.active} onChange={(e) => setCreateFormData({...createFormData, active: e.target.value === 'true'})}>
                        <MenuItem value={true}>Active</MenuItem>
                        <MenuItem value={false}>Inactive</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateClose}>Cancel</Button>
                    <Button onClick={handleCreateSubmit} variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : 'Create'}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openEditDialog} onClose={handleEditClose} fullWidth maxWidth="sm">
                <DialogTitle>Edit Collection</DialogTitle>
                <DialogContent>
                    {editCollection && <>
                        <TextField autoFocus margin="dense" label="Collection Short Name" fullWidth value={editCollection.short_name} onChange={(e) => setEditCollection({...editCollection, short_name: e.target.value})} required />
                        <Autocomplete options={providerOptions} getOptionLabel={(option) => option.short_name} value={providerOptions.find(o => o.id === editCollection.provider_id) || null} onChange={(e, val) => setEditCollection({...editCollection, provider_id: val ? val.id : null})} renderInput={(params) => <TextField {...params} label="Provider" margin="dense" fullWidth required />} />
                        <Autocomplete options={egressOptions} getOptionLabel={(option) => option.path} value={egressOptions.find(o => o.id === editCollection.egress_id) || null} onChange={(e, val) => setEditCollection({...editCollection, egress_id: val ? val.id : null})} renderInput={(params) => <TextField {...params} label="Egress Path" margin="dense" fullWidth required />} />
                        <TextField select margin="dense" label="Active" fullWidth value={editCollection.active} onChange={(e) => setEditCollection({...editCollection, active: e.target.value === 'true'})}>
                            <MenuItem value={true}>Active</MenuItem>
                            <MenuItem value={false}>Inactive</MenuItem>
                        </TextField>
                    </>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose}>Cancel</Button>
                    <Button onClick={handleEditSubmit} variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : 'Save'}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>Are you sure you want to delete the {selected.length} selected collection(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : 'Delete'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Collections;