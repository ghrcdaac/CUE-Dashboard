// src/pages/Providers.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, Autocomplete, CircularProgress, MenuItem
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuth from '../hooks/useAuth';
import { Outlet, useLocation } from 'react-router-dom';  // For nested routes
import SideNav from '../components/SideNav'; // Import SideNav
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBoxIcon from '@mui/icons-material/AccountBox'; // Example icon for Providers
import usePageTitle from '../hooks/usePageTitle';


// API Imports
import * as providerApi from '../api/providerApi'; // Corrected import
import { listCueusers } from '../api/cueUser'; // Corrected import


function Providers() {
    usePageTitle("Providers");
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        short_name: '',
        long_name: '',
        can_upload: true,
        point_of_contact: null,
    });
    const [userOptions, setUserOptions] = useState([]); // For point of contact dropdown
    const [editProvider, setEditProvider] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selected, setSelected] = useState([]);
    const { accessToken, logout } = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(true); // For SideNav
    const [isCreating, setIsCreating] = useState(false);


    const handleToggle = () => {
        setOpen(!open);
    };

    const providersMenuItems = [
        { text: 'Providers', path: '/providers', icon: <AccountBoxIcon /> },
    ];


    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('short_name');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    // --- Data Fetching ---
    // Fetch Users for Point of Contact Dropdown *and* Provider Mapping - Memoized
    const fetchUserOptions = useCallback(async (ngroupId) => {
        try {
            const users = await listCueusers(ngroupId, accessToken);
            return users.map(u => ({ id: u.id, name: u.name }));
        } catch (error) {
            console.error("Error fetching user options:", error);
            toast.error(`Error fetching user options: ${error.message}`);
            return []; // Return an empty array on error
        }
    }, [accessToken]);


    const fetchProviders = useCallback(async () => {
        setLoading(true);
        try {
            const ngroupId = localStorage.getItem('CUE_ngroup_id');
            if (!ngroupId) {
                setError("Ngroup ID not found. Please log in again.");
                toast.error("Ngroup ID not found. Please log in again.");
                logout();
                return;
            }
            let data = await providerApi.listProviders(accessToken, { ngroup_id: ngroupId });

            // Fetch user options *once*
            const users = await fetchUserOptions(ngroupId);
            setUserOptions(users); //  set user options for autocomplete

            // Map user names to providers
            const dataWithNames = data.map(provider => {
                const user = users.find(u => u.id === provider.point_of_contact);
                return {
                    ...provider,
                    point_of_contact_name: user ? user.name : '', // Add the user's name
                };
            });

            setProviders(dataWithNames);
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken, logout, fetchUserOptions]);


    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);


    // --- Event Handlers ---

    const handlePOCChange = (event, newValue) => {
        setCreateFormData(prev => ({ ...prev, point_of_contact: newValue ? newValue.id : null }));
    };


    const handleCreateOpen = () => {
        setOpenCreateDialog(true);
    };

    const handleCreateClose = () => {
        setCreateFormData({ // Reset form
            short_name: '',
            long_name: '',
            can_upload: true,
            point_of_contact: null,
        });
        setOpenCreateDialog(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCreateFormData(prev => ({
            ...prev,
            [name]: name === 'can_upload' ? value === 'true' : value,
        }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const ngroupId = localStorage.getItem('CUE_ngroup_id');
            if (!ngroupId) throw new Error("Ngroup ID is missing.");

            const requestData = {
                ...createFormData,
                ngroup_id: ngroupId
            };

            const newProvider = await providerApi.createProvider(requestData, accessToken);
            toast.success("Provider created successfully!");
            fetchProviders(); // Refresh
            handleCreateClose();
        } catch (error) {
            toast.error(`Error creating provider: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditClick = () => {
        if (selected.length !== 1) {
            toast.error("Please select exactly one provider to edit.");
            return;
        }
        const providerToEdit = providers.find(p => p.id === selected[0]);
        setEditProvider(providerToEdit);
        setOpenEditDialog(true);
    };

    const handleEditClose = () => {
        setOpenEditDialog(false);
        setEditProvider(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedProvider = await providerApi.updateProvider(
                editProvider.id,
                {
                    short_name: editProvider.short_name,
                    long_name: editProvider.long_name,
                    can_upload: editProvider.can_upload,
                    point_of_contact: editProvider.point_of_contact,
                },
                accessToken
            );

            // Update local state *including the point_of_contact_name*
            setProviders(providers.map((provider) => {
                if (provider.id === updatedProvider.id) {
                    console.log(userOptions)
                    // Find the updated user's name
                    const updatedUserName = userOptions.find(u => u.id === updatedProvider.point_of_contact)?.name || '';
                    console.log(updatedUserName)
                    return {
                        ...updatedProvider,
                        point_of_contact_name: updatedUserName
                    }
                }
                return provider;
            }));

            toast.success("Provider updated successfully");
            setSelected([]);
            handleEditClose();
        } catch (error) {
            toast.error("Failed to update provider: " + error.message);
        }
    };

    const handleDeleteClick = () => {
        if (selected.length === 0) {
            toast.error("Please select at least one provider to delete.");
            return;
        }
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await Promise.all(selected.map(providerId => providerApi.deleteProvider(providerId, accessToken)));
            setProviders(prev => prev.filter(p => !selected.includes(p.id)));
            setSelected([]);
            toast.success("Provider(s) deleted successfully!");
        } catch (error) {
            toast.error(`Error deleting provider(s): ${error.message}`);
        } finally {
            setOpenDeleteDialog(false);
        }
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const handleSelectAllClick = (event) => {
        setSelected(event.target.checked ? providers.map(n => n.id) : []);
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
                selected.slice(selectedIndex + 1)
            );
        }
        setSelected(newSelected);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedProviders = React.useMemo(() => {
        if (!providers) return [];
        return [...providers].sort((a, b) => {
            const isAsc = order === 'asc';
            if (orderBy === 'short_name') {
                return isAsc
                    ? a.short_name.localeCompare(b.short_name)
                    : b.short_name.localeCompare(a.short_name);
            } else if (orderBy === 'can_upload') {
                return (a.can_upload === b.can_upload) ? 0 : (a.can_upload ? (isAsc ? -1 : 1) : (isAsc ? 1 : -1))
            }
            else if (orderBy === 'point_of_contact_name') {
                return isAsc
                    ? a.point_of_contact_name.localeCompare(b.point_of_contact_name)
                    : b.point_of_contact_name.localeCompare(a.point_of_contact_name);
            }
            return 0;
        });
    }, [providers, order, orderBy]);

    const visibleRows = React.useMemo(() => {
        return sortedProviders.filter(
            (p) =>
                p.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.long_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.point_of_contact_name.toLowerCase().includes(searchTerm.toLowerCase())

        ).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    }, [sortedProviders, searchTerm, page, rowsPerPage]);


    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
            <SideNav menuItems={providersMenuItems} open={open} onToggle={handleToggle} />

            <Box sx={{ flexGrow: 1, p: 3 }}>
                {location.pathname === '/providers' || location.pathname === '/providers/' ? (
                    <>
                        <Card sx={{ marginBottom: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h5">Providers</Typography>
                                        <Box>
                                             {/* Search Field */}
                                            <TextField
                                                label="Search Providers"
                                                variant="outlined"
                                                size="small"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                sx={{ mb: 2, mr: 2 }}
                                            />
                                            {/* Create Button */}
                                            <Button variant="contained" color="success" onClick={handleCreateOpen} startIcon={<AddIcon />}>
                                                Add
                                            </Button>
                                            {/* Edit Button */}
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleEditClick}
                                                disabled={selected.length !== 1}
                                                startIcon={<EditIcon />}
                                                sx={{ ml: 1 }}
                                            >
                                                Edit
                                            </Button>
                                            {/* Delete Button */}
                                            <Button
                                                variant="contained"
                                                color="error"
                                                onClick={handleDeleteClick}
                                                disabled={selected.length === 0}
                                                startIcon={<DeleteIcon />}
                                                sx={{ ml: 1 }}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    </Box>

                                    {loading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : error ? (
                                        <Typography color="error">Error: {error}</Typography>
                                    ) : (
                                        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                                            <Table sx={{ minWidth: 650 }} aria-label="providers table" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                indeterminate={selected.length > 0 && selected.length < providers.length}
                                                                checked={providers.length > 0 && selected.length === providers.length}
                                                                onChange={handleSelectAllClick}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TableSortLabel
                                                                active={orderBy === 'short_name'}
                                                                direction={orderBy === 'short_name' ? order : 'asc'}
                                                                onClick={() => handleRequestSort('short_name')}
                                                            >
                                                                Short Name
                                                            </TableSortLabel>
                                                        </TableCell>
                                                        <TableCell>Long Name</TableCell>
                                                        <TableCell>
                                                            <TableSortLabel
                                                                active={orderBy === 'can_upload'}
                                                                direction={orderBy === 'can_upload' ? order : 'asc'}
                                                                onClick={() => handleRequestSort('can_upload')}>
                                                                Can Upload
                                                            </TableSortLabel>
                                                        </TableCell>
                                                        <TableCell>
                                                            <TableSortLabel
                                                                active={orderBy === 'point_of_contact_name'}
                                                                direction={orderBy === 'point_of_contact_name' ? order : 'asc'}
                                                                onClick={() => handleRequestSort('point_of_contact_name')}>
                                                                Point of Contact
                                                            </TableSortLabel>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {visibleRows.length > 0 ? (
                                                        visibleRows.map((provider) => {
                                                            const isItemSelected = isSelected(provider.id);
                                                            return (
                                                                <TableRow
                                                                    hover
                                                                    onClick={(event) => handleClick(event, provider.id)}
                                                                    role="checkbox"
                                                                    aria-checked={isItemSelected}
                                                                    tabIndex={-1}
                                                                    key={provider.id}
                                                                    selected={isItemSelected}
                                                                >
                                                                    <TableCell padding="checkbox">
                                                                        <Checkbox checked={isItemSelected} />
                                                                    </TableCell>
                                                                    <TableCell component="th" scope="row">
                                                                        {provider.short_name}
                                                                    </TableCell>
                                                                    <TableCell>{provider.long_name}</TableCell>
                                                                    <TableCell>{provider.can_upload ? 'Yes' : 'No'}</TableCell>
                                                                    <TableCell>{provider.point_of_contact_name}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })) : ( <TableRow>
                                                            <TableCell colSpan={5} align="center">No providers found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={providers.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </CardContent>
                        </Card>
                        <ToastContainer position="top-center" />
                    </>
                ) : (
                    <Outlet key={location.pathname} />
                )}
            </Box>

            {/* Create Provider Dialog */}
            <Dialog open={openCreateDialog} onClose={handleCreateClose} fullWidth maxWidth="sm">
                <DialogTitle>Create New Provider</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="short_name"
                        label="Provider Short Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={createFormData.short_name}
                        onChange={handleInputChange}
                        required
                    />
                    <TextField
                        margin="dense"
                        name="long_name"
                        label="Provider Long Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={createFormData.long_name}
                        onChange={handleInputChange}
                    />

                    <Autocomplete
                        fullWidth
                        margin="normal"
                        options={userOptions}
                        getOptionLabel={(option) => option.name}
                        value={userOptions.find(option => option.id === createFormData.point_of_contact) || null}
                        onChange={(event, newValue) => {
                          setCreateFormData({ ...createFormData, point_of_contact: newValue ? newValue.id : null });
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Point of Contact"
                                name="point_of_contact"
                                margin="dense"
                                required
                            />
                        )}
                    />


                    <TextField
                        fullWidth
                        select
                        label="Can Upload"
                        name="can_upload"
                        value={createFormData.can_upload.toString()}
                        onChange={handleInputChange}
                        margin="dense"
                    >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleCreateSubmit} color="primary" disabled={isCreating}>
                        {isCreating ? <CircularProgress size={24} color="inherit" /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Provider Dialog */}
           <Dialog open={openEditDialog} onClose={handleEditClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit Provider</DialogTitle>
                <DialogContent>
                    {editProvider && (
                        <>
                            <TextField
                                autoFocus
                                margin="dense"
                                name="short_name"
                                label="Provider Short Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={editProvider.short_name}
                                onChange={(e) => setEditProvider({ ...editProvider, short_name: e.target.value })}
                                required
                            />
                            <TextField
                                margin="dense"
                                name="long_name"
                                label="Provider Long Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={editProvider.long_name}
                                onChange={(e) => setEditProvider({ ...editProvider, long_name: e.target.value })}
                                required
                            />

                            {/* Provider Autocomplete */}
                            <Autocomplete
                                fullWidth
                                margin="normal"
                                options={userOptions}
                                getOptionLabel={(option) => option.name}
                                value={userOptions.find(option => option.id === editProvider.point_of_contact) || null}
                                onChange={(event, newValue) => {
                                    setEditProvider({ ...editProvider, point_of_contact: newValue ? newValue.id : null });
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Point of Contact"
                                        name="point_of_contact"
                                        margin="dense"
                                        required
                                    />
                                )}
                            />
                             <TextField
                                fullWidth
                                select
                                label="Can Upload"
                                name="can_upload"
                                value={editProvider.can_upload.toString()} // Convert boolean to string for Select
                                onChange={(e) => setEditProvider({ ...editProvider, can_upload: e.target.value === 'true'})}
                                margin="dense"
                                >
                                <MenuItem value="true">Yes</MenuItem>
                                <MenuItem value="false">No</MenuItem>
                            </TextField>

                        </>
                    )}
                </DialogContent>
            <DialogActions>
                <Button onClick={handleEditClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleEditSubmit} color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete the selected provider(s)?
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}

export default Providers;