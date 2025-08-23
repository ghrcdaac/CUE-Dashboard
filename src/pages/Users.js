import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, CircularProgress
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import SideNav from "../components/SideNav";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Autocomplete from "@mui/material/Autocomplete";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Outlet, useLocation } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import usePageTitle from "../hooks/usePageTitle";
import { useSelector } from 'react-redux';

import { listCueusers, updateCueuser, deleteCueuser } from '../api/cueUser';
import { getProviderById } from '../api/providerApi';
import { listRoles } from '../api/roleApi';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [roles, setRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    
    const location = useLocation();

    const [open, setOpen] = useState(true);

    const { activeNgroupId, isLoading: isAuthLoading } = useSelector((state) => state.auth);

    usePageTitle("Users");

    const handleToggle = () => setOpen(!open);
    
    const usersMenuItems = [

        { text: 'Users', path: '/users', icon: <PersonIcon /> },
        { text: 'Pending Requests', path: '/users/pending-requests', icon: <PendingActionsIcon /> },
        { text: 'Rejected Requests', path: '/users/rejected-requests', icon: <CancelIcon /> },
    ];


    const { setMenuItems } = useOutletContext();

    useEffect(() => {
        setMenuItems(usersMenuItems);
        // Optional: clear the menu when the page is left
        return () => setMenuItems([]);
    }, [setMenuItems]);


    usePageTitle("Users");

    // Sorting functionality
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Date formatting function

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
        if (!activeNgroupId) return;
        
        setLoading(true);
        setError(null);
        try {
            const [rolesData, usersData] = await Promise.all([
                listRoles(),
                listCueusers() // No longer needs ngroupId as a parameter
            ]);
            setRoles(rolesData);

            const usersWithProviders = await Promise.all(usersData.map(async (user) => {
                if (user.provider_id) {
                    try {
                        const provider = await getProviderById(user.provider_id);
                        return { ...user, providerName: provider?.short_name || '' };
                    } catch (providerError) {
                        return { ...user, providerName: 'Error' };
                    }
                }
                return { ...user, providerName: '' };
            }));
            setUsers(usersWithProviders);
        } catch (err) {
            setError(err.message);
            toast.error(`Failed to load user data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [activeNgroupId]);

    useEffect(() => {
        if (!isAuthLoading && activeNgroupId) {
            fetchPageData();
        } else if (!isAuthLoading && !activeNgroupId) {
            setLoading(false);
            setUsers([]);
        }
    }, [isAuthLoading, activeNgroupId, fetchPageData]);


    const sortedUsers = React.useMemo(() => {
        if (!users) return [];
        return [...users].sort((a, b) => {
            const isAsc = order === 'asc';
            let aValue = a[orderBy] || '';
            let bValue = b[orderBy] || '';

            if (orderBy === 'role') {
                aValue = roles.find(r => r.id === a.role_id)?.long_name || '';
                bValue = roles.find(r => r.id === b.role_id)?.long_name || '';
            }
            
            if (typeof aValue === 'string') return isAsc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            return isAsc ? aValue - bValue : bValue - aValue;
        });
    }, [users, order, orderBy, roles]);

    const handleSelectAllClick = (event) => {
        if (event.target.checked) setSelected(users.map((user) => user.id));
        else setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) newSelected = [...selected, id];
        else newSelected = selected.filter(selId => selId !== id);
        setSelected(newSelected);
    };
    
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleEditClick = (user) => {
        const selectedRole = roles.find(role => role.id === user.role_id);
        setEditUser({ ...user, role: selectedRole || null });
        setOpenEditDialog(true);
    };
    const handleCloseEditDialog = () => setOpenEditDialog(false);
    const handleDeleteClick = () => {
        if (selected.length === 0) {
            toast.error("Please select at least one user to delete.");
            return;
        }
        setOpenDeleteDialog(true);
    };
    const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);

    const handleUpdateUser = async () => {
        try {
            const updatedUserData = { role_id: editUser.role.id };
            await updateCueuser(editUser.id, updatedUserData);
            toast.success("User updated successfully!");
            handleCloseEditDialog();
            fetchPageData();
        } catch (error) {
            toast.error(`Error updating user: ${error.message}`);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await Promise.all(selected.map(userId => deleteCueuser(userId)));
            toast.success("Users deleted successfully!");
            setSelected([]);
            handleCloseDeleteDialog();
            fetchPageData();
        } catch (error) {
            toast.error(`Error deleting users: ${error.message}`);
        }
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const visibleRows = React.useMemo(() => {
        const filteredUsers = sortedUsers.filter(user =>
            ['name', 'email', 'cueusername'].some(field => 
                user[field]?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        return filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    }, [sortedUsers, page, rowsPerPage, searchTerm]);

    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>

            <Box sx={{ flexGrow: 1, p: 3 }}>

                {location.pathname === '/users' || location.pathname === '/users/' ? (
                    <>
                        {error && <Typography color="error">Error: {error}</Typography>}
                        <Card sx={{ marginBottom: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h5">Users</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <TextField label="Search Users" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mr: 2 }} />
                                        <Button variant="contained" onClick={() => handleEditClick(users.find(user => selected.includes(user.id)))} disabled={selected.length !== 1} startIcon={<EditIcon />} sx={{ mr: 1 }}>Modify</Button>
                                        <Button variant="contained" color="error" onClick={handleDeleteClick} disabled={selected.length === 0} startIcon={<DeleteIcon />}>Delete</Button>
                                    </Box>
                                </Box>
                                <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                                    <Table sx={{ minWidth: 650 }} aria-label="simple table" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < users.length} checked={users.length > 0 && selected.length === users.length} onChange={handleSelectAllClick} /></TableCell>
                                                {['name', 'email', 'cueusername', 'registered', 'role', 'edpubId', 'providerName'].map((headCell) => (
                                                    <TableCell key={headCell} sortDirection={orderBy === headCell ? order : false}>
                                                        <TableSortLabel active={orderBy === headCell} direction={orderBy === headCell ? order : 'asc'} onClick={() => handleRequestSort(headCell)}>
                                                            {headCell.charAt(0).toUpperCase() + headCell.slice(1).replace(/([A-Z])/g, ' $1')}
                                                        </TableSortLabel>
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading || isAuthLoading ? (
                                                <TableRow><TableCell colSpan={8} align="center"><CircularProgress /></TableCell></TableRow>
                                            ) : visibleRows.length > 0 ? (
                                                visibleRows.map((user) => {
                                                    const isItemSelected = isSelected(user.id);
                                                    return (
                                                        <TableRow key={user.id} hover onClick={(event) => handleClick(event, user.id)} role="checkbox" aria-checked={isItemSelected} tabIndex={-1} selected={isItemSelected}>
                                                            <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                            <TableCell>{user.name}</TableCell>
                                                            <TableCell>{user.email}</TableCell>
                                                            <TableCell>{user.cueusername}</TableCell>
                                                            <TableCell>{formatDate(user.registered)}</TableCell>
                                                            <TableCell>{roles.find(role => role.id === user.role_id)?.long_name || "N/A"}</TableCell>
                                                            <TableCell>{user.edpub_id || ""}</TableCell>
                                                            <TableCell>{user.providerName}</TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow><TableCell colSpan={8} align="center">No users found.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={users.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </CardContent>
                        </Card>
                        <ToastContainer position="top-center" />
                        <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
                            <DialogTitle>Modify User Role</DialogTitle>
                            <DialogContent>
                                <TextField margin="dense" label="Name" type="text" fullWidth value={editUser?.name || ''} disabled />
                                <TextField margin="dense" label="Email" type="email" fullWidth value={editUser?.email || ''} disabled />
                                <TextField margin="dense" label="CUE Username" type="text" fullWidth value={editUser?.cueusername || ''} disabled />
                                <Autocomplete
                                    options={roles}
                                    getOptionLabel={(option) => option.long_name}
                                    value={editUser?.role || null}
                                    onChange={(event, newValue) => setEditUser({ ...editUser, role: newValue })}
                                    renderInput={(params) => <TextField {...params} label="Role" margin="dense" />}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseEditDialog}>Cancel</Button>
                                <Button onClick={handleUpdateUser}>Save</Button>
                            </DialogActions>
                        </Dialog>
                        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                            <DialogTitle>Confirm Delete</DialogTitle>
                            <DialogContent>Are you sure you want to delete the selected user(s)?</DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                                <Button onClick={handleConfirmDelete} color="error">Delete</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                ) : (
                    <Outlet key={location.pathname} />
                )}
            </Box>
        </Box>
    );
}

export default Users;
