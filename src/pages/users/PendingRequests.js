import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, CircularProgress, Autocomplete, Container, Alert
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector, useDispatch } from 'react-redux';

import usePageTitle from "../../hooks/usePageTitle";
import useAuth from '../../hooks/useAuth';
import usePrivileges from '../../hooks/usePrivileges';
import { parseApiError } from '../../utils/errorUtils';
import { getEditableRoles } from '../../utils/permissionUtils';

import { listUserApplications, approveUserApplication, rejectUserApplication } from '../../api/userApplicationApi';
import { fetchRoles, fetchProviders } from '../../app/reducers/dataCacheSlice';

const headCells = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'username', label: 'Username' },
    { id: 'justification', label: 'Justification' },
    { id: 'providerName', label: 'Provider' },
];

function PendingRequests() {
    usePageTitle("Pending User Requests");
    
    const dispatch = useDispatch();
    const { user: currentUser, activeNgroupId } = useAuth();
    const { hasPrivilege } = usePrivileges();

    const { roles, providers } = useSelector((state) => state.dataCache);

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [dialog, setDialog] = useState({ open: null, data: null });
    
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');

    // --- ADDED: Check if the user is an admin or security user ---
    const isPrivilegedViewer = useMemo(() =>
        currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('security'),
        [currentUser?.roles]
    );

    useEffect(() => {
        // Fetch dependencies regardless of activeNgroupId, since privileged users don't need one
        if (roles.status === 'idle') dispatch(fetchRoles());
        if (providers.status === 'idle') dispatch(fetchProviders());
    }, [roles.status, providers.status, dispatch]);

    const fetchPageData = useCallback(async () => {
        // --- MODIFIED: The check for activeNgroupId is now conditional ---
        if (!isPrivilegedViewer && !activeNgroupId) {
            setLoading(false);
            setApplications([]); // Clear applications if no DAAC is selected for a non-privileged user
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // --- MODIFIED: Pass the new option to the API call ---
            const appsData = await listUserApplications('pending', { forceGlobal: isPrivilegedViewer });
            setApplications(appsData || []);
        } catch (err) {
            const apiError = parseApiError(err);
            setError(apiError);
            toast.error(apiError);
        } finally {
            setLoading(false);
        }
    // --- Add isPrivilegedViewer to the dependency array ---
    }, [activeNgroupId, isPrivilegedViewer]);

    useEffect(() => {
        // This effect now correctly triggers the fetch when dependencies are ready
        if (roles.status === 'succeeded' && providers.status === 'succeeded') {
            fetchPageData();
        }
    }, [roles.status, providers.status, fetchPageData]);

    const processedApps = useMemo(() => {
        if (!applications || !providers.data) return [];
        const providerMap = new Map(providers.data.map(provider => [provider.id, provider.short_name]));
        
        const appsWithDetails = applications.map(app => ({
            ...app,
            providerName: app.provider_id ? providerMap.get(app.provider_id) || 'N/A' : '',
        }));

        const filtered = appsWithDetails.filter(app =>
            ['name', 'email', 'username', 'providerName', 'justification'].some(field => 
                app[field]?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        const comparator = (a, b) => {
            const isAsc = order === 'asc';
            let aValue = a[orderBy] || '';
            let bValue = b[orderBy] || '';
            if (aValue < bValue) return isAsc ? -1 : 1;
            if (aValue > bValue) return isAsc ? 1 : -1;
            return 0;
        };
        return filtered.sort(comparator);
    }, [applications, providers.data, order, orderBy, searchTerm]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };
    
    const handleSelectAllClick = (event) => {
        if (event.target.checked) setSelected(processedApps.map((app) => app.id));
        else setSelected([]);
    };

    const handleClick = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) newSelected = [...selected, id];
        else newSelected = selected.filter(selId => selId !== id);
        setSelected(newSelected);
    };

    const handleOpenDialog = (type) => {
        if (type === 'accept') {
            const app = processedApps.find(a => a.id === selected[0]);
            setDialog({ open: 'accept', data: { ...app, role: null } });
        } else {
            setDialog({ open: 'reject', data: null });
        }
    };
    const handleCloseDialog = () => setDialog({ open: null, data: null });

    const handleConfirmApprove = async () => {
        if (!dialog.data?.role?.id) {
            toast.error("Please select a role for the user.");
            return;
        }
        setActionLoading(true);
        try {
            await approveUserApplication(dialog.data.id, dialog.data.role.id);
            handleCloseDialog();
            setSelected([]);
            await fetchPageData(); 
            toast.success("Application approved successfully!");
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmReject = async () => {
        setActionLoading(true);
        try {
            await Promise.all(selected.map(appId => rejectUserApplication(appId)));
            handleCloseDialog();
            setSelected([]);
            await fetchPageData();
            toast.success(`${selected.length} application(s) rejected successfully!`);
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setActionLoading(false);
        }
    };
    
    const isSelected = (id) => selected.indexOf(id) !== -1;

    return (
        <Container maxWidth={false} disableGutters>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Pending User Applications</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField label="Search Applications" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Button variant="contained" color="primary" onClick={() => handleOpenDialog('accept')} disabled={selected.length !== 1 || actionLoading || !hasPrivilege('application:approve')}>Accept</Button>
                            <Button variant="contained" color="error" onClick={() => handleOpenDialog('reject')} disabled={selected.length === 0 || actionLoading || !hasPrivilege('application:approve')}>Reject</Button>
                        </Box>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < processedApps.length} checked={processedApps.length > 0 && selected.length === processedApps.length} onChange={handleSelectAllClick} /></TableCell>
                                    {headCells.map((headCell) => (
                                        <TableCell key={headCell.id} sortDirection={orderBy === headCell.id ? order : false}>
                                            <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : 'asc'} onClick={() => handleRequestSort(headCell.id)}>
                                                {headCell.label}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={headCells.length + 1} align="center" sx={{py: 5}}><CircularProgress /></TableCell></TableRow>
                                ) : processedApps.length === 0 ? (
                                    <TableRow><TableCell colSpan={headCells.length + 1} align="center">
                                        <Typography sx={{py: 5}} color="text.secondary">
                                            {searchTerm ? "No requests match your search." : "No pending requests found."}
                                        </Typography>
                                    </TableCell></TableRow>
                                ) : (
                                    processedApps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(app => {
                                        const isItemSelected = isSelected(app.id);
                                        return (
                                            <TableRow key={app.id} hover onClick={() => handleClick(app.id)} selected={isItemSelected} role="checkbox" tabIndex={-1} sx={{ cursor: 'pointer' }}>
                                                <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                <TableCell>{app.name}</TableCell>
                                                <TableCell>{app.email}</TableCell>
                                                <TableCell>{app.username}</TableCell>
                                                <TableCell>{app.justification}</TableCell>
                                                <TableCell>{app.providerName || 'N/A'}</TableCell>
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
                        count={processedApps.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    />
                </CardContent>
            </Card>

            <Dialog open={dialog.open === 'accept'} onClose={handleCloseDialog} fullWidth maxWidth="xs">
                <DialogTitle>Accept User Application</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Please assign a role to approve this user.</Typography>
                    <Autocomplete
                        options={getEditableRoles(roles.data, currentUser?.roles)}
                        getOptionLabel={(option) => option.long_name}
                        onChange={(e, newValue) => setDialog(prev => ({ ...prev, data: { ...prev.data, role: newValue } }))}
                        renderInput={(params) => <TextField {...params} label="Role" margin="dense" fullWidth />}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleConfirmApprove} variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : "Approve"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialog.open === 'reject'} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Reject</DialogTitle>
                <DialogContent>Are you sure you want to reject the {selected.length} selected application(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleConfirmReject} color="error" variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : "Reject"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default PendingRequests;