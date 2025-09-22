// src/pages/Users.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, CircularProgress, Autocomplete
} from '@mui/material';
import { useOutletContext, Outlet, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import PersonIcon from '@mui/icons-material/Person';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// --- CHANGE: Removed unused icons ---

import usePageTitle from "../hooks/usePageTitle";
import useAuth from '../hooks/useAuth';
import usePrivileges from '../hooks/usePrivileges';
import { parseApiError } from '../utils/errorUtils';
import { getEditableRoles } from '../utils/permissionUtils'; 

import { listCueusers, assignUserRole, deleteCueuser } from '../api/cueUser';
import { listProviders } from '../api/providerApi';
import { listRoles } from '../api/roleApi';

// --- CHANGE: Updated canModifyUser logic for admin permissions ---
const canModifyUser = (currentUser, targetUser) => {
    if (!currentUser || !targetUser?.role) return false;
    
    const currentUserIsAdmin = currentUser.roles.includes('admin');
    const targetUserIsAdmin = targetUser.roles.includes('admin');
    const targetUserIsManager = targetUser.roles.includes('daac_manager');
    
    // An admin can manage ANY user, including other admins.
    if (currentUserIsAdmin) {
        return true;
    }
    
    // A non-admin cannot manage admins or managers.
    if (targetUserIsAdmin || targetUserIsManager) {
        return false;
    }
    
    return true;
};


function Users() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const { user: currentUser, activeNgroupId } = useAuth();
    const { privileges, hasPrivilege } = usePrivileges();
    const { setMenuItems } = useOutletContext();
    const location = useLocation();
    usePageTitle("Users");

    useEffect(() => {
        const usersMenuItems = [
            { text: 'Users', path: '/users', icon: <PersonIcon /> },
            { text: 'Pending Requests', path: '/users/pending-requests', icon: <PendingActionsIcon /> },
            { text: 'Rejected Requests', path: '/users/rejected-requests', icon: <CancelIcon /> },
        ];
        setMenuItems(usersMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    const fetchPageData = useCallback(async () => {
        if (!activeNgroupId) return;
        setLoading(true);
        try {
            const [rolesData, usersData, providersData] = await Promise.all([
                listRoles(),
                listCueusers(),
                listProviders(activeNgroupId)
            ]);
            setRoles(rolesData);
            const roleMap = new Map(rolesData.map(role => [role.short_name, role]));
            const providerMap = new Map(providersData.map(provider => [provider.id, provider]));
            const processedUsers = usersData.map(user => {
                const roleName = user.roles && user.roles.length > 0 ? user.roles[0] : null;
                return {
                    ...user,
                    role: roleName ? roleMap.get(roleName) : null,
                    providerName: user.provider_id ? providerMap.get(user.provider_id)?.short_name || 'N/A' : '',
                };
            });
            setUsers(processedUsers);
        } catch (err){
            toast.error(parseApiError(err));
        } finally {
            setLoading(false);
        }
    }, [activeNgroupId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);
    
    const filteredAndSortedUsers = useMemo(() => {
        const filtered = users.filter(user =>
            ['name', 'email', 'cueusername', 'providerName'].some(field =>
                user[field]?.toLowerCase().includes(searchTerm.toLowerCase())
            ) || user.role?.long_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const comparator = (a, b) => {
            const isAsc = order === 'asc';
            let aValue = a[orderBy] || '';
            let bValue = b[orderBy] || '';
            if (orderBy === 'role') {
                aValue = a.role?.long_name || '';
                bValue = b.role?.long_name || '';
            }
            if (aValue < bValue) return isAsc ? -1 : 1;
            if (aValue > bValue) return isAsc ? 1 : -1;
            return 0;
        };
        return filtered.sort(comparator);
    }, [users, order, orderBy, searchTerm]);

    const visibleRows = useMemo(() => {
        return filteredAndSortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredAndSortedUsers, page, rowsPerPage]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelected = filteredAndSortedUsers
                .filter(user => canModifyUser(currentUser, user))
                .map((user) => user.id);
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

    const handleEditClick = () => {
        if (selected.length !== 1) return;
        const userToEdit = users.find(user => user.id === selected[0]);
        setEditUser(userToEdit);
        setOpenEditDialog(true);
    };

    const handleDeleteClick = () => {
        if (selected.length === 0) return;
        setOpenDeleteDialog(true);
    };

    const handleUpdateUser = async () => {
        if (!editUser || !editUser.role) {
            toast.error("A role must be selected.");
            return;
        }
        const originalUser = users.find(u => u.id === editUser.id);
        if (originalUser && originalUser.role?.id === editUser.role.id) {
            toast.info("No changes were made.");
            setOpenEditDialog(false);
            return;
        }
        try {
            await assignUserRole(editUser.id, editUser.role.id);
            toast.success("User role updated successfully!");
            setOpenEditDialog(false);
            fetchPageData();
            setSelected([]);
        } catch (error) {
            toast.error(parseApiError(error));
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await Promise.all(selected.map(userId => deleteCueuser(userId)));
            toast.success("User(s) deleted successfully!");
            setSelected([]);
            setOpenDeleteDialog(false);
            fetchPageData();
        } catch (error) {
            toast.error(parseApiError(error));
        }
    };
    
    const isSelected = (id) => selected.indexOf(id) !== -1;
    
    if (location.pathname !== '/users' && location.pathname !== '/users/') {
        return <Outlet key={location.pathname} />;
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
            ) : (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">Users</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField label="Search Users" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <Button variant="contained" onClick={handleEditClick} disabled={selected.length !== 1 || !hasPrivilege('user:assign_role')} startIcon={<EditIcon />}>Modify Role</Button>
                                {/* --- CHANGE: Removed the Suspend/Reactivate buttons --- */}
                                <Button variant="contained" color="error" onClick={handleDeleteClick} disabled={selected.length === 0 || !hasPrivilege('user:delete')} startIcon={<DeleteIcon />}>Delete</Button>
                            </Box>
                        </Box>
                        <TableContainer component={Paper}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < filteredAndSortedUsers.length} checked={filteredAndSortedUsers.length > 0 && selected.length === filteredAndSortedUsers.length} onChange={handleSelectAllClick} /></TableCell>
                                        <TableCell><TableSortLabel active={orderBy === 'name'} direction={order} onClick={() => handleRequestSort('name')}>Name</TableSortLabel></TableCell>
                                        <TableCell><TableSortLabel active={orderBy === 'email'} direction={order} onClick={() => handleRequestSort('email')}>Email</TableSortLabel></TableCell>
                                        <TableCell><TableSortLabel active={orderBy === 'cueusername'} direction={order} onClick={() => handleRequestSort('cueusername')}>Username</TableSortLabel></TableCell>
                                        <TableCell><TableSortLabel active={orderBy === 'role'} direction={order} onClick={() => handleRequestSort('role')}>Role</TableSortLabel></TableCell>
                                        <TableCell><TableSortLabel active={orderBy === 'providerName'} direction={order} onClick={() => handleRequestSort('providerName')}>Provider</TableSortLabel></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {visibleRows.map((user) => {
                                        const isItemSelected = isSelected(user.id);
                                        const isManageable = canModifyUser(currentUser, user);
                                        return (
                                            <TableRow key={user.id} hover onClick={(event) => isManageable && handleClick(event, user.id)} role="checkbox" tabIndex={-1} selected={isItemSelected} sx={{ cursor: isManageable ? 'pointer' : 'default' }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox checked={isItemSelected} disabled={!isManageable} />
                                                </TableCell>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.cueusername}</TableCell>
                                                <TableCell>{user.role?.long_name || "N/A"}</TableCell>
                                                <TableCell>{user.providerName}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={filteredAndSortedUsers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => {setRowsPerPage(parseInt(e.target.value, 10)); setPage(0);}}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Dialogs */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle>Modify User Role</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Name" fullWidth value={editUser?.name || ''} InputProps={{ readOnly: true }} />
                    <Autocomplete
                        options={getEditableRoles(roles, privileges)}
                        getOptionLabel={(option) => option.long_name}
                        value={editUser?.role || null}
                        onChange={(event, newValue) => setEditUser({ ...editUser, role: newValue })}
                        renderInput={(params) => <TextField {...params} label="Role" margin="dense" fullWidth />}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                    <Button onClick={handleUpdateUser}>Save</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>Are you sure you want to delete the {selected.length} selected user(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
            <ToastContainer position="top-center" />
        </Box>
    );
}

export default Users;