// src/pages/users/PendingRequests.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, Autocomplete, CircularProgress
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import usePageTitle from "../../hooks/usePageTitle";
import useAuth from '../../hooks/useAuth';
import usePrivileges from '../../hooks/usePrivileges';
import { parseApiError } from '../../utils/errorUtils';
import { getEditableRoles } from '../../utils/roleUtils'; // <-- Import the new helper

import { listUserApplications, approveUserApplication, rejectUserApplication } from '../../api/userApplicationApi';
import { listRoles } from '../../api/roleApi';
import { listProviders } from '../../api/providerApi'; // <-- Use the optimized list function

function PendingRequests() {
    const [applications, setApplications] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [openAcceptDialog, setOpenAcceptDialog] = useState(false);
    const [openRejectDialog, setOpenRejectDialog] = useState(false);
    const [applicationToProcess, setApplicationToProcess] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');

    const { user: currentUser, activeNgroupId } = useAuth();
    const { hasPrivilege } = usePrivileges();
    usePageTitle("Pending User Requests");

    const fetchPageData = useCallback(async () => {
        if (!activeNgroupId) return;
        
        setLoading(true);
        try {
            // --- OPTIMIZATION: Fetch all data in parallel ---
            const [rolesData, appsData, providersData] = await Promise.all([
                listRoles(),
                listUserApplications('pending'),
                listProviders(activeNgroupId)
            ]);
            setRoles(rolesData);

            // --- OPTIMIZATION: Create a lookup map for providers ---
            const providerMap = new Map(providersData.map(provider => [provider.id, provider]));

            const processedApps = appsData.map(app => ({
                ...app,
                providerName: app.provider_id ? providerMap.get(app.provider_id)?.short_name || 'N/A' : '',
            }));
            setApplications(processedApps);
        } catch (err) {
            toast.error(parseApiError(err));
        } finally {
            setLoading(false);
        }
    }, [activeNgroupId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };
    
    const filteredAndSortedApps = useMemo(() => {
        const filtered = applications.filter(app =>
            ['name', 'email', 'username', 'providerName', 'justification'].some(field => 
                app[field]?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        const comparator = (a, b) => { /* ... sort logic ... */ return 0; };
        return filtered.sort(comparator);
    }, [applications, order, orderBy, searchTerm]);

    const visibleRows = useMemo(() => {
        return filteredAndSortedApps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredAndSortedApps, page, rowsPerPage]);

    const handleSelectAllClick = (event) => {
        if (event.target.checked) setSelected(filteredAndSortedApps.map((app) => app.id));
        else setSelected([]);
    };

    const handleClick = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) newSelected = [...selected, id];
        else newSelected = selected.filter(selId => selId !== id);
        setSelected(newSelected);
    };

    const handleAcceptClick = () => {
        const app = applications.find(a => a.id === selected[0]);
        setApplicationToProcess({ ...app, role: null }); // Use role object
        setOpenAcceptDialog(true);
    };

    const handleRejectClick = () => setOpenRejectDialog(true);

    const handleConfirmApprove = async () => {
        if (!applicationToProcess?.role?.id) {
            toast.error("Please select a role for the user.");
            return;
        }
        setActionLoading(true);
        try {
            await approveUserApplication(applicationToProcess.id, applicationToProcess.role.id);
            toast.success("Application approved successfully!");
            setOpenAcceptDialog(false);
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
            setOpenRejectDialog(false);
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
        <Box>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Pending User Applications</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField label="Search Applications" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Button variant="contained" color="primary" onClick={handleAcceptClick} disabled={selected.length !== 1 || actionLoading || !hasPrivilege('application:approve')}>Accept</Button>
                            <Button variant="contained" color="error" onClick={handleRejectClick} disabled={selected.length === 0 || actionLoading || !hasPrivilege('application:approve')}>Reject</Button>
                        </Box>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < filteredAndSortedApps.length} checked={filteredAndSortedApps.length > 0 && selected.length === filteredAndSortedApps.length} onChange={handleSelectAllClick} /></TableCell>
                                    {['name', 'email', 'username', 'justification', 'providerName'].map(col => (
                                        <TableCell key={col}><TableSortLabel active={orderBy === col} direction={order} onClick={() => handleRequestSort(col)}>{col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableSortLabel></TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
                                ) : visibleRows.map(app => {
                                    const isItemSelected = isSelected(app.id);
                                    return (
                                        <TableRow key={app.id} hover onClick={() => handleClick(app.id)} selected={isItemSelected}>
                                            <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                            <TableCell>{app.name}</TableCell>
                                            <TableCell>{app.email}</TableCell>
                                            <TableCell>{app.username}</TableCell>
                                            <TableCell>{app.justification}</TableCell>
                                            <TableCell>{app.providerName || 'N/A'}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={filteredAndSortedApps.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    />
                </CardContent>
            </Card>

            <Dialog open={openAcceptDialog} onClose={() => setOpenAcceptDialog(false)}>
                <DialogTitle>Accept User Application</DialogTitle>
                <DialogContent>
                    <Typography>Please assign a role to approve this user.</Typography>
                    <Autocomplete
                        options={getEditableRoles(roles, currentUser?.roles)}
                        getOptionLabel={(option) => option.long_name}
                        onChange={(e, newValue) => setApplicationToProcess(prev => ({ ...prev, role: newValue }))}
                        renderInput={(params) => <TextField {...params} label="Role" margin="dense" fullWidth />}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAcceptDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmApprove} variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : "Approve"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
                <DialogTitle>Confirm Reject</DialogTitle>
                <DialogContent>Are you sure you want to reject the selected application(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmReject} color="error" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : "Reject"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default PendingRequests;