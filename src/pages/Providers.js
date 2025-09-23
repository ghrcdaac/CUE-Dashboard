import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Typography, Checkbox,
    TablePagination, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, TableSortLabel, CircularProgress, MenuItem, Container, Alert,
    Autocomplete // UPDATED: Added missing import
} from "@mui/material";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useOutletContext, Outlet, useLocation } from 'react-router-dom';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

import usePageTitle from '../hooks/usePageTitle';
import usePrivileges from '../hooks/usePrivileges';
import { parseApiError } from '../utils/errorUtils';
import sessionService from '../services/sessionService';

import * as providerApi from '../api/providerApi';
import { listCueusers } from '../api/cueUser';
import ExportMenu from "./reports/ExportMenu";
import { generatePDFReport } from "./reports/PdfReport";

const headCells = [
    { id: 'short_name', label: 'Short Name' },
    { id: 'long_name', label: 'Long Name' },
    { id: 'can_upload', label: 'Can Upload' },
    { id: 'point_of_contact_name', label: 'Point of Contact' },
    { id: 'reason', label: 'Reason' },
];

function Providers() {
    usePageTitle("Providers");

    const { hasPrivilege } = usePrivileges();
    const { setMenuItems } = useOutletContext();
    const location = useLocation();
    const ngroupId = useMemo(() => sessionService.getSession()?.active_ngroup_id || null, []);

    // State
    const [allProviders, setAllProviders] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState([]);
    
    // Client-side operations state
    const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 10 });
    const [sorting, setSorting] = useState({ orderBy: 'short_name', order: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    
    // Dialog state
    const [dialog, setDialog] = useState({ open: null, data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        const providersMenuItems = [{ text: 'Providers', path: '/providers', icon: <AccountBoxIcon /> }];
        setMenuItems(providersMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    const fetchPageData = useCallback(async () => {
        if (!ngroupId) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            const [providersData, usersData] = await Promise.all([
                providerApi.listProviders(),
                listCueusers()
            ]);
            const userOpts = usersData || [];
            setUserOptions(userOpts);
            const userMap = new Map(userOpts.map(user => [user.id, user.name]));
            const processedProviders = (providersData || []).map(provider => ({
                ...provider,
                point_of_contact_name: provider.point_of_contact ? userMap.get(provider.point_of_contact) || 'N/A' : '',
            }));
            setAllProviders(processedProviders);
        } catch (err) {
            const apiError = parseApiError(err);
            setError(apiError);
            toast.error(apiError);
        } finally {
            setLoading(false);
        }
    }, [ngroupId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const processedProviders = useMemo(() => {
        let list = [...allProviders];
        if (filter === 'active') list = list.filter(p => p.can_upload);
        else if (filter === 'suspended') list = list.filter(p => !p.can_upload);

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            list = list.filter(p =>
                p.short_name?.toLowerCase().includes(lowercasedTerm) ||
                p.long_name?.toLowerCase().includes(lowercasedTerm) ||
                p.point_of_contact_name?.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        return list.sort((a, b) => {
            const isAsc = sorting.order === 'asc' ? 1 : -1;
            const aValue = a[sorting.orderBy];
            const bValue = b[sorting.orderBy];
            if (aValue === null || aValue === undefined) return 1 * isAsc;
            if (bValue === null || bValue === undefined) return -1 * isAsc;
            if (typeof aValue === 'boolean') return (aValue === bValue ? 0 : aValue ? -1 : 1) * isAsc;
            return aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true }) * isAsc;
        });
    }, [allProviders, sorting, searchTerm, filter]);

    const handleOpenDialog = (type, data = null) => {
        if (type === 'edit') {
            const providerToEdit = allProviders.find(p => p.id === selected[0]);
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
            if (dialog.open === 'create') {
                await providerApi.createProvider(data);
                toast.success("Provider created successfully!");
            } else if (dialog.open === 'edit') {
                const { id, ...updateData } = data;
                await providerApi.updateProvider(id, updateData);
                toast.success("Provider updated successfully!");
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
            await Promise.all(selected.map(providerId => providerApi.deleteProvider(providerId)));
            toast.success("Provider(s) deleted successfully!");
            handleCloseDialog();
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
        setSorting({ order: isAsc ? 'desc' : 'asc', orderBy: property });
    };

    const handleSelectAllClick = (event) => setSelected(event.target.checked ? processedProviders.map(p => p.id) : []);

    const handleRowClick = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) { newSelected = newSelected.concat(selected, id); }
        else if (selectedIndex === 0) { newSelected = newSelected.concat(selected.slice(1)); }
        else if (selectedIndex === selected.length - 1) { newSelected = newSelected.concat(selected.slice(0, -1)); }
        else if (selectedIndex > 0) { newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1)); }
        setSelected(newSelected);
    };
    
    const handleExportProviders = async (format) => {
        if (format !== 'pdf') return;
        try {
            const suspended = allProviders.filter(p => !p.can_upload);
            if (suspended.length === 0) {
                toast.info("There are no suspended providers to export.");
                return;
            }

            const columns = [
                { header: "Short Name", dataKey: "short_name" },
                { header: "Long Name", dataKey: "long_name" },
                { header: "Point of Contact", dataKey: "point_of_contact_name" },
                { header: "Reason", dataKey: "reason" },
            ];
            generatePDFReport("Suspended Providers Report", columns, suspended);
        } catch (err) {
            toast.error("Failed to export suspended providers: " + parseApiError(err));
        }
    };

    if (location.pathname !== '/providers') {
        return <Outlet key={location.pathname} />;
    }

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
                    
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
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
                                    processedProviders.slice(pagination.page * pagination.rowsPerPage, pagination.page * pagination.rowsPerPage + pagination.rowsPerPage).map(provider => {
                                        const isItemSelected = selected.indexOf(provider.id) !== -1;
                                        return (
                                            <TableRow key={provider.id} hover onClick={() => handleRowClick(provider.id)} role="checkbox" tabIndex={-1} selected={isItemSelected}>
                                                <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                <TableCell>{provider.short_name}</TableCell>
                                                <TableCell>{provider.long_name}</TableCell>
                                                <TableCell>{provider.can_upload ? 'Yes' : 'No'}</TableCell>
                                                <TableCell>{provider.point_of_contact_name}</TableCell>
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
                        count={processedProviders.length}
                        rowsPerPage={pagination.rowsPerPage}
                        page={pagination.page}
                        onPageChange={(e, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                        onRowsPerPageChange={(e) => setPagination({ ...pagination, rowsPerPage: parseInt(e.target.value, 10), page: 0 })}
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
                                <Autocomplete fullWidth options={userOptions} getOptionLabel={(option) => option.name} value={userOptions.find(option => option.id === dialog.data.point_of_contact) || null} onChange={(e, newValue) => setDialog({...dialog, data: {...dialog.data, point_of_contact: newValue?.id || null}})} isOptionEqualToValue={(option, value) => option.id === value?.id} renderInput={(params) => (<TextField {...params} label="Point of Contact" margin="dense" />)} />
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