import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
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
import Autocomplete from "@mui/material/Autocomplete";
import {
    fetchEgresses,
    createEgress,
    updateEgress,
    deleteEgress,
} from "../api/egress";
import { fetchNgroups } from "../api/ngroup";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DAAC({ setSelectedMenu }) {
  const [rows, setRows] = useState([]);
  const [ngroups, setNgroups] = useState({});
  const [ngroupOptions, setNgroupOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [newEgress, setNewEgress] = useState({
      type: "",
      path: "",
      config: {},
      ngroup_id: "",
  });
  const [editEgress, setEditEgress] = useState({
      type: "",
      path: "",
      config: {},
      ngroup_id: "",
  });

  useEffect(() => {
      setSelectedMenu("DAAC");
      fetchData();
      fetchNgroupOptions();
  }, [setSelectedMenu]);

  const fetchData = async () => {
      setLoading(true);
      try {
          const data = await fetchEgresses();
          console.log("Data fetched from API:", data);
          setRows(data);
      } catch (error) {
          console.error("Error fetching data:", error);
          setError(error.message);
      } finally {
          setLoading(false);
      }
  };

  const fetchNgroupOptions = async () => {
      try {
          const groups = await fetchNgroups();
          setNgroupOptions(groups);
      } catch (error) {
          console.error("Error fetching ngroup options:", error);
      }
  };

  const fetchNgroupData = async () => {
      try {
          const groups = await fetchNgroups();
          const ngroupMap = {};
          groups.forEach(group => {
              ngroupMap[group.id] = group.short_name;
          });
          setNgroups(ngroupMap);
      } catch (error) {
          console.error("Error fetching ngroup data:", error);
      }
  };

  useEffect(() => {
      console.log("Rows state updated:", rows);
  }, [rows]);

  useEffect(() => {
      fetchNgroupData();
  }, [rows]);

  const handleAddClick = () => {
      setNewEgress({ type: "", path: "", config: {}, ngroup_id: "" }); // Reset form
      setOpenAddDialog(true);
  };

  const handleEditClick = () => {
      if (selected.length === 1) {
          const selectedEgress = rows.find((row) => row.id === selected[0]);
          setEditEgress({
              ...selectedEgress,
              ngroup_id: ngroups[selectedEgress.ngroup_id] || ""
          });
          setSelectedRow(selectedEgress);
          setOpenEditDialog(true);
      } else {
          toast.error("Please select exactly one row to edit.");
      }
  };

  const handleDeleteClick = () => {
      if (selected.length === 0) {
          toast.error("Please select at least one row to delete.");
          return;
      }

      setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
      try {
          await Promise.all(selected.map(egressId => deleteEgress(egressId)));
          setRows(rows.filter((row) => !selected.includes(row.id)));
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

  const handleAddEgress = async () => {
      try {
          // Find the ngroup object that matches the entered short_name
          const selectedNgroup = ngroupOptions.find(
              (ngroup) => ngroup.short_name === newEgress.ngroup_id
          );

          if (!selectedNgroup) {
              toast.error("Invalid ngroup selected.");
              return;
          }

          // Add the new egress with the ngroup_id
          const createdEgress = await createEgress({
              ...newEgress,
              ngroup_id: selectedNgroup.id, // Use the ID of the selected ngroup
          });

          console.log("Egress created:", createdEgress);
          setRows([...rows, createdEgress]);
          setOpenAddDialog(false);
          toast.success("Egress added successfully!");
      } catch (error) {
          console.error("Error adding egress:", error);
          toast.error(`Error adding egress: ${error.message}`);
      }
  };

  const handleUpdateEgress = async () => {
      try {
          const selectedNgroup = ngroupOptions.find(
              (ngroup) => ngroup.short_name === editEgress.ngroup_id
          );

          if (!selectedNgroup) {
              toast.error("Invalid ngroup selected.");
              return;
          }
          const updatedEgress = await updateEgress(selectedRow.id, {
              ...editEgress,
              ngroup_id: selectedNgroup.id
          });

          console.log("Egress updated:", updatedEgress);
          // Update the rows state with the updated egress
          setRows(rows.map((row) => (row.id === selectedRow.id ? updatedEgress : row)));
          setOpenEditDialog(false);
          toast.success("Egress updated successfully!");
      } catch (error) {
          console.error("Error updating egress:", error);
          toast.error(`Error updating egress: ${error.message}`);
      }
  };

  const handleCloseAddDialog = () => {
      setOpenAddDialog(false);
  };

  const handleCloseEditDialog = () => {
      setOpenEditDialog(false);
  };

  const handleInputChange = (e, formType) => {
      const { name, value } = e.target;
      if (formType === "add") {
          setNewEgress({ ...newEgress, [name]: value });
      } else if (formType === "edit") {
          setEditEgress({ ...editEgress, [name]: value });
      }
  };

  const handleConfigChange = (e, formType) => {
      const { name, value } = e.target;
      if (formType === "add") {
          setNewEgress({
              ...newEgress,
              config: { ...newEgress.config, [name]: value },
          });
      } else if (formType === "edit") {
          setEditEgress({
              ...editEgress,
              config: { ...editEgress.config, [name]: value },
          });
      }
  };

  const handleNgroupAutocompleteChange = (event, value, formType) => {
      if (formType === "add") {
          setNewEgress({ ...newEgress, ngroup_id: value });
      } else if (formType === "edit") {
          setEditEgress({ ...editEgress, ngroup_id: value });
      }
  };

  const handleSelectAllClick = (event) => {
      if (event.target.checked) {
          const newSelecteds = rows.map((n) => n.id);
          setSelected(newSelecteds);
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

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const visibleRows = React.useMemo(
      () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
      [rows, page, rowsPerPage]
  );

    return (
    <Box
        sx={{
            flexGrow: 1,
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflow: "hidden",
        }}
    >
        {error && <Typography color="error">Error: {error}</Typography>}
        {loading && <Typography>Loading...</Typography>}

        <Grid2 container spacing={2} direction="column">
            <Grid2 xs={12}>
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
                                <Button
                                    variant="contained"
                                    style={{ backgroundColor: '#008000  ', color: 'white' }}
                                    onClick={handleAddClick}
                                    startIcon={<AddIcon />}
                                >
                                    Add
                                </Button>
                                <Button
                                    variant="contained"
                                    style={{ backgroundColor: '#1565C0  ', color: 'white', marginLeft: '10px' }}
                                    onClick={handleEditClick}
                                    disabled={selected.length !== 1}
                                    startIcon={<EditIcon />}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="contained"
                                    style={{ backgroundColor: '#B71C1C  ', color: 'white', marginLeft: '10px' }}
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
                                                    selected.length < rows.length
                                                }
                                                checked={
                                                    rows.length > 0 &&
                                                    selected.length === rows.length
                                                }
                                                onChange={handleSelectAllClick}
                                                inputProps={{ "aria-label": "select all egresses" }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: " #E5E8EB", color: "black " }}>Type</TableCell>
                                        <TableCell sx={{ bgcolor: " #E5E8EB", color: "black" }}>Path</TableCell>
                                        <TableCell sx={{ bgcolor: " #E5E8EB", color: "black" }}>Config</TableCell>
                                        <TableCell sx={{ bgcolor: " #E5E8EB", color: "black" }}>Group</TableCell>
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
                                                    {row.config &&
                                                        typeof row.config === "object" &&
                                                        Object.entries(row.config).map(
                                                            ([key, value]) => (
                                                                <Typography key={key}>
                                                                    <strong>{key}:</strong> {value}
                                                                </Typography>
                                                            )
                                                        )}
                                                </TableCell>
                                                <TableCell>
                                                    {ngroups[row.ngroup_id] || "Loading..."}
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
                            count={rows.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </CardContent>
                </Card>
            </Grid2>
        </Grid2>
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
                    name="region"
                    label="Config - Region"
                    type="text"
                    fullWidth
                    value={newEgress.config.region || ""}
                    onChange={(e) => handleConfigChange(e, "add")}
                />
                <TextField
                    margin="dense"
                    name="access_key_id"
                    label="Config - Access Key ID"
                    type="text"
                    fullWidth
                    value={newEgress.config.access_key_id || ""}
                    onChange={(e) => handleConfigChange(e, "add")}
                />
                <TextField
                    margin="dense"
                    name="secret_access_key"
                    label="Config - Secret Access Key"
                    type="text"
                    fullWidth
                    value={newEgress.config.secret_access_key || ""}
                    onChange={(e) => handleConfigChange(e, "add")}
                />
                <Autocomplete
                    margin="dense"
                    options={ngroupOptions}
                    getOptionLabel={(option) => option.short_name}
                    value={ngroupOptions.find((option) => option.short_name === newEgress.ngroup_id) || null}
                    onChange={(event, newValue) => {
                        handleNgroupAutocompleteChange(event, newValue ? newValue.short_name : "", "add");
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
                <Button onClick={handleCloseAddDialog}>Cancel</Button>
                <Button onClick={handleAddEgress}>Add</Button>
            </DialogActions>
        </Dialog>

        {/* Edit Egress Dialog */}
        <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
            <DialogTitle>Edit Egress</DialogTitle>
            <DialogContent>
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
                    name="region"
                    label="Config - Region"
                    type="text"
                    fullWidth
                    value={editEgress.config.region || ""}
                    onChange={(e) => handleConfigChange(e, "edit")}
                />
                <TextField
                    margin="dense"
                    name="access_key_id"
                    label="Config - Access Key ID"
                    type="text"
                    fullWidth
                    value={editEgress.config.access_key_id || ""}
                    onChange={(e) => handleConfigChange(e, "edit")}
                />
                <TextField
                    margin="dense"
                    name="secret_access_key"
                    label="Config - Secret Access Key"
                    type="text"
                    fullWidth
                    value={editEgress.config.secret_access_key || ""}
                    onChange={(e) => handleConfigChange(e, "edit")}
                />
                <Autocomplete
                    options={ngroupOptions}
                    getOptionLabel={(option) => option.short_name}
                    value={ngroupOptions.find(option => option.short_name === editEgress.ngroup_id) || null}
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
                <Button onClick={handleUpdateEgress}>Save</Button>
            </DialogActions>
        </Dialog>
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete the selected egress(es)?
                </Typography>
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
)
}