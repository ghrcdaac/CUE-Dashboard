import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from 'react-router-dom';
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import TablePagination from "@mui/material/TablePagination";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { TableSortLabel, TextareaAutosize } from '@mui/material'; // Import TextareaAutosize
import * as egressApi from "../api/egressAPI";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useAuth from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import EvStationIcon from '@mui/icons-material/EvStation';
import DnsIcon from '@mui/icons-material/Dns';
import usePageTitle from "../hooks/usePageTitle";

export default function DAAC() {

    const [egresses, setEgresses] = useState([]);
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [newEgress, setNewEgress] = useState({
        type: "",
        path: "",
        config: "", // Store as string initially
        ngroup_id: "",
    });
    const [editEgress, setEditEgress] = useState(null);
    const [editConfigString, setEditConfigString] = useState(""); // Separate state for edit config
    const { accessToken, logout } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');


    // --- Data Fetching ---
    const fetchEgressData = useCallback(async () => {
        setLoading(true);
        try {
            const ngroupId = localStorage.getItem('CUE_ngroup_id');
            if (!ngroupId) {
                setError("Ngroup ID not found. Please log in again.");
                toast.error("Ngroup ID not found. Please log in again.");
                logout();
                return;
            }
            const data = await egressApi.listEgresses(ngroupId, accessToken);
            setEgresses(data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error.message);
            toast.error(`Error fetching data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [accessToken, logout]);

    useEffect(() => {
        fetchEgressData();
    }, [fetchEgressData]);


    // --- Event Handlers ---
    const handleSelectAllClick = (event) => {
        setSelected(event.target.checked ? egresses.map((n) => n.id) : []);
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

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleAddClick = () => {
        const ngroupId = localStorage.getItem('CUE_ngroup_id');
        setNewEgress({ type: "", path: "", config: "", ngroup_id: ngroupId }); // config is string
        setOpenAddDialog(true);
    };

    const handleEditClick = () => {
        if (selected.length !== 1) {
            toast.error("Please select exactly one egress to edit.");
            return;
        }
        const egressToEdit = egresses.find(e => e.id === selected[0]);
        setEditEgress(egressToEdit);
        setEditConfigString(JSON.stringify(egressToEdit.config, null, 2)); // Initialize editConfigString
        setOpenEditDialog(true);
    };

    const handleCloseEditDialog = () => {
      setOpenEditDialog(false);
      setEditEgress(null);
      setEditConfigString(""); // Clear the config string
    };

    const handleDeleteClick = () => {
        if (selected.length === 0) {
            toast.error("Please select at least one egress to delete.");
            return;
        }
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
         const ngroupId = localStorage.getItem('CUE_ngroup_id');
        try {
            await Promise.all(selected.map(egressId => egressApi.deleteEgress(egressId, accessToken, ngroupId)));
            setEgresses(prevEgresses => prevEgresses.filter(egress => !selected.includes(egress.id)));
            setSelected([]);
            toast.success("Egress(es) deleted successfully!");
        } catch (error) {
            toast.error(`Error deleting egress(es): ${error.message}`);
        } finally {
            setOpenDeleteDialog(false);
        }
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const handleCloseAddDialog = () => {
        setOpenAddDialog(false);
    };


    const handleInputChange = (e, formType) => {
        const { name, value } = e.target;
        if (formType === "add") {
            setNewEgress({ ...newEgress, [name]: value });
        } else if (formType === "edit" && editEgress) {
            setEditEgress({ ...editEgress, [name]: value });
        }
    };

    // No more handleConfigChange, directly set the config string.
    const handleAddEgress = async () => {
       try {
            if (!newEgress.ngroup_id) {
                toast.error("Ngroup ID is missing. Please ensure you are logged in.");
                return;
            }
            // Parse config string to JSON *before* sending to API
            let parsedConfig;
            try {
              parsedConfig = JSON.parse(newEgress.config);
            } catch (parseError) {
              toast.error(`Invalid JSON in config: ${parseError.message}`);
              return; // Stop if JSON is invalid
            }

            const egressToCreate = { ...newEgress, config: parsedConfig }; // Use parsed JSON

            const createdEgress = await egressApi.createEgress(egressToCreate, accessToken);
            setEgresses([...egresses, createdEgress]);
            setOpenAddDialog(false);
            toast.success("Egress added successfully!");

        } catch (error) {
            console.error("Error adding egress:", error);
            toast.error(`Error adding egress: ${error.message}`);
        }
    };

    const handleUpdateEgress = async () => {
      if (!editEgress) return;

      try {
          // Parse config string to JSON before sending to API
          let parsedConfig;
          try{
            parsedConfig = JSON.parse(editConfigString);
          } catch (parseError) {
              toast.error(`Invalid JSON in config: ${parseError.message}`);
              return; // Stop if JSON is invalid
          }

          const updatedEgressData = { ...editEgress, config: parsedConfig }; // Use parsed config

          const updatedEgress = await egressApi.updateEgress(editEgress.id, updatedEgressData, accessToken);
          setEgresses(egresses.map(egress => egress.id === editEgress.id ? updatedEgress : egress));
          setOpenEditDialog(false);
          toast.success("Egress updated successfully!");

      } catch (error) {
          console.error("Error updating egress:", error);
          toast.error(`Error updating egress: ${error.message}`);
      }
    };


    const isSelected = (id) => selected.indexOf(id) !== -1;

    // Sorting
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('type');

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedEgresses = React.useMemo(() => {
        if (!egresses) return [];

        return [...egresses].sort((a, b) => {
          const isAsc = order === 'asc';
          if (orderBy === 'type') {
            return isAsc ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
          } else if (orderBy === 'path') {
            return isAsc ? a.path.localeCompare(b.path) : b.path.localeCompare(a.path);
          }
          return 0;
        });
    }, [egresses, order, orderBy]);

    const visibleRows = React.useMemo(() => {
        return sortedEgresses
          .filter((egress) =>
            egress.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            egress.path.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      }, [sortedEgresses, searchTerm, page, rowsPerPage]);


    // ---------- SideNav Logic ----------
    const location = useLocation();

    const daacMenuItems = [
        { text: 'Egress', path: '/daac', icon: <EvStationIcon /> },
        { text: 'Providers', path: '/daac/providers', icon: <DnsIcon /> },
    ];

    const { setMenuItems } = useOutletContext();

    useEffect(() => {
        setMenuItems(daacMenuItems);
        // Optional: clear the menu when the page is left
        return () => setMenuItems([]);
    }, [setMenuItems]);

    usePageTitle(
        location.pathname === '/daac' || location.pathname === '/daac/'
            ? "DAAC"
            : undefined
    );
    // ---------- End SideNav Logic ----------

    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
            <Box
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    overflow: "hidden",
                }}
            >
                {loading && <Typography>Loading DAAC egress data...</Typography>}
                {error && <Typography color="error">Error: {error}</Typography>}

                < Grid container spacing={2} direction="column">
                    < Grid xs={12}>
                        <Card>
                            <CardContent sx={{ pb: 0 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 2,
                                    }}
                                >
                                    <Typography variant="h5">Egress</Typography>
                                    <Box>
                                        <TextField
                                          label="Search Egresses"
                                          variant="outlined"
                                          size="small"
                                          value={searchTerm}
                                          onChange={(e) => setSearchTerm(e.target.value)}
                                          sx={{ mb: 2, mr: 2 }}
                                        />
                                        <Button
                                            variant="contained"
                                            style={{ backgroundColor: 'green', color: 'white' }}
                                            onClick={handleAddClick}
                                            startIcon={<AddIcon />}
                                        >
                                            Add
                                        </Button>
                                        <Button
                                           variant="contained"
                                           sx={{
                                               backgroundColor: selected.length !== 1 ? 'grey.400' : '#1565C0',
                                               color: selected.length !== 1 ? 'grey.600' : 'white',
                                               marginLeft: '10px',
                                               '&:hover': {
                                                   backgroundColor: selected.length !== 1 ? 'grey.400' : 'primary.dark',
                                               },
                                               '&.Mui-disabled': {
                                                   color: 'grey.600',
                                               }
                                           }}
                                           onClick={handleEditClick}
                                           disabled={selected.length !== 1}
                                           startIcon={<EditIcon />}
                                       >
                                           Edit
                                       </Button>

                                        <Button
                                           variant="contained"
                                           sx={{
                                               backgroundColor: selected.length === 0 ? 'grey.400' : 'error.main',
                                               color: selected.length === 0 ? 'grey.600' : 'white',
                                               marginLeft: '10px',
                                               '&:hover': {
                                                   backgroundColor: selected.length === 0 ? 'grey.400' : 'error.dark',
                                               },
                                               '&.Mui-disabled': {
                                                   color: 'grey.600',
                                               }
                                           }}
                                           onClick={handleDeleteClick}
                                           disabled={selected.length === 0}
                                           startIcon={<DeleteIcon />}
                                       >
                                           Delete
                                       </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                            <CardContent sx={{ overflow: "auto" }}>
                                <TableContainer component={Paper}>
                                    <Table stickyHeader aria-label="Egress Table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ bgcolor: " #E5E8EB", color: "black " }} padding="checkbox">
                                                    <Checkbox
                                                        indeterminate={
                                                            selected.length > 0 &&
                                                            selected.length < egresses.length
                                                        }
                                                        checked={
                                                            egresses.length > 0 &&
                                                            selected.length === egresses.length
                                                        }
                                                        onChange={handleSelectAllClick}
                                                        inputProps={{ "aria-label": "select all egresses" }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: " #E5E8EB", color: "black" }}>
                                                <TableSortLabel
                                                active={orderBy === 'type'}
                                                direction={orderBy === 'type' ? order : 'asc'}
                                                onClick={() => handleRequestSort('type')}
                                              >
                                                    Type
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: " #E5E8EB", color: "black" }}>
                                                <TableSortLabel
                                                    active={orderBy === 'path'}
                                                    direction={orderBy === 'path' ? order : 'asc'}
                                                    onClick={() => handleRequestSort('path')}
                                                  >
                                                  Path
                                                  </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: " #E5E8EB", color: "black" }}>Config</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {visibleRows.map((row) => {
                                                const isItemSelected = isSelected(row.id);
                                                return (
                                                    <TableRow
                                                        hover
                                                        onClick={(event) => handleClick(event, row.id)}
                                                        role="checkbox"
                                                        aria-checked={isItemSelected}
                                                        tabIndex={-1}
                                                        key={row.id}
                                                        selected={isItemSelected}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox checked={isItemSelected} />
                                                        </TableCell>
                                                        <TableCell>{row.type}</TableCell>
                                                        <TableCell>{row.path}</TableCell>
                                                        <TableCell>
                                                            {row.config && typeof row.config === 'object' ? (
                                                                Object.entries(row.config).map(([key, value]) => (
                                                                  <Typography key={key}>
                                                                    <strong>{key}:</strong>{' '}
                                                                    {key === 'secret_access_key' ? '********' : value}
                                                                  </Typography>
                                                                ))
                                                              ) : (
                                                                <Typography>Invalid Config</Typography>
                                                              )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50]}
                                    component="div"
                                    count={egresses.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </CardContent>
                        </Card>
                    </ Grid>
                </ Grid>

                {/* Add Egress Dialog */}
                <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
                    <DialogTitle>Add Egress</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            name="type"
                            label="Type"
                            type="text"
                            fullWidth
                            value={newEgress.type}
                            onChange={(e) => handleInputChange(e, "add")}
                        />
                        <TextField
                            margin="dense"
                            name="path"
                            label="Path"
                            type="text"
                            fullWidth
                            value={newEgress.path}
                            onChange={(e) => handleInputChange(e, "add")}
                        />
                        <TextField
                            margin="dense"
                            name="config"
                            label="Config (JSON format)"
                            type="text"
                            fullWidth
                            multiline  // Use multiline for textarea-like behavior
                            rows={4}    // Set a fixed number of rows
                            value={newEgress.config}
                            onChange={(e) => handleInputChange(e, "add")} // Use handleInputChange
                        />
                        {/* No ngroup_id field in Add Dialog */}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAddDialog}>Cancel</Button>
                        <Button onClick={handleAddEgress}>Add</Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Egress Dialog */}
                <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
                    <DialogTitle>Edit Egress</DialogTitle>
                    <DialogContent>
                        {editEgress && (
                            <>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    name="type"
                                    label="Type"
                                    type="text"
                                    fullWidth
                                    value={editEgress.type}
                                    onChange={(e) => handleInputChange(e, "edit")}
                                />
                                <TextField
                                    margin="dense"
                                    name="path"
                                    label="Path"
                                    type="text"
                                    fullWidth
                                    value={editEgress.path}
                                    onChange={(e) => handleInputChange(e, "edit")}
                                />
                                <TextField
                                    margin="dense"
                                    name="config"
                                    label="Config (JSON format)"
                                    type="text"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={editConfigString} // Use the dedicated state variable
                                    onChange={(e) => setEditConfigString(e.target.value)} // Update editConfigString directly
                                />
                                {/* No ngroup_id field in Edit Dialog */}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEditDialog}>Cancel</Button>
                        <Button onClick={handleUpdateEgress}>Save</Button>
                    </DialogActions>
                </Dialog>


                {/* Delete Confirmation Dialog */}
                <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        Are you sure you want to delete the selected egress(es)?
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                        <Button onClick={handleConfirmDelete} variant="contained" color="error">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
                <ToastContainer position="top-center" />
            </Box>
        </Box>
    );
}