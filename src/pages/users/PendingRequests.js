import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, Autocomplete, CircularProgress
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import usePageTitle from "../../hooks/usePageTitle";
import { useSelector } from 'react-redux';

// --- UPDATED API IMPORTS ---
import { listUserApplications, approveUserApplication, rejectUserApplication } from '../../api/userApplicationApi';
import { listRoles } from '../../api/roleApi';
import { getProviderById } from '../../api/providerApi';

function PendingRequests() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false); // Changed initial state to false
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState([]);
    const [openAcceptDialog, setOpenAcceptDialog] = useState(false);
    const [openRejectDialog, setOpenRejectDialog] = useState(false);
    const [applicationToProcess, setApplicationToProcess] = useState(null);
    const [roles, setRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');

    const ngroupId = useSelector((state) => state.auth.ngroupId);
    usePageTitle("Pending User Requests");

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat(navigator.language, {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: 'numeric', minute: 'numeric', timeZoneName: 'short'
            }).format(date);
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid Date";
        }
    };

    const fetchPageData = useCallback(async () => {
        if (!ngroupId) {
            return;
        }
        setLoading(true);
        try {
            const [rolesData, appsData] = await Promise.all([
                listRoles(),
                listUserApplications('pending')
            ]);
            setRoles(rolesData);

            const appsWithProviders = await Promise.all(appsData.map(async (app) => {
                if (app.provider_id) {
                    try {
                        const provider = await getProviderById(app.provider_id);
                        return { ...app, providerName: provider?.short_name || '' };
                    } catch (e) { return { ...app, providerName: 'Error' }; }
                }
                return { ...app, providerName: '' };
            }));
            setApplications(appsWithProviders);
        } catch (err) {
            setError(err.message);
            toast.error(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [ngroupId]);

    useEffect(() => {
        // --- FIX: Only fetch data if the ngroupId is available ---
        if (ngroupId) {
            fetchPageData();
        }
    }, [ngroupId, fetchPageData]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedApplications = React.useMemo(() => {
        return [...applications].sort((a, b) => {
            const isAsc = order === 'asc';
            let aValue = a[orderBy] || '';
            let bValue = b[orderBy] || '';
            if (typeof aValue === 'string') return isAsc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            return isAsc ? aValue - bValue : bValue - aValue;
        });
    }, [applications, order, orderBy]);

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            setSelected(applications.map((app) => app.id));
            return;
        }
        setSelected([]);
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
        setApplicationToProcess({ ...app, role_id: null });
        setOpenAcceptDialog(true);
    };

    const handleRejectClick = () => setOpenRejectDialog(true);

    const handleConfirmApprove = async () => {
        if (!applicationToProcess?.role_id) {
            toast.error("Please select a role for the user.");
            return;
        }
        setActionLoading(true);
        try {
            await approveUserApplication(applicationToProcess.id, applicationToProcess.role_id);
            toast.success("Application approved successfully!");
            setOpenAcceptDialog(false);
            setSelected([]);
            fetchPageData(); // Refresh data
        } catch (error) {
            toast.error(`Error approving application: ${error.message}`);
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
            fetchPageData(); // Refresh data
        } catch (error) {
            toast.error(`Error rejecting applications: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const visibleRows = React.useMemo(() => {
        return sortedApplications
            .filter(app => ['name', 'email', 'username', 'providerName'].some(field => app[field]?.toLowerCase().includes(searchTerm.toLowerCase())))
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [sortedApplications, page, rowsPerPage, searchTerm]);

    return (
        <Box sx={{ p: 3 }}>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Pending User Applications</Typography>
                        <Box>
                            <TextField label="Search Applications" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mr: 2 }} />
                            <Button variant="contained" color="primary" onClick={handleAcceptClick} disabled={selected.length !== 1 || actionLoading} sx={{ mr: 1 }}>
                                Accept
                            </Button>
                            <Button variant="contained" color="error" onClick={handleRejectClick} disabled={selected.length === 0 || actionLoading}>
                                Reject
                            </Button>
                        </Box>
                    </Box>
                    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box> :
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox"><Checkbox onChange={handleSelectAllClick} /></TableCell>
                                        {['name', 'email', 'username', 'applied', 'account_type', 'providerName', 'edpub_id', 'justification'].map(col => (
                                            <TableCell key={col}><TableSortLabel active={orderBy === col} direction={order} onClick={() => handleRequestSort(col)}>{col.replace('_', ' ').toUpperCase()}</TableSortLabel></TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {visibleRows.map(app => {
                                        const isItemSelected = isSelected(app.id);
                                        return (
                                            <TableRow key={app.id} hover onClick={() => handleClick(app.id)} selected={isItemSelected}>
                                                <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                <TableCell>{app.name}</TableCell>
                                                <TableCell>{app.email}</TableCell>
                                                <TableCell>{app.username}</TableCell>
                                                <TableCell>{formatDate(app.applied)}</TableCell>
                                                <TableCell>{app.account_type}</TableCell>
                                                <TableCell>{app.providerName || 'N/A'}</TableCell>
                                                <TableCell>{app.edpub_id || 'N/A'}</TableCell>
                                                <TableCell>{app.justification}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    }
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={applications.length}
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
                        options={roles}
                        getOptionLabel={(option) => option.long_name}
                        onChange={(e, newValue) => setApplicationToProcess(prev => ({ ...prev, role_id: newValue?.id }))}
                        renderInput={(params) => <TextField {...params} label="Role" margin="dense" fullWidth />}
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
