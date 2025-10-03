import React, { useState, useEffect, useCallback, useMemo } from 'react'; // UPDATED: Restored useCallback
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, CircularProgress, Autocomplete, Container, Alert
} from '@mui/material';
import { useOutletContext, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import PersonIcon from '@mui/icons-material/Person';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import usePageTitle from "../hooks/usePageTitle";
import useAuth from '../hooks/useAuth';
import usePrivileges from '../hooks/usePrivileges';
import { parseApiError } from '../utils/errorUtils';
import { getEditableRoles } from '../utils/permissionUtils';
import { assignUserRole, deleteCueuser } from '../api/cueUser';

// Import actions from the central data cache
import { fetchUsers, fetchRoles, fetchProviders } from '../app/reducers/dataCacheSlice';

const canModifyUser = (currentUser, targetUser) => {
    if (!currentUser || !targetUser?.role) return false;
    const currentUserIsAdmin = currentUser.roles.includes('admin');
    const targetUserIsAdmin = targetUser.roles.includes('admin');
    if (currentUserIsAdmin) return true;
    if (targetUserIsAdmin) return false;
    return true;
};

const headCells = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'username', label: 'Username' },
    { id: 'role', label: 'Role' },
    { id: 'providerName', label: 'Provider' },
];

function Users() {
    usePageTitle("Users");

    const dispatch = useDispatch();
    const { user: currentUser, activeNgroupId } = useAuth();
    const { hasPrivilege } = usePrivileges();
    const { setMenuItems } = useOutletContext();
    const location = useLocation();

    // Get data from the central Redux cache
    const { users, roles, providers } = useSelector((state) => state.dataCache);

    // Local state for UI operations
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const [sorting, setSorting] = useState({ orderBy: 'name', order: 'asc' });
    const [dialog, setDialog] = useState({ open: null, data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        const usersMenuItems = [
            { text: 'Users', path: '/users', icon: <PersonIcon /> },
            { text: 'Pending Requests', path: '/users/pending-requests', icon: <PendingActionsIcon /> },
        ];
        setMenuItems(usersMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    // "Smart" data fetching that uses the cache
    useEffect(() => {
        if (activeNgroupId) {
            if (users.status === 'idle') dispatch(fetchUsers());
            if (roles.status === 'idle') dispatch(fetchRoles());
            if (providers.status === 'idle') dispatch(fetchProviders());
        }
    }, [activeNgroupId, users.status, roles.status, providers.status, dispatch]);

    // Derives the page's loading state from the cache statuses
    useEffect(() => {
        const isLoading = users.status === 'loading' || roles.status === 'loading' || providers.status === 'loading';
        setLoading(isLoading);
    }, [users.status, roles.status, providers.status]);

    const processedUsers = useMemo(() => {
        if (!users.data || !roles.data || !providers.data) return [];

        const roleMap = new Map(roles.data.map(role => [role.short_name, role]));
        const providerMap = new Map(providers.data.map(provider => [provider.id, provider.short_name]));
        
        const populatedUsers = users.data.map(user => {
            const roleName = user.roles && user.roles.length > 0 ? user.roles[0] : null;
            return {
                ...user,
                role: roleName ? roleMap.get(roleName) : null,
                providerName: user.provider_id ? providerMap.get(user.provider_id) || 'N/A' : '',
            };
        });

        let filtered = [...populatedUsers];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = populatedUsers.filter(user =>
                user.name?.toLowerCase().includes(lowercasedTerm) ||
                user.email?.toLowerCase().includes(lowercasedTerm) ||
                user.username?.toLowerCase().includes(lowercasedTerm) ||
                user.providerName?.toLowerCase().includes(lowercasedTerm) ||
                user.role?.long_name.toLowerCase().includes(lowercasedTerm)
            );
        }

        return filtered.sort((a, b) => {
            const isAsc = sorting.order === 'asc' ? 1 : -1;
            let aValue = a[sorting.orderBy];
            let bValue = b[sorting.orderBy];
            if (sorting.orderBy === 'role') {
                aValue = a.role?.long_name || '';
                bValue = b.role?.long_name || '';
            }
            if (aValue === null || aValue === undefined) return 1 * isAsc;
            if (bValue === null || bValue === undefined) return -1 * isAsc;
            return aValue.toString().localeCompare(bValue.toString()) * isAsc;
        });
    }, [users.data, roles.data, providers.data, sorting, searchTerm]);

    const handleClick = useCallback((id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex >= 0) {
            newSelected = selected.filter(selId => selId !== id);
        }
        setSelected(newSelected);
    }, [selected]);
    
    const tableBodyContent = useMemo(() => {
        if (loading) {
            return ( <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow> );
        }
        if (processedUsers.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={6} align="center">
                        <Typography sx={{ py: 5 }} color="text.secondary">
                            {searchTerm ? "No users match your search." : "No users found."}
                        </Typography>
                    </TableCell>
                </TableRow>
            );
        }
        return processedUsers
            .slice(pagination.page * pagination.rowsPerPage, pagination.page * pagination.rowsPerPage + pagination.rowsPerPage)
            .map((user) => {
                const isItemSelected = selected.indexOf(user.id) !== -1;
                const isManageable = canModifyUser(currentUser, user);
                return (
                    <TableRow key={user.id} hover onClick={() => isManageable && handleClick(user.id)} role="checkbox" tabIndex={-1} selected={isItemSelected} sx={{ cursor: isManageable ? 'pointer' : 'default' }}>
                        <TableCell padding="checkbox"><Checkbox checked={isItemSelected} disabled={!isManageable} /></TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.cueusername}</TableCell>
                        <TableCell>{user.role?.long_name || "N/A"}</TableCell>
                        <TableCell>{user.providerName}</TableCell>
                    </TableRow>
                );
            });
    }, [loading, processedUsers, pagination, selected, currentUser, searchTerm, handleClick]);

    const handleOpenDialog = (type) => {
        if (type === 'edit') {
            const userToEdit = processedUsers.find(user => user.id === selected[0]);
            setDialog({ open: 'edit', data: { ...userToEdit }});
        } else {
            setDialog({ open: 'delete', data: null });
        }
    };

    const handleCloseDialog = () => setDialog({ open: null, data: null });

    const handleUpdateUser = async () => {
        if (!dialog.data || !dialog.data.role) {
            toast.error("A role must be selected.");
            return;
        }
        setIsSubmitting(true);
        try {
            await assignUserRole(dialog.data.id, dialog.data.role.id);
            toast.success("User role updated successfully!");
            handleCloseDialog();
            dispatch(fetchUsers());
            setSelected([]);
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        setIsSubmitting(true);
        try {
            await Promise.all(selected.map(userId => deleteCueuser(userId)));
            toast.success("User(s) deleted successfully!");
            setSelected([]);
            handleCloseDialog();
            dispatch(fetchUsers());
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

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelected = processedUsers
                .filter(user => canModifyUser(currentUser, user))
                .map((user) => user.id);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };
    
    if (location.pathname !== '/users') {
        return <Outlet key={location.pathname} />;
    }

    return (
        <Container maxWidth={false} disableGutters>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Users</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField label="Search Users" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Button variant="contained" onClick={() => handleOpenDialog('edit')} disabled={selected.length !== 1 || !hasPrivilege('user:assign_role')} startIcon={<EditIcon />}>Modify Role</Button>
                            <Button variant="contained" color="error" onClick={() => handleOpenDialog('delete')} disabled={selected.length === 0 || !hasPrivilege('user:delete')} startIcon={<DeleteIcon />}>Delete</Button>
                        </Box>
                    </Box>

                    {(users.error || roles.error || providers.error) && <Alert severity="error" sx={{ my: 2 }}>{users.error || roles.error || providers.error}</Alert>}

                    <TableContainer component={Paper}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < processedUsers.length} checked={processedUsers.length > 0 && selected.length === processedUsers.length} onChange={handleSelectAllClick} /></TableCell>
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
                                {tableBodyContent}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={processedUsers.length}
                        rowsPerPage={pagination.rowsPerPage}
                        page={pagination.page}
                        onPageChange={(e, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                        onRowsPerPageChange={(e) => setPagination({ rowsPerPage: parseInt(e.target.value, 10), page: 0 })}
                    />
                </CardContent>
            </Card>

            <Dialog open={dialog.open === 'edit'} onClose={handleCloseDialog} fullWidth maxWidth="xs">
                <DialogTitle>Modify User Role</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Name" fullWidth value={dialog.data?.name || ''} InputProps={{ readOnly: true }} />
                    <Autocomplete
                        options={getEditableRoles(roles.data, currentUser?.roles)}
                        getOptionLabel={(option) => option.long_name}
                        value={dialog.data?.role || null}
                        onChange={(event, newValue) => setDialog(prev => ({...prev, data: {...prev.data, role: newValue}}))}
                        renderInput={(params) => <TextField {...params} label="Role" margin="dense" fullWidth />}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleUpdateUser} variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : "Save"}</Button>
                </DialogActions>
            </Dialog>
            
            <Dialog open={dialog.open === 'delete'} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>Are you sure you want to delete the {selected.length} selected user(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : "Delete"}</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Users;