// src/pages/Providers.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, Autocomplete, CircularProgress, MenuItem
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useOutletContext, Outlet, useLocation } from 'react-router-dom';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBoxIcon from '@mui/icons-material/AccountBox';

import usePageTitle from '../hooks/usePageTitle';
import useAuth from '../hooks/useAuth';
import usePrivileges from '../hooks/usePrivileges';
import { parseApiError } from '../utils/errorUtils';

import * as providerApi from '../api/providerApi';
import { listCueusers } from '../api/cueUser';


function Providers() {
    usePageTitle("Providers");
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        short_name: '',
        long_name: '',
        can_upload: true,
        point_of_contact: null,
    });
    const [userOptions, setUserOptions] = useState([]);
    const [editProvider, setEditProvider] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selected, setSelected] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('short_name');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const { activeNgroupId } = useAuth();
    const { hasPrivilege } = usePrivileges();
    const { setMenuItems } = useOutletContext();
    const location = useLocation();
    
    useEffect(() => {
        const providersMenuItems = [
            { text: 'Providers', path: '/providers', icon: <AccountBoxIcon /> },
        ];
        setMenuItems(providersMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);


    const fetchPageData = useCallback(async () => {
        if (!activeNgroupId) return;

        setLoading(true);
        try {
            const [providersData, usersData] = await Promise.all([
                providerApi.listProviders(),
                listCueusers()
            ]);

            const userOptions = usersData.map(u => ({ id: u.id, name: u.name }));
            setUserOptions(userOptions);
            
            const userMap = new Map(userOptions.map(user => [user.id, user]));
            const processedProviders = providersData.map(provider => ({
                ...provider,
                point_of_contact_name: provider.point_of_contact ? userMap.get(provider.point_of_contact)?.name || 'N/A' : '',
            }));

            setProviders(processedProviders);
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setLoading(false);
        }
    }, [activeNgroupId]);


    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleCreateOpen = () => setOpenCreateDialog(true);
    const handleCreateClose = () => {
        setCreateFormData({
            short_name: '',
            long_name: '',
            can_upload: true,
            point_of_contact: null,
        });
        setOpenCreateDialog(false);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // --- FIX: Add the activeNgroupId to the request payload ---
            const payload = {
                ...createFormData,
                ngroup_id: activeNgroupId
            };
            
            await providerApi.createProvider(payload);
            toast.success("Provider created successfully!");
            fetchPageData();
            handleCreateClose();
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = () => {
        if (selected.length !== 1) return;
        const providerToEdit = providers.find(p => p.id === selected[0]);
        setEditProvider(providerToEdit);
        setOpenEditDialog(true);
    };

    const handleEditClose = () => {
        setOpenEditDialog(false);
        setEditProvider(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { id, short_name, long_name, can_upload, point_of_contact } = editProvider;
            const updateData = { short_name, long_name, can_upload, point_of_contact };
            await providerApi.updateProvider(id, updateData);
            toast.success("Provider updated successfully");
            setSelected([]);
            handleEditClose();
            fetchPageData();
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = () => {
        if (selected.length === 0) return;
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        setIsSubmitting(true);
        try {
            await Promise.all(selected.map(providerId => providerApi.deleteProvider(providerId)));
            toast.success("Provider(s) deleted successfully!");
            setSelected([]);
            setOpenDeleteDialog(false);
            fetchPageData();
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const filteredAndSortedProviders = useMemo(() => {
        const filtered = providers.filter(p =>
            p.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.long_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.point_of_contact_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const comparator = (a, b) => {
            const isAsc = order === 'asc';
            let aValue = a[orderBy];
            let bValue = b[orderBy];
            if (typeof aValue === 'string') {
                return isAsc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            if (typeof aValue === 'boolean') {
                return isAsc ? (aValue === bValue ? 0 : aValue ? -1 : 1) : (aValue === bValue ? 0 : aValue ? 1 : -1);
            }
            return 0;
        };
        return filtered.sort(comparator);
    }, [providers, order, orderBy, searchTerm]);

    const visibleRows = useMemo(() => {
        return filteredAndSortedProviders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredAndSortedProviders, page, rowsPerPage]);
    
    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelected = filteredAndSortedProviders.map((n) => n.id);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) newSelected = [...selected, id];
        else newSelected = selected.filter(selId => selId !== id);
        setSelected(newSelected);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    if (location.pathname !== '/providers' && location.pathname !== '/providers/') {
        return <Outlet key={location.pathname} />;
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Providers</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField label="Search Providers" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Button variant="contained" color="primary" onClick={handleCreateOpen} startIcon={<AddIcon />} disabled={!hasPrivilege('provider:create')}>Add</Button>
                            <Button variant="contained" onClick={handleEditClick} disabled={selected.length !== 1 || !hasPrivilege('provider:update')} startIcon={<EditIcon />}>Edit</Button>
                            <Button variant="contained" color="error" onClick={handleDeleteClick} disabled={selected.length === 0 || !hasPrivilege('provider:delete')} startIcon={<DeleteIcon />}>Delete</Button>
                        </Box>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                    ) : (
                        <>
                            <TableContainer component={Paper}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < visibleRows.length} checked={visibleRows.length > 0 && selected.length === visibleRows.length} onChange={handleSelectAllClick} /></TableCell>
                                            <TableCell><TableSortLabel active={orderBy === 'short_name'} direction={order} onClick={() => handleRequestSort('short_name')}>Short Name</TableSortLabel></TableCell>
                                            <TableCell><TableSortLabel active={orderBy === 'long_name'} direction={order} onClick={() => handleRequestSort('long_name')}>Long Name</TableSortLabel></TableCell>
                                            <TableCell><TableSortLabel active={orderBy === 'can_upload'} direction={order} onClick={() => handleRequestSort('can_upload')}>Can Upload</TableSortLabel></TableCell>
                                            <TableCell><TableSortLabel active={orderBy === 'point_of_contact_name'} direction={order} onClick={() => handleRequestSort('point_of_contact_name')}>Point of Contact</TableSortLabel></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {visibleRows.map((provider) => {
                                            const isItemSelected = isSelected(provider.id);
                                            return (
                                                <TableRow key={provider.id} hover onClick={(event) => handleClick(event, provider.id)} role="checkbox" tabIndex={-1} selected={isItemSelected}>
                                                    <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                    <TableCell>{provider.short_name}</TableCell>
                                                    <TableCell>{provider.long_name}</TableCell>
                                                    <TableCell>{provider.can_upload ? 'Yes' : 'No'}</TableCell>
                                                    <TableCell>{provider.point_of_contact_name}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50]}
                                component="div"
                                count={filteredAndSortedProviders.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={openCreateDialog} onClose={handleCreateClose} fullWidth maxWidth="sm">
                <DialogTitle>Create New Provider</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" name="short_name" label="Provider Short Name" type="text" fullWidth variant="outlined" value={createFormData.short_name} onChange={(e) => setCreateFormData({...createFormData, short_name: e.target.value})} required/>
                    <TextField margin="dense" name="long_name" label="Provider Long Name" type="text" fullWidth variant="outlined" value={createFormData.long_name} onChange={(e) => setCreateFormData({...createFormData, long_name: e.target.value})}/>
                    <Autocomplete fullWidth options={userOptions} getOptionLabel={(option) => option.name} value={userOptions.find(option => option.id === createFormData.point_of_contact) || null} onChange={(event, newValue) => setCreateFormData({ ...createFormData, point_of_contact: newValue ? newValue.id : null })} isOptionEqualToValue={(option, value) => option.id === value?.id} renderInput={(params) => (<TextField {...params} label="Point of Contact" name="point_of_contact" margin="dense" required />)}/>
                    <TextField fullWidth select label="Can Upload" name="can_upload" value={createFormData.can_upload.toString()} onChange={(e) => setCreateFormData({...createFormData, can_upload: e.target.value === 'true'})} margin="dense">
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateClose}>Cancel</Button>
                    <Button onClick={handleCreateSubmit} variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openEditDialog} onClose={handleEditClose} fullWidth maxWidth="sm">
                <DialogTitle>Edit Provider</DialogTitle>
                <DialogContent>
                    {editProvider && (
                        <>
                            <TextField autoFocus margin="dense" name="short_name" label="Provider Short Name" type="text" fullWidth variant="outlined" value={editProvider.short_name} onChange={(e) => setEditProvider({ ...editProvider, short_name: e.target.value })} required />
                            <TextField margin="dense" name="long_name" label="Provider Long Name" type="text" fullWidth variant="outlined" value={editProvider.long_name} onChange={(e) => setEditProvider({ ...editProvider, long_name: e.target.value })} required />
                            <Autocomplete fullWidth options={userOptions} getOptionLabel={(option) => option.name} value={userOptions.find(option => option.id === editProvider.point_of_contact) || null} onChange={(event, newValue) => setEditProvider({ ...editProvider, point_of_contact: newValue ? newValue.id : null })} isOptionEqualToValue={(option, value) => option.id === value?.id} renderInput={(params) => (<TextField {...params} label="Point of Contact" name="point_of_contact" margin="dense" required />)}/>
                            <TextField fullWidth select label="Can Upload" name="can_upload" value={editProvider.can_upload.toString()} onChange={(e) => setEditProvider({ ...editProvider, can_upload: e.target.value === 'true' })} margin="dense">
                                <MenuItem value="true">Yes</MenuItem>
                                <MenuItem value="false">No</MenuItem>
                            </TextField>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose}>Cancel</Button>
                    <Button onClick={handleEditSubmit} variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>Are you sure you want to delete the {selected.length} selected provider(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Providers;