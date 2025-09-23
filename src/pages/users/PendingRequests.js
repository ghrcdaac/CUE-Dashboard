import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, Autocomplete, CircularProgress, Container, Alert
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import usePageTitle from "../../hooks/usePageTitle";
import useAuth from '../../hooks/useAuth';
import usePrivileges from '../../hooks/usePrivileges';
import sessionService from '../../services/sessionService';
import { parseApiError } from '../../utils/errorUtils';
import { getEditableRoles } from '../../utils/permissionUtils';

import { listUserApplications, approveUserApplication, rejectUserApplication } from '../../api/userApplicationApi';
import { listRoles } from '../../api/roleApi';
import { listProviders } from '../../api/providerApi';

const headCells = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'username', label: 'Username' },
    { id: 'justification', label: 'Justification' },
    { id: 'providerName', label: 'Provider' },
];

function PendingRequests() {
    usePageTitle("Pending User Requests");

    const { privileges, hasPrivilege } = usePrivileges();
    const ngroupId = useMemo(() => sessionService.getSession()?.active_ngroup_id || null, []);

    // State
    const [applications, setApplications] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    
    // Dialog state
    const [dialog, setDialog] = useState({ open: null, data: null }); // 'accept', 'reject'
    
    // Client-side operation state
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 10 });
    const [sorting, setSorting] = useState({ orderBy: 'name', order: 'asc' });

    const fetchPageData = useCallback(async () => {
        if (!ngroupId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [rolesData, appsData, providersData] = await Promise.all([
                listRoles(),
                listUserApplications('pending'),
                listProviders()
            ]);
            setRoles(rolesData || []);

            const providerMap = new Map((providersData || []).map(provider => [provider.id, provider]));
            const processedApps = (appsData || []).map(app => ({
                ...app,
                providerName: app.provider_id ? providerMap.get(app.provider_id)?.short_name || 'N/A' : '',
            }));
            setApplications(processedApps);
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

    const handleRequestSort = (property) => {
        const isAsc = sorting.orderBy === property && sorting.order === 'asc';
        setSorting({ order: isAsc ? 'desc' : 'asc', orderBy: property });
    };
    
    const processedApps = useMemo(() => {
        let filtered = [...applications];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(app =>
                Object.values(app).some(val => 
                    String(val).toLowerCase().includes(lowercasedTerm)
                )
            );
        }

        return filtered.sort((a, b) => {
            const isAsc = sorting.order === 'asc' ? 1 : -1;
            const aValue = a[sorting.orderBy] || '';
            const bValue = b[sorting.orderBy] || '';
            return aValue.toString().localeCompare(bValue.toString()) * isAsc;
        });
    }, [applications, sorting, searchTerm]);

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
            const app = applications.find(a => a.id === selected[0]);
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
            toast.success("Application approved successfully!");
            handleCloseDialog();
            setSelected([]);
            fetchPageData();
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
            toast.success(`${selected.length} application(s) rejected successfully!`);
            handleCloseDialog();
            setSelected([]);
            fetchPageData();
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
                                    <TableRow><TableCell colSpan={headCells.length + 1} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                                ) : processedApps.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={headCells.length + 1} align="center">
                                            <Typography sx={{ py: 5 }} color="text.secondary">
                                                {searchTerm ? "No requests match your search." : "No pending requests found."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    processedApps
                                        .slice(pagination.page * pagination.rowsPerPage, pagination.page * pagination.rowsPerPage + pagination.rowsPerPage)
                                        .map(app => {
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
                        rowsPerPage={pagination.rowsPerPage}
                        page={pagination.page}
                        onPageChange={(e, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                        onRowsPerPageChange={(e) => setPagination({ ...pagination, rowsPerPage: parseInt(e.target.value, 10), page: 0 })}
                    />
                </CardContent>
            </Card>

            <Dialog open={dialog.open === 'accept'} onClose={handleCloseDialog} fullWidth maxWidth="xs">
                <DialogTitle>Accept User Application</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Please assign a role to approve this user.</Typography>
                    <Autocomplete
                        options={getEditableRoles(roles, privileges)}
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