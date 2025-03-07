import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, IconButton, Box, Card, CardContent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Autocomplete from "@mui/material/Autocomplete";
import { fetchCueUsers, updateCueUser, deleteCueUser } from '../api/cueUser';
import { fetchNgroups } from "../api/ngroup";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuth from '../hooks/useAuth';
import { Outlet, useLocation } from 'react-router-dom'; // Import Outlet and useLocation
import SideNav from "../components/SideNav";
import PersonIcon from '@mui/icons-material/Person';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import usePageTitle from "../hooks/usePageTitle";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [ngroups, setNgroups] = useState({});
    const [ngroupOptions, setNgroupOptions] = useState([]);  // Keep ngroupOptions here
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const { accessToken } = useAuth();
    const location = useLocation(); // For SideNav and conditional rendering
    const [open, setOpen] = useState(true);  // For SideNav

    const handleToggle = () => {
        setOpen(!open);
    };
    const usersMenuItems = [
        { text: 'Users', path: '/users', icon: <PersonIcon /> },
        { text: 'Pending Requests', path: '/users/pending-requests', icon: <PendingActionsIcon /> },
        { text: 'Rejected Requests', path: '/users/rejected-requests', icon: <CancelIcon /> },
    ];

   
    usePageTitle("Users");

    const fetchNgroupOptions = async () => {
        try {
            const groups = await fetchNgroups(accessToken);
            setNgroupOptions(groups);  // Keep this here
        } catch (error) {
            console.error("Error fetching ngroup options:", error);
            toast.error(`Error fetching ngroup options: ${error.message}`);
        }
    };

    const fetchNgroupData = async () => {
        try {
            const groups = await fetchNgroups(accessToken);
            const ngroupMap = {};
            groups.forEach(group => {
                ngroupMap[group.id] = group.short_name;
            });
            setNgroups(ngroupMap);
        } catch (error) {
            console.error("Error fetching ngroup data:", error);
            toast.error(`Error fetching ngroup names: ${error.message}`);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersData = await fetchCueUsers(accessToken);
            setUsers(usersData);
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchNgroupOptions(); // Keep this here
    }, [accessToken]);

    useEffect(() => {
        fetchNgroupData();
    }, [users]);

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
        setEditUser({ ...user, ngroup_id: ngroups[user.ngroup_id] || "" });
        setOpenEditDialog(true);
    };

    const handleNgroupAutocompleteChange = (event, value, formType) => {
        if (formType === "edit") {
            if (value) {
                setEditUser({ ...editUser, ngroup_id: value });
            } else {
                setEditUser({ ...editUser, ngroup_id: "" });
            }
        }
    };

    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setEditUser(null);
    };

    const handleUpdateUser = async () => {
        try {
            let selectedNgroup = null;
            if (editUser.ngroup_id) {
                selectedNgroup = ngroupOptions.find(
                    (ngroup) => ngroup.short_name === editUser.ngroup_id
                );
                if (!selectedNgroup) {
                    toast.error("Invalid ngroup selected.");
                    return;
                }
            }
            const updatedUser = await updateCueUser(editUser.id, {
                ...editUser,
                ngroup_id: selectedNgroup ? selectedNgroup.id : null,
            }, accessToken);

            setUsers(users.map((user) => (user.id === editUser.id ? updatedUser : user)));
            setOpenEditDialog(false);
            toast.success("User updated successfully!");
            fetchNgroupData(); // Refresh ngroup data
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
            await Promise.all(selected.map(userId => deleteCueUser(userId, accessToken)));
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
        () => users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [users, page, rowsPerPage]
    );

    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
            <SideNav menuItems={usersMenuItems} open={open} onToggle={handleToggle} />

            <Box sx={{ flexGrow: 1, p: 3 }}>
                {/* Conditionally render Table OR Outlet */}
                {location.pathname === '/users' || location.pathname === '/users/' ? (
                    <>
                        {loading && <Typography>Loading users...</Typography>}
                        {error && <Typography color="error">Error: {error}</Typography>}

                        <Card sx={{ marginBottom: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                    <Typography variant="h5">Users</Typography>
                                    <Box>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleEditClick(users.find(user => selected.includes(user.id)))}
                                            disabled={selected.length !== 1}
                                            startIcon={<EditIcon />}
                                            sx={{ mr: 1 }}
                                        >
                                            Edit
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
                                <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                                    <Table sx={{ minWidth: 650 }} aria-label="simple table" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox" sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                                    <Checkbox
                                                        indeterminate={selected.length > 0 && selected.length < users.length}
                                                        checked={users.length > 0 && selected.length === users.length}
                                                        onChange={handleSelectAllClick}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Name</TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Email</TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>CUE Username</TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Registered</TableCell>
                                                <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Group</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {visibleRows.map((user) => {
                                                const isItemSelected = isSelected(user.id);
                                                return (
                                                    <TableRow key={user.id} hover onClick={(event) => handleClick(event, user.id)}
                                                        role="checkbox"
                                                        aria-checked={isItemSelected}
                                                        tabIndex={-1}
                                                        selected={isItemSelected}>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox checked={isItemSelected} />
                                                        </TableCell>
                                                        <TableCell>{user.name}</TableCell>
                                                        <TableCell>{user.email}</TableCell>
                                                        <TableCell>{user.cueusername}</TableCell>
                                                        <TableCell>{user.registered}</TableCell>
                                                        <TableCell>{ngroups[user.ngroup_id] || "Test Group"}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
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
                        {/* Edit User Dialog */}
                        <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
                            <DialogTitle>Edit User</DialogTitle>
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
                                />
                                <TextField
                                    margin="dense"
                                    name="email"
                                    label="Email"
                                    type="email"
                                    fullWidth
                                    value={editUser ? editUser.email : ''}
                                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                />
                                <TextField
                                    margin="dense"
                                    name="cueusername"
                                    label="CUE Username"
                                    type="text"
                                    fullWidth
                                    value={editUser ? editUser.cueusername : ''}
                                    onChange={(e) => setEditUser({ ...editUser, cueusername: e.target.value })}
                                />
                                <Autocomplete
                                    margin="dense"
                                    options={ngroupOptions}
                                    getOptionLabel={(option) => option.short_name}
                                    value={ngroupOptions.find(option => option.short_name === editUser?.ngroup_id) || null}
                                    onChange={(event, newValue) => {
                                        handleNgroupAutocompleteChange(event, newValue ? newValue.short_name : "", "edit");
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Ngroup"
                                            margin="dense"
                                            name="ngroup_id"
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