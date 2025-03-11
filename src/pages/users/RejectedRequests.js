// src/pages/users/RejectedRequests.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, CircularProgress
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import DeleteIcon from '@mui/icons-material/Delete';

// API Imports
import { listUserApplications, deleteUserApplication } from '../../api/userApplicationApi';
import { fetchProviderById } from '../../api/providerApi';

function RejectedRequests() {
    const [rejectedApplications, setRejectedApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false); // Loading for delete
    const [error, setError] = useState(null);
    const [selectedApplications, setSelectedApplications] = useState([]); // Use array for multiple selections
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');
    const { accessToken, logout } = useAuth();
    const { navigate } = useAuth();
    // usePageTitle("Rejected Requests");

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat().format(date);
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid Date";
        }
    };
        const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

const sortedApplications = React.useMemo(() => {
    if (!rejectedApplications) return [];
    return [...rejectedApplications].sort((a, b) => {
        const isAsc = order === 'asc';
        if (orderBy === 'name') {
            return isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else if (orderBy === 'email') {
            return isAsc ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
        } else if (orderBy === 'username') {
            return isAsc ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username);
        } else if (orderBy === 'applied') {
            const dateA = new Date(a.applied);
            const dateB = new Date(b.applied);
            return isAsc ? dateA - dateB : dateB - dateA;
        } else if (orderBy === 'account_type') {
            return isAsc ? a.account_type.localeCompare(b.account_type) : b.account_type.localeCompare(a.account_type);
        }else if(orderBy === 'edpub_id'){
             const edpubA = a.edpub_id || '';
             const edpubB = b.edpub_id || '';
              return isAsc ? edpubA.localeCompare(edpubB) : edpubB.localeCompare(edpubA)
        }
         else if(orderBy === 'providerName'){
             const providerA = a.providerName || '';
             const providerB = b.providerName || '';
              return isAsc ? providerA.localeCompare(providerB) : providerB.localeCompare(providerA)
        }
        return 0;
    });
}, [rejectedApplications, order, orderBy]);

  const visibleRows = React.useMemo(
        () => {
            const filteredApplications = sortedApplications.filter(application =>
                application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                application.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                application.username.toLowerCase().includes(searchTerm.toLowerCase())
                 || (application.providerName && application.providerName.toLowerCase().includes(searchTerm.toLowerCase())) //search provider name
            );
            return filteredApplications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        },
        [sortedApplications, page, rowsPerPage, searchTerm]
    );



    const fetchRejectedApplications = useCallback(async () => {
        setLoading(true);
        try {
            const ngroupId = localStorage.getItem('CUE_ngroup_id');
            if (!ngroupId) {
                setError("Ngroup ID not found. Please log in again.");
                toast.error("Ngroup ID not found. Please log in again.");
                 logout(navigate);
                return;
            }
            const applications = await listUserApplications(ngroupId);
            const rejected = applications.filter(app => app.status === 'rejected');

            const rejectedWithProviders = await Promise.all(rejected.map(async (application) => {
                if (application.provider_id && application.provider_id.toLowerCase() !== 'none') {
                    try {
                        const provider = await fetchProviderById(application.provider_id, accessToken);
                        return { ...application, providerName: provider ? provider.short_name : '' };
                    } catch (providerError) {
                        console.error(`Error fetching provider for application ${application.id}:`, providerError);
                        return { ...application, providerName: '' };
                    }
                } else {
                    return { ...application, providerName: '' };
                }
            }));

            setRejectedApplications(rejectedWithProviders);
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken, logout, navigate]);


    useEffect(() => {
        fetchRejectedApplications();
    }, [fetchRejectedApplications]);

    const handleDeleteClick = () => {
        if (selectedApplications.length === 0) {
            toast.error("Please select at least one application to delete.");
            return;
        }
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        setDeleteLoading(true); // Set delete loading
        try {
          const ngroupId = localStorage.getItem('CUE_ngroup_id');
            await Promise.all(selectedApplications.map(applicationId => deleteUserApplication(applicationId, ngroupId)));
            //  Remove deleted from the state
            setRejectedApplications(rejectedApplications.filter(app => !selectedApplications.includes(app.id)));
            setSelectedApplications([]); // Clear selection
            toast.success("Applications deleted successfully!");
        } catch (error) {
            toast.error(`Error deleting applications: ${error.message}`);
        } finally {
            setOpenDeleteDialog(false);
            setDeleteLoading(false); // Reset delete loading
        }
    };


    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
     const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = visibleRows.map((n) => n.id);
            setSelectedApplications(newSelecteds);
            return;
        }
        setSelectedApplications([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selectedApplications.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedApplications, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedApplications.slice(1));
        } else if (selectedIndex === selectedApplications.length - 1) {
            newSelected = newSelected.concat(selectedApplications.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedApplications.slice(0, selectedIndex),
                selectedApplications.slice(selectedIndex + 1),
            );
        }

        setSelectedApplications(newSelected);
    };

     const isSelected = (id) => selectedApplications.indexOf(id) !== -1;


    return (
        <Box sx={{ p: 3 }}>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Rejected User Applications</Typography>
                         <Box>
                        <TextField
                                label="Search Applications"
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ mb: 2 , mr:2}}
                            />
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteClick}
                            disabled={selectedApplications.length === 0 || deleteLoading}
                            startIcon={<DeleteIcon />}
                        >
                            {deleteLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
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
                        <TableContainer component={Paper}  sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                            <Table aria-label="rejected applications table" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                         <TableCell sx={{ bgcolor: "#E5E8EB", color: "black ", padding: '0px 16px' }}> {/* Reduced padding */}
                                            <Checkbox
                                                sx={{
                                                    '& .MuiSvgIcon-root': { fontSize: 20 }, // Optional: Adjust icon size
                                                    padding: '9px'
                                                }}
                                                disabled={rejectedApplications.length === 0}
                                                checked={rowsPerPage > 0
                                                    ? selectedApplications.length === visibleRows.length
                                                    : false}
                                                onChange={handleSelectAllClick}

                                            />
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                        <TableSortLabel
                                                active={orderBy === 'name'}
                                                direction={orderBy === 'name' ? order : 'asc'}
                                                onClick={() => handleRequestSort('name')}
                                            >
                                            Name</TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                        <TableSortLabel
                                            active={orderBy === 'email'}
                                            direction={orderBy === 'email' ? order : 'asc'}
                                            onClick={() => handleRequestSort('email')}>
                                            Email</TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                        <TableSortLabel
                                                active={orderBy === 'username'}
                                                direction={orderBy === 'username' ? order : 'asc'}
                                                onClick={() => handleRequestSort('username')}>
                                                Username</TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                            <TableSortLabel
                                                active={orderBy === 'applied'}
                                                direction={orderBy === 'applied' ? order : 'asc'}
                                                onClick={() => handleRequestSort('applied')}>
                                            Applied</TableSortLabel>
                                             </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                            <TableSortLabel
                                                active={orderBy === 'account_type'}
                                                direction={orderBy === 'account_type' ? order : 'asc'}
                                                onClick={() => handleRequestSort('account_type')}>
                                            Account Type</TableSortLabel>
                                             </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                        <TableSortLabel
                                            active={orderBy === 'providerName'}
                                            direction={orderBy === 'providerName' ? order : 'asc'}
                                            onClick={() => handleRequestSort('providerName')}>
                                            Provider</TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                        <TableSortLabel
                                         active={orderBy === 'edpub_id'}
                                         direction={orderBy === 'edpub_id' ? order : 'asc'}
                                         onClick={() => handleRequestSort('edpub_id')}>
                                            EDPub ID</TableSortLabel>
                                             </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Justification</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {visibleRows.length > 0 ? (
                                        visibleRows.map((application) => {
                                         const isItemSelected = isSelected(application.id);
                                         return (
                                            <TableRow key={application.id} hover
                                             onClick={(event) => handleClick(event, application.id)}
                                            role="checkbox"
                                            aria-checked={isItemSelected}
                                            tabIndex={-1}
                                            selected={isItemSelected}>
                                                <TableCell  sx={{padding: '0px 16px'}}> {/* Reduced padding */}
                                                    <Checkbox
                                                        sx={{
                                                            '& .MuiSvgIcon-root': { fontSize: 20 }, // Optional: Adjust icon size
                                                             padding: '9px'
                                                        }}
                                                        checked={isItemSelected}
                                                    />
                                                </TableCell>
                                                <TableCell>{application.name}</TableCell>
                                                <TableCell>{application.email}</TableCell>
                                                <TableCell>{application.username}</TableCell>
                                                <TableCell>{formatDate(application.applied)}</TableCell>
                                                <TableCell>{application.account_type}</TableCell>
                                                <TableCell>{application.providerName}</TableCell>
                                                <TableCell>{application.edpub_id}</TableCell>
                                                <TableCell>{application.justification}</TableCell>
                                            </TableRow>
                                        );
                                         })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                No rejected applications found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={rejectedApplications.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete the selected application(s)?
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" disabled={deleteLoading}>
                        {deleteLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default RejectedRequests;