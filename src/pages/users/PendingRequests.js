// src/pages/users/PendingRequests.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Card, CardContent,
    TableSortLabel, Autocomplete, CircularProgress
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuth from '../../hooks/useAuth';
import usePageTitle from "../../hooks/usePageTitle";

// API Imports
import { listUserApplications, updateUserApplication } from '../../api/userApplicationApi';
import { createCueuser } from '../../api/cueUser';
import roleApi from '../../api/roleApi';
import { fetchProviderById } from '../../api/providerApi';

function PendingRequests() {
    const [pendingApplications, setPendingApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acceptLoading, setAcceptLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [roles, setRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');
      const [openRejectDialog, setOpenRejectDialog] = useState(false);
    const { accessToken, logout } = useAuth();
    const { navigate } = useAuth();
    usePageTitle("Pending Requests");

    const formatDate = (dateString) => {
        if (!dateString) return '';
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
            return "Invalid Date";
        }
    };

     const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

const sortedApplications = React.useMemo(() => {
    if (!pendingApplications) return [];
    return [...pendingApplications].sort((a, b) => {
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
}, [pendingApplications, order, orderBy]);

  const visibleRows = React.useMemo(
        () => {
            const filteredApplications = sortedApplications.filter(application =>
                application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                application.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                application.username.toLowerCase().includes(searchTerm.toLowerCase())
                 || (application.providerName && application.providerName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            return filteredApplications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        },
        [sortedApplications, page, rowsPerPage, searchTerm]
    );


    const fetchPendingApplications = useCallback(async () => {
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
            const pending = applications.filter(app => app.status === 'pending');
            const pendingWithProviders = await Promise.all(pending.map(async (application) => {
                if (application.provider_id && application.provider_id.toLowerCase() !== 'none') {
                    try {
                        const provider = await fetchProviderById(application.provider_id, accessToken);
                        return { ...application, providerName: provider ? provider.short_name : '' };
                    } catch (providerError) {
                        console.error(`Error fetching provider for application ${application.id}:`, providerError);
                        return { ...application, providerName: '' };
                    }
                }else {
                    return { ...application, providerName: '' };
                }
            }));
            setPendingApplications(pendingWithProviders);
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken, logout, navigate]);

    const fetchRoles = useCallback(async () => {
        try {
            const fetchedRoles = await roleApi.listRoles(accessToken);
            setRoles(fetchedRoles);
        } catch (error) {
            toast.error(`Error fetching roles: ${error.message}`);
        }
    }, [accessToken]);


    useEffect(() => {
        fetchPendingApplications();
        fetchRoles();
    }, [fetchPendingApplications, fetchRoles]);

    const handleAccept = (application) => {
         const selectedRole = roles.find(role => role.id === application.role_id);
        setSelectedApplication({
            ...application,
            role: selectedRole || null,
        });
        setOpenEditDialog(true);
    };

    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setSelectedApplication(null);
    };
     const handleReject = (application) => {
        setSelectedApplication(application);
        setOpenRejectDialog(true);
    };
    const handleConfirmReject = async () => {
        try {
            await updateUserApplication(selectedApplication.id, { status: 'rejected' }, accessToken);
            setPendingApplications(pendingApplications.filter(app => app.id !== selectedApplication.id));
            toast.success("Application rejected successfully!");
        } catch (error) {
            toast.error(`Error rejecting application: ${error.message}`);
        } finally {
            setOpenRejectDialog(false);
            setSelectedApplication(null);

        }
    };

    const handleCloseRejectDialog = () => {
        setOpenRejectDialog(false);
        setSelectedApplication(null);
    };

    const handleSaveUser = async () => {
    setAcceptLoading(true);
    try {
        if (!selectedApplication.role) {
            toast.error("Please select a role.");
            return;
        }
        const userData = {
            name: selectedApplication.name,
            email: selectedApplication.email,
            username: selectedApplication.username,
            cueusername: selectedApplication.username,
            justification: selectedApplication.justification,
            ngroup_id: selectedApplication.ngroup_id,
            account_type: selectedApplication.account_type,
            provider_id: selectedApplication.provider_id,
            edpub_id: selectedApplication.edpub_id,
            role_id: selectedApplication.role.id,
        };

        const newUser = await createCueuser(userData, accessToken);
        toast.success(`User ${newUser.cueusername} created successfully!`);

        await updateUserApplication(selectedApplication.id, { status: 'approved' }, accessToken);

        setPendingApplications(pendingApplications.filter(app => app.id !== selectedApplication.id));
        setOpenEditDialog(false);


    } catch (error) {
        toast.error(`Error creating user: ${error.message}`);
    } finally {
        setAcceptLoading(false);
    }
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
        // When the "select all" checkbox is checked, select *all* applications,
        // not just the ones on the current page.
        const newSelecteds = pendingApplications.map((n) => n.id);
        setSelectedApplication(newSelecteds); // Use array
        return;
    }
    setSelectedApplication([]); // Clear selection
};


 const handleClick = (event, id) => {
        //If an application is already selected deselect and if its a new selection,
        // select the clicked application
        if(selectedApplication && selectedApplication.id === id){
            setSelectedApplication(null)
        }else{
            setSelectedApplication(pendingApplications.find(app => app.id === id));
        }

    };
    return (
        <Box sx={{ p: 3 }}>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Pending User Applications</Typography>
                         <Box>
                          <TextField
                                label="Search Applications"
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ mb: 2 , mr: 2}}
                            />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                if (selectedApplication) {
                                    handleAccept(selectedApplication);
                                }
                            }}
                            disabled={!selectedApplication || acceptLoading}
                            sx={{ mr: 1 }}
                        >
                            {acceptLoading ? <CircularProgress size={24} color="inherit" /> : 'Accept'}
                        </Button>
                        <Button variant="contained" color="error"  onClick={() => {
                                if (selectedApplication) {
                                     handleReject(selectedApplication);
                                }
                            }} disabled={!selectedApplication}>
                            Reject
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
                            <Table aria-label="pending applications table" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black ", padding: '0px 16px' }}>
                                        <Checkbox
                                            sx={{
                                                '& .MuiSvgIcon-root': { fontSize: 20 },
                                                padding: '9px'
                                            }}
                                            indeterminate={selectedApplication !== null && selectedApplication.length > 0 && selectedApplication.length < pendingApplications.length}
                                            checked={pendingApplications.length > 0 && selectedApplication?.length === pendingApplications.length}
                                            onChange={handleSelectAllClick}
                                        />
                                    </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                            <TableSortLabel
                                                active={orderBy === 'name'}
                                                direction={orderBy === 'name' ? order : 'asc'}
                                                onClick={() => handleRequestSort('name')}
                                            >Name
                                            </TableSortLabel>
                                            </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                            <TableSortLabel
                                            active={orderBy === 'email'}
                                            direction={orderBy === 'email' ? order : 'asc'}
                                            onClick={() => handleRequestSort('email')}>
                                            Email
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                            <TableSortLabel
                                            active={orderBy === 'username'}
                                            direction={orderBy === 'username' ? order : 'asc'}
                                            onClick={() => handleRequestSort('username')}>
                                            Username
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                            <TableSortLabel
                                            active={orderBy === 'applied'}
                                            direction={orderBy === 'applied' ? order : 'asc'}
                                            onClick={() => handleRequestSort('applied')}>
                                            Applied
                                            </TableSortLabel>
                                            </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                            <TableSortLabel
                                                active={orderBy === 'account_type'}
                                                direction={orderBy === 'account_type' ? order : 'asc'}
                                                onClick={() => handleRequestSort('account_type')}>
                                            Account Type
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                        <TableSortLabel
                                                active={orderBy === 'providerName'}
                                                direction={orderBy === 'providerName' ? order : 'asc'}
                                                onClick={() => handleRequestSort('providerName')}>
                                            Provider
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>
                                        <TableSortLabel
                                                active={orderBy === 'edpub_id'}
                                                direction={orderBy === 'edpub_id' ? order : 'asc'}
                                                onClick={() => handleRequestSort('edpub_id')}>
                                            EDPub ID
                                             </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Justification</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                {visibleRows.length > 0 ? (
                                     visibleRows.map((application) => {
                                        const isItemSelected = selectedApplication?.id === application.id;
                                        return (
                                          <TableRow
                                            key={application.id}
                                            hover
                                            onClick={() =>
                                              setSelectedApplication(
                                                isItemSelected ? null : application
                                              )
                                            }
                                            selected={isItemSelected}
                                          >
                                            <TableCell sx={{ padding: '0px 16px' }}>
                                              <Checkbox
                                                sx={{
                                                  '& .MuiSvgIcon-root': {
                                                    fontSize: 20,
                                                  },
                                                  padding: '9px',
                                                }}
                                                checked={isItemSelected}
                                              />
                                            </TableCell>
                                            <TableCell>{application.name}</TableCell>
                                            <TableCell>{application.email}</TableCell>
                                            <TableCell>{application.username}</TableCell>
                                            <TableCell>
                                              {formatDate(application.applied)}
                                            </TableCell>
                                            <TableCell>
                                              {application.account_type}
                                            </TableCell>
                                            <TableCell>
                                              {application.providerName || ''}
                                            </TableCell>
                                            <TableCell>
                                              {application.edpub_id || ''}
                                            </TableCell>
                                            <TableCell>
                                              {application.justification}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })
                                    ) : (
                                        <TableRow>
                                          <TableCell colSpan={9} align="center">
                                                No pending applications found.
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
                                    count={pendingApplications.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                </CardContent>
            </Card>

            {/* Edit Dialog (for accepting) */}
            <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
                <DialogTitle>Accept User Application</DialogTitle>
                <DialogContent>
                    {selectedApplication && (
                        <>
                            <TextField label="Name" value={selectedApplication.name} fullWidth margin="dense" disabled />
                            <TextField label="Email" value={selectedApplication.email} fullWidth margin="dense" disabled />
                            <TextField label="Username" value={selectedApplication.username} fullWidth margin="dense" disabled
                            />
                            <TextField label="Justification" value={selectedApplication.justification} fullWidth margin="dense" disabled />
                            <TextField label="Account Type" value={selectedApplication.account_type} fullWidth margin="dense" disabled />
                            {/* Display providerName instead of provider_id */}
                            <TextField label="Provider" value={selectedApplication.providerName || ''} fullWidth margin="dense" disabled />
                            <TextField label="EDPub ID" value={selectedApplication.edpub_id || ''} fullWidth margin="dense" disabled />

                            <Autocomplete
                                options={roles}
                                getOptionLabel={(option) => option.long_name}
                                value={selectedApplication.role}
                                onChange={(event, newValue) => {
                                    setSelectedApplication({ ...selectedApplication, role: newValue });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Role"
                                        margin="dense"
                                        name="role"
                                        fullWidth
                                    />
                                )}
                            />

                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>Cancel</Button>
                    <Button onClick={handleSaveUser} variant="contained" disabled={acceptLoading}>
                        {acceptLoading ? <CircularProgress size={24} color="inherit" /> : "Accept"}
                    </Button>
                </DialogActions>
            </Dialog>
              {/* Reject Confirmation Dialog */}
            <Dialog open={openRejectDialog} onClose={handleCloseRejectDialog}>
                <DialogTitle>Confirm Reject</DialogTitle>
                <DialogContent>
                    Are you sure you want to reject this application?
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRejectDialog}>Cancel</Button>
                    <Button onClick={handleConfirmReject} color="error">
                        Reject
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default PendingRequests;