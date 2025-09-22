// src/pages/DAAC.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from 'react-router-dom';
import {
    Box, Card, CardContent, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Typography, Checkbox,
    TablePagination, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, TableSortLabel, CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EvStationIcon from '@mui/icons-material/EvStation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- V2 MIGRATION: Import all API functions from the newly updated file ---
import * as egressApi from "../api/egressAPI";
import useAuth from '../hooks/useAuth';
import usePrivileges from '../hooks/usePrivileges';
import usePageTitle from "../hooks/usePageTitle";
import { parseApiError } from "../utils/errorUtils";

export default function DAAC() {
    usePageTitle("DAAC Egress");
    const [egresses, setEgresses] = useState([]);
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [newEgress, setNewEgress] = useState({ type: "", path: "", config: "" });
    const [editEgress, setEditEgress] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('type');

    // --- V2 MIGRATION: Use modern hooks for auth state and privileges ---
    const { activeNgroupId } = useAuth();
    const { hasPrivilege } = usePrivileges();
    const { setMenuItems } = useOutletContext();

    useEffect(() => {
        const daacMenuItems = [
            { text: 'Egress', path: '/daac', icon: <EvStationIcon /> },
        ];
        setMenuItems(daacMenuItems);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    const fetchEgressData = useCallback(async () => {
        // --- FIX: Rely on activeNgroupId from the auth hook ---
        if (!activeNgroupId) return;

        setLoading(true);
        try {
            // --- V2 MIGRATION: Use new, simplified API signature ---
            const data = await egressApi.listEgresses();
            setEgresses(data);
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setLoading(false);
        }
    }, [activeNgroupId]);

    useEffect(() => {
        fetchEgressData();
    }, [fetchEgressData]);

    const handleAddClick = () => {
        setNewEgress({ type: "", path: "", config: "{\n  \n}" }); // Pre-fill with empty JSON
        setOpenAddDialog(true);
    };

    const handleEditClick = () => {
        if (selected.length !== 1) return;
        const egressToEdit = egresses.find(e => e.id === selected[0]);
        setEditEgress({
            ...egressToEdit,
            config: JSON.stringify(egressToEdit.config, null, 2) // Pretty-print JSON for editing
        });
        setOpenEditDialog(true);
    };

    const handleCloseDialogs = () => {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        setOpenDeleteDialog(false);
    };

    const handleAddEgress = async () => {
        setIsSubmitting(true);
        try {
            let parsedConfig;
            try {
                parsedConfig = JSON.parse(newEgress.config);
            } catch (parseError) {
                toast.error(`Invalid JSON in config: ${parseError.message}`);
                setIsSubmitting(false);
                return;
            }
            
            const egressToCreate = { ...newEgress, config: parsedConfig };
            // --- V2 MIGRATION: No need to pass accessToken or ngroup_id ---
            await egressApi.createEgress(egressToCreate);

            toast.success("Egress added successfully!");
            handleCloseDialogs();
            fetchEgressData();
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateEgress = async () => {
        if (!editEgress) return;
        setIsSubmitting(true);
        try {
            let parsedConfig;
            try {
                parsedConfig = JSON.parse(editEgress.config);
            } catch (parseError) {
                toast.error(`Invalid JSON in config: ${parseError.message}`);
                setIsSubmitting(false);
                return;
            }

            const updatedEgressData = { ...editEgress, config: parsedConfig };
            await egressApi.updateEgress(editEgress.id, updatedEgressData);

            toast.success("Egress updated successfully!");
            handleCloseDialogs();
            setSelected([]);
            fetchEgressData();
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
            handleCloseDialogs();
            setSelected([]);
            fetchEgressData();
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedAndFilteredEgresses = useMemo(() => {
        const filtered = egresses.filter(egress =>
            egress.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            egress.path.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const comparator = (a, b) => {
            const isAsc = order === 'asc';
            if (a[orderBy] < b[orderBy]) return isAsc ? -1 : 1;
            if (a[orderBy] > b[orderBy]) return isAsc ? 1 : -1;
            return 0;
        };
        return filtered.sort(comparator);
    }, [egresses, order, orderBy, searchTerm]);
    
    // --- IMPROVEMENT: Simplified row selection logic ---
    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) newSelected = [...selected, id];
        else newSelected = selected.filter(selId => selId !== id);
        setSelected(newSelected);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Egress Targets</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField label="Search" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            {/* --- V2 MIGRATION: Action buttons are now privilege-controlled --- */}
                            <Button variant="contained" color="primary" onClick={handleAddClick} startIcon={<AddIcon />} disabled={!hasPrivilege('egress:create')}>Add</Button>
                            <Button variant="contained" onClick={handleEditClick} disabled={selected.length !== 1 || !hasPrivilege('egress:update')} startIcon={<EditIcon />}>Edit</Button>
                            <Button variant="contained" color="error" onClick={() => setOpenDeleteDialog(true)} disabled={selected.length === 0 || !hasPrivilege('egress:delete')} startIcon={<DeleteIcon />}>Delete</Button>
                        </Box>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                    ) : (
                        <>
                            <TableContainer component={Paper}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox"><Checkbox indeterminate={selected.length > 0 && selected.length < sortedAndFilteredEgresses.length} checked={sortedAndFilteredEgresses.length > 0 && selected.length === sortedAndFilteredEgresses.length} onChange={(e) => setSelected(e.target.checked ? sortedAndFilteredEgresses.map(e => e.id) : [])} /></TableCell>
                                            <TableCell><TableSortLabel active={orderBy === 'type'} direction={order} onClick={() => handleRequestSort('type')}>Type</TableSortLabel></TableCell>
                                            <TableCell><TableSortLabel active={orderBy === 'path'} direction={order} onClick={() => handleRequestSort('path')}>Path</TableSortLabel></TableCell>
                                            <TableCell>Config</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sortedAndFilteredEgresses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                                            const isItemSelected = isSelected(row.id);
                                            return (
                                                <TableRow key={row.id} hover onClick={(event) => handleClick(event, row.id)} role="checkbox" tabIndex={-1} selected={isItemSelected}>
                                                    <TableCell padding="checkbox"><Checkbox checked={isItemSelected} /></TableCell>
                                                    <TableCell>{row.type}</TableCell>
                                                    <TableCell>{row.path}</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{JSON.stringify(row.config)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50]}
                                component="div"
                                count={sortedAndFilteredEgresses.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <Dialog open={openAddDialog} onClose={handleCloseDialogs} fullWidth maxWidth="sm">
                <DialogTitle>Add Egress Target</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" name="type" label="Type" fullWidth value={newEgress.type} onChange={(e) => setNewEgress({...newEgress, type: e.target.value})} />
                    <TextField margin="dense" name="path" label="Path" fullWidth value={newEgress.path} onChange={(e) => setNewEgress({...newEgress, path: e.target.value})} />
                    <TextField margin="dense" name="config" label="Config (JSON format)" fullWidth multiline rows={6} value={newEgress.config} onChange={(e) => setNewEgress({...newEgress, config: e.target.value})} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs}>Cancel</Button>
                    <Button onClick={handleAddEgress} variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openEditDialog} onClose={handleCloseDialogs} fullWidth maxWidth="sm">
                <DialogTitle>Edit Egress Target</DialogTitle>
                <DialogContent>
                    {editEgress && (
                        <>
                            <TextField autoFocus margin="dense" label="Type" fullWidth value={editEgress.type} onChange={(e) => setEditEgress({...editEgress, type: e.target.value})} />
                            <TextField margin="dense" label="Path" fullWidth value={editEgress.path} onChange={(e) => setEditEgress({...editEgress, path: e.target.value})} />
                            <TextField margin="dense" label="Config (JSON format)" fullWidth multiline rows={6} value={editEgress.config} onChange={(e) => setEditEgress({...editEgress, config: e.target.value})} />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs}>Cancel</Button>
                    <Button onClick={handleUpdateEgress} variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>Are you sure you want to delete the {selected.length} selected egress target(s)?</DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}