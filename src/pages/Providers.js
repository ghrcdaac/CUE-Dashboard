import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination, IconButton, Box, Card, CardContent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add'; // Not using Add yet
import { fetchProviders } from '../api/providerApi'; // Import API functions
import useAuth from '../hooks/useAuth'; // Import useAuth
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function Providers() {

    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { accessToken } = useAuth();

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await fetchProviders(accessToken); // Pass accessToken
            setProviders(data);
        } catch (error) {
            setError(error.message);
            toast.error(`Error fetching providers: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accessToken) { // Only fetch if logged in
            fetchData();
        }
    }, [accessToken]);

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            setSelected(providers.map((provider) => provider.id));
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
        () => providers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [providers, page, rowsPerPage]
    );

    // --- Placeholder handlers (add, edit, delete) ---
    const handleAddClick = () => {
        // Implement add functionality
        console.log("Add clicked");
        toast.warn("Add functionality not yet implemented.");
    };

   const handleEditClick = (provider) => { // Corrected parameter
    // Implement edit functionality
    console.log("Edit clicked for provider:", provider); // Now correct
    toast.warn("Edit functionality not yet implemented.");
    };


     const handleDeleteClick = () => { // Added to open the confirmation dialog
        if (selected.length === 0) {
            toast.error("Please select at least one row to delete.");
            return;
        }
        //setOpenDeleteDialog(true); // Open confirmation dialog -- to be implemented
        toast.warn("Delete functionality not yet implemented.");
    };


    if (loading) {
        return <div>Loading...</div>; // Simple loading indicator
    }

    if (error) {
        return <div>Error: {error}</div>; // Display error message
    }

    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* <Typography variant="h4" gutterBottom>
                Providers
            </Typography> */}

            {loading && <Typography>Loading providers...</Typography>}
            {error && <Typography color="error">Error: {error}</Typography>}

            <Card sx={{marginBottom: 2}}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <Typography variant="h5">Providers</Typography>
                        <Box>
                            {/* Add Button */}
                            <Button
                                variant="contained"
                                style={{ backgroundColor: 'green', color: 'white' }}
                                onClick={handleAddClick}
                                startIcon={<AddIcon />}
                                sx={{ mr: 1 }}
                            >
                                Add
                            </Button>
                             {/* Edit and Delete buttons */}
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleEditClick(providers.find(provider => selected.includes(provider.id)))} // Pass user
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
                                            indeterminate={selected.length > 0 && selected.length < providers.length}
                                            checked={providers.length > 0 && selected.length === providers.length}
                                            onChange={handleSelectAllClick}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black " }}>Short Name</TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>Long Name</TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>Can Upload</TableCell>
                                    
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {visibleRows.map((provider) => {
                                     const isItemSelected = isSelected(provider.id);
                                    return(
                                    <TableRow key={provider.id} hover onClick={(event) => handleClick(event, provider.id)}
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                     tabIndex={-1}
                                    selected={isItemSelected}>
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={isItemSelected} />
                                        </TableCell>
                                        <TableCell>{provider.short_name}</TableCell>
                                        <TableCell>{provider.long_name}</TableCell>
                                        <TableCell>{provider.can_upload ? 'Yes' : 'No'}</TableCell>
                                        
                                    </TableRow>
                                );})}
                            </TableBody>
                        </Table>
                    </TableContainer>
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
        </Box>

    );

}
export default Providers;