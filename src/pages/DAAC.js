import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from 'react-router-dom';
import {
    Box, Card, CardContent, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Typography, Checkbox,
    TablePagination, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, TableSortLabel, CircularProgress, Container, Alert
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector, useDispatch } from 'react-redux';

import * as egressApi from "../api/egressAPI";
import useAuth from '../hooks/useAuth';
import usePrivileges from '../hooks/usePrivileges';
import usePageTitle from "../hooks/usePageTitle";
import { parseApiError } from "../utils/errorUtils";
import { fetchEgresses } from '../app/reducers/dataCacheSlice';
import OutputIcon from '@mui/icons-material/Output';

const headCells = [
    { id: 'type', label: 'Type' },
    { id: 'path', label: 'Path ID Name' },
    { id: 'config', label: 'Config' },
];

export default function DAAC() {
    usePageTitle("DAAC Egress");
    
    const dispatch = useDispatch();
    const { activeNgroupId } = useAuth();
    const { hasPrivilege } = usePrivileges();
    const { setMenuItems } = useOutletContext();

    // Get data from the central Redux cache
    const { egresses } = useSelector((state) => state.dataCache);
    
    // Local state for UI operations
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 10 });
    const [sorting, setSorting] = useState({ orderBy: 'type', order: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [dialog, setDialog] = useState({ open: null, data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const daacMenuItems = [{ text: 'Egress', path: '/daac', icon: <OutputIcon /> }];
        setMenuItems(daacMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    // "Smart" data fetching that uses the cache
    useEffect(() => {
        if (activeNgroupId && egresses.status === 'idle') {
            dispatch(fetchEgresses());
        }
    }, [activeNgroupId, egresses.status, dispatch]);
    
    // Derives the page's loading state from the cache status
    useEffect(() => {
        setLoading(egresses.status === 'loading');
    }, [egresses.status]);

    const processedEgresses = useMemo(() => {
        let filtered = [...egresses.data];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.type.toLowerCase().includes(lowercasedTerm) ||
                e.path.toLowerCase().includes(lowercasedTerm)
            );
        }

        return filtered.sort((a, b) => {
            const isAsc = sorting.order === 'asc' ? 1 : -1;
            const aValue = a[sorting.orderBy] || '';
            const bValue = b[sorting.orderBy] || '';
            return aValue.localeCompare(bValue) * isAsc;
        });
    }, [egresses.data, sorting, searchTerm]);

    const handleOpenDialog = (type, data = null) => {
        if (type === 'edit') {
            const egressToEdit = egresses.data.find(e => e.id === selected[0]);
            const prettyConfig = JSON.stringify(egressToEdit.config, null, 2);
            setDialog({ open: 'edit', data: { ...egressToEdit, config: prettyConfig } });
        } else if (type === 'add') {
            setDialog({ open: 'add', data: { type: "", path: "", config: "{\n  \n}" } });
        } else {
            setDialog({ open: type, data });
        }
    };

    const handleCloseDialog = () => setDialog({ open: null, data: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        let parsedConfig;
        try {
            parsedConfig = JSON.parse(dialog.data.config);
        } catch (parseError) {
            toast.error(`Invalid JSON in config: ${parseError.message}`);
            setIsSubmitting(false);
            return;
        }

        try {
            if (dialog.open === 'add') {
                await egressApi.createEgress({ ...dialog.data, config: parsedConfig });
                toast.success("Egress added successfully!");
            } else if (dialog.open === 'edit') {
                const { id, ...updateData } = { ...dialog.data, config: parsedConfig };
                await egressApi.updateEgress(id, updateData);
                toast.success("Egress updated successfully!");
            }
            handleCloseDialog();
            setSelected([]);
            dispatch(fetchEgresses()); // Refresh the cache
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        setIsSubmitting(true);
        try {
            await Promise.all(selected.map(egressId => egressApi.deleteEgress(egressId)));
            toast.success("Egress deleted successfully!");
            handleCloseDialog();
            setSelected([]);
            dispatch(fetchEgresses()); // Refresh the cache
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestSort = (property) => {
        const isAsc = sorting.orderBy === property && sorting.order === 'asc';
        setSorting({ order: isAsc ? 'desc' : 'asc', orderBy: property });
    };

    const handleSelectAllClick = (event) => setSelected(event.target.checked ? processedEgresses.map(e => e.id) : []);

    const handleClick = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) newSelected = [...selected, id];
        else newSelected = selected.filter(selId => selId !== id);
        setSelected(newSelected);
    };

    return (
        <Container maxWidth={false} disableGutters>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h5">Egress</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField label="Search" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Button variant="contained" color="primary" onClick={() => handleOpenDialog('add')} startIcon={<AddIcon />} disabled={!hasPrivilege('egress:create')}>Add</Button>
                            <Button variant="contained" onClick={() => handleOpenDialog('edit')} disabled={selected.length !== 1 || !hasPrivilege('egress:update')} startIcon={<EditIcon />}>Edit</Button>
                            <Button variant="contained" color="error" onClick={() => handleOpenDialog('delete')} disabled={selected.length === 0 || !hasPrivilege('egress:delete')} startIcon={<DeleteIcon />}>Delete</Button>
                        </Box>
                    </Box>

                    {egresses.error && <Alert severity="error" sx={{ my: 2 }}>{egresses.error}</Alert>}

                    <TableContainer component={Paper}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < processedEgresses.length} checked={processedEgresses.length > 0 && selected.length === processedEgresses.length} onChange={handleSelectAllClick} /></TableCell>
                                    {headCells.map(headCell => (
                                        <TableCell key={headCell.id} sortDirection={sorting.orderBy === headCell.id ? sorting.order : false}>
                                            <TableSortLabel active={sorting.orderBy === headCell.id} direction={sorting.orderBy === headCell.id ? sorting.order : 'asc'} onClick={() => handleRequestSort(headCell.id)}>
                                                {headCell.label}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                                ) : processedEgresses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography sx={{ py: 5 }} color="text.secondary">
                                                {searchTerm ? "No Egress targets match your search." : "No Egress found."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    processedEgresses.slice(pagination.page * pagination.rowsPerPage, pagination.page * pagination.rowsPerPage + pagination.rowsPerPage).map((row) => {
                                        const isItemSelected = selected.indexOf(row.id) !== -1;
                                        return (
                                            <TableRow key={row.id} hover onClick={() => handleClick(row.id)} role="checkbox" tabIndex={-1} selected={isItemSelected}>
                                                <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                <TableCell>{row.type}</TableCell>
                                                <TableCell>{row.path}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{JSON.stringify(row.config)}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={processedEgresses.length}
                        rowsPerPage={pagination.rowsPerPage}
                        page={pagination.page}
                        onPageChange={(e, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                        onRowsPerPageChange={(e) => setPagination({ rowsPerPage: parseInt(e.target.value, 10), page: 0 })}
                    />
                </CardContent>
            </Card>

            <Dialog open={dialog.open === 'add' || dialog.open === 'edit'} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>{dialog.open === 'add' ? 'Add Egress' : 'Edit Egress'}</DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent>
                        {dialog.data && (
                            <>
                                <TextField autoFocus margin="dense" name="type" label="Type" fullWidth value={dialog.data.type} onChange={(e) => setDialog({...dialog, data: {...dialog.data, type: e.target.value}})} required/>
                                <TextField margin="dense" name="path" label="Path" fullWidth value={dialog.data.path} onChange={(e) => setDialog({...dialog, data: {...dialog.data, path: e.target.value}})} required/>
                                <TextField margin="dense" name="config" label="Config (JSON format)" fullWidth multiline rows={6} value={dialog.data.config} onChange={(e) => setDialog({...dialog, data: {...dialog.data, config: e.target.value}})} required/>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? <CircularProgress size={24} /> : (dialog.open === 'add' ? 'Add' : 'Save')}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={dialog.open === 'delete'} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>Are you sure you want to delete the {selected.length} selected egress target(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}