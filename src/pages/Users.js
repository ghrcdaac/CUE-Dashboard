import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Autocomplete from "@mui/material/Autocomplete";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuth from '../hooks/useAuth';
import { Outlet, useLocation } from 'react-router-dom';
import SideNav from "../components/SideNav";
import PersonIcon from '@mui/icons-material/Person';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import usePageTitle from "../hooks/usePageTitle";

// Import API functions
import { listCueusers, updateCueuser, deleteCueuser } from '../api/cueUser';
import { fetchProviderById } from '../api/providerApi';
import roleApi from '../api/roleApi';


function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false); // Controls the main table loading spinner
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [roles, setRoles] = useState([]); // State for roles
    const [searchTerm, setSearchTerm] = useState(''); // For search functionality

    const { accessToken, logout } = useAuth();  // Get accessToken and logout
    const { navigate } = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(true);

    const handleToggle = () => {
        setOpen(!open);
    };
     const usersMenuItems = [
        { text: 'Users', path: '/users', icon: <PersonIcon /> },
        { text: 'Pending Requests', path: '/users/pending-requests', icon: <PendingActionsIcon /> },
        { text: 'Rejected Requests', path: '/users/rejected-requests', icon: <CancelIcon /> },
    ];



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
        if (!dateString) return ''; // Handle null/undefined dates
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat(navigator.language, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZoneName: 'short'
            }).format(date);

        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid Date"; // Return a fallback string
        }
    };

    const sortedUsers = React.useMemo(() => {
        if (!users) return [];
        return [...users].sort((a, b) => {
            const isAsc = order === 'asc';
            if (orderBy === 'name') {
                return isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            } else if (orderBy === 'email') {
                return isAsc ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
            } else if (orderBy === 'cueusername') {
                return isAsc ? a.cueusername.localeCompare(b.cueusername) : b.cueusername.localeCompare(a.cueusername);
            } else if (orderBy === 'registered') {
                const dateA = new Date(a.registered);
                const dateB = new Date(b.registered);
                return isAsc ? dateA - dateB : dateB - dateA;
            }else if (orderBy === 'role') {
                const roleA = roles.find(r => r.id === a.role_id)?.long_name || '';
                const roleB = roles.find(r => r.id === b.role_id)?.long_name || '';
                return isAsc ? roleA.localeCompare(roleB) : roleB.localeCompare(roleA);
            }  else if (orderBy === 'edpubId') {
                const edpubA = a.edpub_id || '';
                const edpubB = b.edpub_id || '';
                return isAsc ? edpubA.localeCompare(edpubB) : edpubB.localeCompare(edpubA);
            }
            return 0;
        });
    }, [users, order, orderBy, roles]);




    // Fetch roles for the edit dialog dropdown
    const fetchRoles = useCallback(async () => {
        try {
            const fetchedRoles = await roleApi.listRoles(accessToken);
            setRoles(fetchedRoles);
        } catch (error) {
            toast.error(`Error fetching roles: ${error.message}`);
        }
    }, [accessToken]);


   const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
        const ngroupId = localStorage.getItem('CUE_ngroup_id');
        if (!ngroupId) {
            setError("Ngroup ID not found. Please log in again.");
            toast.error("Ngroup ID not found. Please log in again.");
            logout(navigate);
            return;
        }

        let usersData = await listCueusers(ngroupId, accessToken);

        const usersWithProviders = await Promise.all(usersData.map(async (user) => {
            if (user.provider_id && user.provider_id.toLowerCase() !== 'none') {
                try {
                    const provider = await fetchProviderById(user.provider_id, accessToken);
                    return { ...user, providerName: provider ? provider.short_name : '' };
                } catch (providerError) {
                    console.error(`Error fetching provider for user ${user.id}:`, providerError);
                    return { ...user, providerName: '' };
                }
            } else {
                return { ...user, providerName: '' };
            }
        }));

        setUsers(usersWithProviders);
    } catch (error) {
        setError(error.message);
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
}, [accessToken, logout, navigate]);


    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [fetchUsers,  fetchRoles]);


    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            setSelected(users.map((user) => user.id));
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }
        setSelected(newSelected);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleEditClick = (user) => {
        const selectedRole = roles.find(role => role.id === user.role_id);
        setEditUser({
            ...user,
            role: selectedRole || null,
        });
        setOpenEditDialog(true);
    };

    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setEditUser(null);
    };

    const handleUpdateUser = async () => {
        try {
            const updatedUser = await updateCueuser(editUser.id, {
                role_id: editUser.role.id
            }, accessToken);

            setUsers(users.map((user) => (user.id === editUser.id ? { ...user, ...updatedUser, role_id: updatedUser.role_id } : user)));
            setOpenEditDialog(false);
            toast.success("User updated successfully!");

        } catch (error) {
            toast.error(`Error updating user: ${error.message}`);
        }
    };

    const handleDeleteClick = () => {
        if (selected.length === 0) {
            toast.error("Please select at least one user to delete.");
            return;
        }
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const ngroupId = localStorage.getItem('CUE_ngroup_id');
            await Promise.all(selected.map(userId => deleteCueuser(userId, ngroupId, accessToken)));
            setUsers(users.filter(user => !selected.includes(user.id)));
            setSelected([]);
            toast.success("Users deleted successfully!");
        } catch (error) {
            toast.error(`Error deleting users: ${error.message}`);
        } finally {
            setOpenDeleteDialog(false);
        }
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const visibleRows = React.useMemo(
        () => {
            const filteredUsers = sortedUsers.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.cueusername.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        },
        [sortedUsers, page, rowsPerPage, searchTerm]
    );

    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
            <SideNav menuItems={usersMenuItems} open={open} onToggle={handleToggle} />

            <Box sx={{ flexGrow: 1, p: 3 }}>
                {location.pathname === '/users' || location.pathname === '/users/' ? (
                    <>
                        {error && <Typography color="error">Error: {error}</Typography>}

                        <Card sx={{ marginBottom: 2 }}>
                            <CardContent>
                                {/* MOVED THIS BOX */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h5">Users</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}> {/* Container for buttons and search */}
                                        <TextField
                                            label="Search Users"
                                            variant="outlined"
                                            size="small"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            sx={{ mr: 2 }} // Add some margin to the right
                                        />
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleEditClick(users.find(user => selected.includes(user.id)))}
                                            disabled={selected.length !== 1}
                                            startIcon={<EditIcon />}
                                            sx={{ mr: 1 }}
                                        >
                                            Modify
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={handleDeleteClick}
                                            disabled={selected.length === 0}
                                            startIcon={<DeleteIcon />}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                </Box>
                                {/* END MOVED BOX */}
                                <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                                   {loading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                    <Table sx={{ minWidth: 650 }} aria-label="simple table" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black ", padding: '0px 16px' }}>
                                                    <Checkbox
                                                         sx={{
                                                            '& .MuiSvgIcon-root': { fontSize: 20 },
                                                            padding: '9px'
                                                        }}
                                                        indeterminate={selected.length > 0 && selected.length < users.length}
                                                        checked={users.length > 0 && selected.length === users.length}
                                                        onChange={handleSelectAllClick}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'name'}
                                                        direction={orderBy === 'name' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('name')}
                                                    >
                                                        Name
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'email'}
                                                        direction={orderBy === 'email' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('email')}
                                                    >
                                                        Email
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'cueusername'}
                                                        direction={orderBy === 'cueusername' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('cueusername')}
                                                    >
                                                        CUE Username
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'registered'}
                                                        direction={orderBy === 'registered' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('registered')}
                                                    >
                                                        Registered
                                                    </TableSortLabel>
                                               </TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'role'}
                                                        direction={orderBy === 'role' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('role')}
                                                    >
                                                        Role
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'edpubId'}
                                                        direction={orderBy === 'edpubId' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('edpubId')}
                                                    >
                                                      EDPub ID
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Provider</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {visibleRows.length > 0 ? (
                                                visibleRows.map((user) => {
                                                    const isItemSelected = isSelected(user.id);
                                                    return (
                                                        <TableRow key={user.id} hover onClick={(event) => handleClick(event, user.id)}
                                                            role="checkbox"
                                                            aria-checked ={isItemSelected}
                                                            tabIndex={-1}
                                                            selected={isItemSelected}>
                                                            <TableCell  sx={{padding: '0px 16px'}}>
                                                                <Checkbox
                                                                 sx={{
                                                                    '& .MuiSvgIcon-root': { fontSize: 20 },
                                                                     padding: '9px'
                                                                }}
                                                                checked={isItemSelected} />
                                                            </TableCell>
                                                            <TableCell>{user.name}</TableCell>
                                                            <TableCell>{user.email}</TableCell>
                                                            <TableCell>{user.cueusername}</TableCell>
                                                            <TableCell>{formatDate(user.registered)}</TableCell>
                                                            <TableCell>
                                                                {roles.find(role => role.id === user.role_id)?.long_name || "N/A"}
                                                            </TableCell>
                                                            <TableCell>{user.edpub_id || ""}</TableCell>
                                                            <TableCell>{user.providerName}</TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} align="center"> {/*  8 columns */}
                                                        No users found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    )}
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

                        {/* Edit User Dialog */}
                        <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
                            <DialogTitle>Modify User Role</DialogTitle>
                            <DialogContent>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    name="name"
                                    label="Name"
                                    type="text"
                                    fullWidth
                                    value={editUser ? editUser.name : ''}
                                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                    disabled // Disable editing name
                                />
                                <TextField
                                    margin="dense"
                                    name="email"
                                    label="Email"
                                    type="email"
                                    fullWidth
                                    value={editUser ? editUser.email : ''}
                                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                    disabled // Disable editing email
                                />
                                <TextField
                                    margin="dense"
                                    name="cueusername"
                                    label="CUE Username"
                                    type="text"
                                    fullWidth
                                    value={editUser ? editUser.cueusername : ''}
                                    onChange={(e) => setEditUser({ ...editUser, cueusername: e.target.value })}
                                    disabled // Disable editing cueusername

                                />
                                <Autocomplete
                                    margin="dense"
                                    options={roles}
                                    getOptionLabel={(option) => option.long_name}
                                    value={editUser ? editUser.role : null}
                                    onChange={(event, newValue) => {
                                        setEditUser({ ...editUser, role: newValue });
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Role"
                                            margin="dense"
                                            name="role"
                                        />
                                    )}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseEditDialog}>Cancel</Button>
                                <Button onClick={handleUpdateUser}>Save</Button>
                            </DialogActions>
                        </Dialog>

                        {/* Delete Confirmation Dialog */}
                        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                            <DialogTitle>Confirm Delete</DialogTitle>
                            <DialogContent>
                                Are you sure you want to delete the selected user(s)?
                            </DialogContent>
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