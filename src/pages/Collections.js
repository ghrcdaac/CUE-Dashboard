// src/pages/Collections.js
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
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import usePageTitle from "../hooks/usePageTitle";
import CollectionsIcon from '@mui/icons-material/Collections';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
// API Imports
import * as collectionApi from '../api/collectionApi';
import { listProviders } from '../api/providerApi';
import { listEgresses } from '../api/egressAPI';
import { fetchNgroups } from "../api/ngroup";

function Collections() {
    usePageTitle("Collections");
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        short_name: '',
        provider_id: null,
        active: true,
        egress_id: null,
    });
    const [providerOptions, setProviderOptions] = useState([]);
    const [egressOptions, setEgressOptions] = useState([]); // Egress options (just for listing)
    const [editCollection, setEditCollection] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selected, setSelected] = useState([]);
    const { accessToken, logout } = useAuth();
    const location = useLocation();
    const [isCreating, setIsCreating] = useState(false);

    const collectionsMenuItems = [
        { text: 'Collection', path: '/collections', icon: <CollectionsIcon /> },
        { text: 'Files', path: '/collections/create', icon: <InsertDriveFileIcon /> },
    ];

    const { setMenuItems } = useOutletContext();

    useEffect(() => {
        setMenuItems(collectionsMenuItems);
        // Optional: clear the menu when the page is left
        return () => setMenuItems([]);
    }, [setMenuItems]);

    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('short_name');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    // --- Data Fetching ---

    // Fetch Egress and Provider Options (for dropdowns)
    const fetchOptions = useCallback(async (ngroupId) => {
        try {
            const egresses = await listEgresses(ngroupId, accessToken);
            const providersData = await listProviders(accessToken, { ngroup_id: ngroupId });

            return {
                egresses: egresses.map(e => ({ id: e.id, path: e.path })),
                providers: providersData.map(p => ({ id: p.id, short_name: p.short_name }))
            };

        } catch (error) {
            console.error("Error fetching options:", error);
            toast.error(`Error fetching options: ${error.message}`);
            return { egresses: [], providers: [] }; // Return empty arrays on error
        }
    }, [accessToken]);



    const fetchCollections = useCallback(async () => {
        setLoading(true);
        try {
            const ngroupId = localStorage.getItem('CUE_ngroup_id');
            if (!ngroupId) {
                setError("Ngroup ID not found. Please log in again.");
                toast.error("Ngroup ID not found. Please log in again.");
                logout();
                return;
            }
            const data = await collectionApi.listCollections(ngroupId, accessToken);
            const { egresses, providers } = await fetchOptions(ngroupId);

            setEgressOptions(egresses);
            setProviderOptions(providers);
            // Fetch and attach egress paths and provider names *here*
            const collectionsWithDetails = data.map((collection) => {
                const egressData = egresses.find(e => e.id === collection.egress_id);
                const provider = providers.find(p => p.id === collection.provider_id);

                return {
                    ...collection,
                    egress_path: egressData ? egressData.path : '', // Add the egress path to the collection object
                    provider_name: provider ? provider.short_name : '' // Add provider name
                };
            });
            setCollections(collectionsWithDetails);


        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken, logout, fetchOptions]);


    useEffect(() => {
        const ngroupId = localStorage.getItem('CUE_ngroup_id');

        if(ngroupId){
            fetchCollections();
        }


    }, [fetchCollections]);


    // --- Event Handlers ---
    const handleProviderChange = (event, newValue) => {
        setCreateFormData(prev => ({ ...prev, provider_id: newValue ? newValue.id : null }));
    };

    const handleEgressChange = (event, newValue) => {
        setCreateFormData(prev => ({ ...prev, egress_id: newValue ? newValue.id : null }));
    };

    const handleCreateOpen = () => {
        setOpenCreateDialog(true);
    };

    const handleCreateClose = () => {
        setCreateFormData({
            short_name: '',
            provider_id: null,
            active: true,
            egress_id: null,
        });
        setOpenCreateDialog(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCreateFormData(prev => ({
            ...prev,
            [name]: name === 'active' ? value === 'true' : value,
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
                ngroup_id: ngroupId,
            };
            const newCollection = await collectionApi.createCollection(requestData, accessToken);
            toast.success("Collection created successfully!");
            fetchCollections(); // Refresh
            handleCreateClose();
        } catch (error) {
            toast.error(`Error creating collection: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditClick = () => {
        if (selected.length !== 1) {
            toast.error("Please select exactly one collection to edit.");
            return;
        }
        const collectionToEdit = collections.find(c => c.id === selected[0]);

        // Fetch and attach egress and provider details for the selected collection

        setEditCollection(collectionToEdit);
        setOpenEditDialog(true);
    };
    const handleEditClose = () => {
        setOpenEditDialog(false);
        setEditCollection(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedCollection = await collectionApi.updateCollection(
                editCollection.id,
                {
                    short_name: editCollection.short_name,
                    provider_id: editCollection.provider_id,
                    egress_id: editCollection.egress_id,
                    active: editCollection.active,
                },
                accessToken
            );

             // No need to re-fetch, just update based on the *current* providerOptions and egressOptions
            setCollections(collections.map((collection) =>
                collection.id === updatedCollection.id ? {
                    ...updatedCollection,
                    egress_path: egressOptions.find(e => e.id === updatedCollection.egress_id)?.path || '',
                    provider_name: providerOptions.find(p => p.id === updatedCollection.provider_id)?.short_name || '',
                } : collection
            )
            );
            toast.success("Collection updated successfully");
            setSelected([]);
            handleEditClose();
        } catch (error) {
            toast.error("Failed to update collection: " + error.message);
        }
    };

    const handleActiveToggle = async () => {
        if (selected.length === 0) {
            toast.error("Please select at least one collection.");
            return;
        }
        try {
            for (const collectionId of selected) {
                const currentActive = collections.find(c => c.id === collectionId).active;
                if (currentActive) {
                    await collectionApi.deactivateCollection(collectionId, accessToken);
                } else {
                    await collectionApi.activateCollection(collectionId, accessToken);
                }
            }
            fetchCollections(); // Refresh after *all* updates
            toast.success("Collection(s) status updated successfully!");
            setSelected([]); // Clear selection
        } catch (error) {
            toast.error("Failed to update collection status: " + error.message);
        }
    };

    const handleDeleteClick = () => {
        if (selected.length === 0) {
            toast.error("Please select at least one collection to delete.");
            return;
        }
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        const ngroupId = localStorage.getItem('CUE_ngroup_id');
        try {
            await Promise.all(selected.map(collectionId => collectionApi.deleteCollection(collectionId, ngroupId, accessToken)));
            setCollections(prev => prev.filter(c => !selected.includes(c.id)));
            setSelected([]);
            toast.success("Collection(s) deleted successfully!");
        } catch (error) {
            toast.error(`Error deleting collection(s): ${error.message}`);
        } finally {
            setOpenDeleteDialog(false); // Always close in finally
        }
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const handleSelectAllClick = (event) => {
        setSelected(event.target.checked ? collections.map(n => n.id) : []);
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

    const sortedCollections = React.useMemo(() => {
        if (!collections) return [];

        return [...collections].sort((a, b) => {
            const isAsc = order === 'asc';
            if (orderBy === 'short_name') {
                return isAsc ? a.short_name.localeCompare(b.short_name) : b.short_name.localeCompare(a.short_name);
            }
            // Add sorting for the 'active' field
            else if (orderBy === 'active') {
                // Convert boolean to string for consistent comparison. 'true' will come before 'false'
                const aActive = String(a.active);
                const bActive = String(b.active);
                return isAsc ? aActive.localeCompare(bActive) : bActive.localeCompare(aActive);
            }
            return 0;
        });
    }, [collections, order, orderBy]);

    const visibleRows = React.useMemo(
        () =>
            sortedCollections.filter(c => c.short_name.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [sortedCollections, searchTerm, page, rowsPerPage]
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
            <Box sx={{ flexGrow: 1 }}>
                {location.pathname === '/collections' || location.pathname === '/collections/' ? (
                    <>
                        <Card sx={{ marginBottom: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h5">Collections</Typography>
                                    <Box>
                                        <TextField
                                            label="Search Collections"
                                            variant="outlined"
                                            size="small"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            sx={{ mb: 2, mr: 2 }}
                                        />
                                        <Button variant="contained" color="success" onClick={handleCreateOpen} startIcon={<AddIcon />}>
                                            Add
                                        </Button>
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
                                        <Button
                                            variant="contained"
                                            color={selected.length > 0 && collections.find(c => selected.includes(c.id))?.active ? "error" : "success"}
                                            onClick={handleActiveToggle}
                                            startIcon={selected.length > 0 && collections.find(c => selected.includes(c.id))?.active ? <CloseIcon /> : <DoneIcon />}
                                            disabled={selected.length === 0}
                                            sx={{ ml: 1 }}
                                        >
                                            {selected.length > 0 && collections.find(c => selected.includes(c.id))?.active ? 'Deactivate' : 'Activate'}
                                        </Button>
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
                                        <Table sx={{ minWidth: 650 }} aria-label="collections table" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell padding="checkbox" sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                                        <Checkbox
                                                            indeterminate={selected.length > 0 && selected.length < collections.length}
                                                            checked={collections.length > 0 && selected.length === collections.length}
                                                            onChange={handleSelectAllClick}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}> 
                                                        <TableSortLabel
                                                            active={orderBy === 'short_name'}
                                                            direction={orderBy === 'short_name' ? order : 'asc'}
                                                            onClick={() => handleRequestSort('short_name')}
                                                        >
                                                            Short Name
                                                        </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Provider</TableCell>
                                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Egress Path</TableCell>
                                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                                        <TableSortLabel
                                                            active={orderBy === 'active'}
                                                            direction={orderBy === 'active' ? order : 'asc'}
                                                            onClick={() => handleRequestSort('active')}
                                                        >
                                                            Active
                                                        </TableSortLabel>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {visibleRows.length > 0 ? (
                                                    visibleRows.map((collection) => {
                                                        const isItemSelected = isSelected(collection.id);
                                                        return (
                                                            <TableRow
                                                                hover
                                                                onClick={(event) => handleClick(event, collection.id)}
                                                                role="checkbox"
                                                                aria-checked={isItemSelected}
                                                                tabIndex={-1}
                                                                key={collection.id}
                                                                selected={isItemSelected}
                                                            >
                                                                <TableCell padding="checkbox">
                                                                    <Checkbox checked={isItemSelected} />
                                                                </TableCell>
                                                                <TableCell component="th" scope="row">
                                                                    {collection.short_name}
                                                                </TableCell>
                                                                <TableCell>{collection.provider_name}</TableCell>
                                                                <TableCell>{collection.egress_path}</TableCell>
                                                                <TableCell>{collection.active ? 'Yes' : 'No'}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} align="center">No collections found.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={collections.length}
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

            {/* Create Collection Dialog */}
            <Dialog open={openCreateDialog} onClose={handleCreateClose} fullWidth maxWidth="sm">
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="short_name"
                        label="Collection Short Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={createFormData.short_name}
                        onChange={handleInputChange}
                        required
                    />

                    {/* Provider Autocomplete */}
                    <Autocomplete
                        fullWidth
                        margin="normal"
                        options={providerOptions}
                        getOptionLabel={(option) => option.short_name}
                        value={providerOptions.find(option => option.id === createFormData.provider_id) || null}
                        onChange={handleProviderChange}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Provider"
                                name="provider_id"
                                margin="dense"
                                required
                            />
                        )}
                    />

                    {/* Egress Autocomplete */}
                    <Autocomplete
                        fullWidth
                        margin="normal"
                        options={egressOptions}
                        getOptionLabel={(option) => option.path}
                        value={egressOptions.find(option => option.id === createFormData.egress_id) || null}
                        onChange={handleEgressChange}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Egress"
                                name="egress_id"
                                margin="dense"
                                required
                            />
                        )}
                    />

                    <TextField
                        fullWidth
                        select
                        label="Active"
                        name="active"
                        value={createFormData.active.toString()}
                        onChange={handleInputChange}
                        margin="dense"
                    >
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Inactive</MenuItem>
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

            {/* Edit Collection Dialog */}
            <Dialog open={openEditDialog} onClose={handleEditClose} fullWidth maxWidth="sm">
                <DialogTitle>Edit Collection</DialogTitle>
                <DialogContent>
                    {editCollection && (
                        <>
                            <TextField
                                autoFocus
                                margin="dense"
                                name="short_name"
                                label="Collection Short Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={editCollection.short_name}
                                onChange={(e) => setEditCollection({ ...editCollection, short_name: e.target.value })}
                                required
                            />

                            {/* Provider Autocomplete */}
                            <Autocomplete
                                fullWidth
                                margin="normal"
                                options={providerOptions}
                                getOptionLabel={(option) => option.short_name}
                                value={providerOptions.find(option => option.id === editCollection.provider_id) || null}
                                onChange={(event, newValue) => {
                                    setEditCollection({ ...editCollection, provider_id: newValue ? newValue.id : null });
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Provider"
                                        name="provider_id"
                                        margin="dense"
                                        required
                                    />
                                )}
                            />

                            {/* Egress Autocomplete */}
                            <Autocomplete
                                fullWidth
                                margin="normal"
                                options={egressOptions}
                                getOptionLabel={(option) => option.path}
                                value={egressOptions.find(option => option.id === editCollection.egress_id) || null}
                                onChange={(event, newValue) => {
                                    setEditCollection({ ...editCollection, egress_id: newValue ? newValue.id : null });
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Egress Path"
                                        name="egress_id"
                                        margin="dense"
                                        required
                                    />
                                )}
                            />

                            <TextField
                                fullWidth
                                select
                                label="Active"
                                name="active"
                                value={editCollection.active.toString()}
                                onChange={(e) => setEditCollection({ ...editCollection, active: e.target.value === 'true' })}
                                margin="dense"
                            >
                                <MenuItem value="true">Active</MenuItem>
                                <MenuItem value="false">Inactive</MenuItem>
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
                    Are you sure you want to delete the selected collection(s)?
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

export default Collections;