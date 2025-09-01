// src/pages/Profile/ApiKeys.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Paper, CircularProgress, Checkbox, TableSortLabel, Chip,
  Dialog, DialogActions, DialogContent, DialogTitle // --- NEW: Imports for dialogs ---
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SyncLockIcon from '@mui/icons-material/SyncLock';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getApiKeys, deleteApiKey, updateApiKey } from '../../api/apiKeys'; // --- UPDATED: Import new API functions ---
import CreateApiKeyModal from './CreateApiKeyModal';

const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

function ApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // --- NEW: State for action submission ---
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');

  // --- NEW: State for confirmation dialogs ---
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    setSelected([]);
    try {
      const data = await getApiKeys();
      setApiKeys(data);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to load API keys: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const visibleRows = useMemo(() => {
    let filteredKeys = apiKeys.filter((key) =>
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (key.user_name && key.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (key.proxy_user_name && key.proxy_user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const comparator = (a, b) => {
      const fieldA = a[orderBy] || '';
      const fieldB = b[orderBy] || '';
      if (fieldB < fieldA) return order === 'asc' ? 1 : -1;
      if (fieldB > fieldA) return order === 'asc' ? -1 : 1;
      return 0;
    };
    return filteredKeys.sort(comparator).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [apiKeys, searchTerm, order, orderBy, page, rowsPerPage]);
  
  // --- Event Handlers (Table interactions) ---
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(visibleRows.map((n) => n.id));
      return;
    }
    setSelected([]);
  };
  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) newSelected = newSelected.concat(selected, id);
    else if (selectedIndex === 0) newSelected = newSelected.concat(selected.slice(1));
    else if (selectedIndex === selected.length - 1) newSelected = newSelected.concat(selected.slice(0, -1));
    else if (selectedIndex > 0) newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    setSelected(newSelected);
  };
  const isSelected = (id) => selected.indexOf(id) !== -1;
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleCreateClick = () => setCreateModalOpen(true);

  // --- NEW: Handlers for Revoke action ---
  const handleRevokeClick = () => setRevokeDialogOpen(true);
  const handleConfirmRevoke = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(selected.map(keyId => deleteApiKey(keyId)));
      toast.success(`${selected.length} key(s) revoked successfully!`);
      setRevokeDialogOpen(false);
      fetchApiKeys(); // Refresh table
    } catch (err) {
      toast.error(`Failed to revoke key(s): ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NEW: Handlers for Suspend/Reactivate action ---
  const handleSuspendReactivateClick = () => setSuspendDialogOpen(true);
  const handleConfirmSuspendReactivate = async (newStatus) => {
    setIsSubmitting(true);
    try {
      await Promise.all(selected.map(keyId => updateApiKey(keyId, { is_active: newStatus })));
      toast.success(`${selected.length} key(s) updated successfully!`);
      setSuspendDialogOpen(false);
      fetchApiKeys(); // Refresh table
    } catch (err) {
      toast.error(`Failed to update key(s): ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          {/* Header remains the same */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">API Key Management</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField label="Search Keys" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>Create API Key</Button>
              <Button variant="outlined" startIcon={<SyncLockIcon />} onClick={handleSuspendReactivateClick} disabled={selected.length === 0}>Suspend/Reactivate</Button>
              <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleRevokeClick} disabled={selected.length === 0}>Revoke</Button>
            </Box>
          </Box>
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                 {/* Table Headers remain the same */}
                 <TableRow>
                  <TableCell padding="checkbox" sx={{ bgcolor: "#E5E8EB" }}><Checkbox color="primary" indeterminate={selected.length > 0 && selected.length < visibleRows.length} checked={visibleRows.length > 0 && selected.length === visibleRows.length} onChange={handleSelectAllClick} /></TableCell>
                  <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}><TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => handleRequestSort('name')}>Name</TableSortLabel></TableCell>
                  <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>Key Suffix</TableCell>
                  <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>Owner</TableCell>
                  <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}>Created By</TableCell>
                  <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}><TableSortLabel active={orderBy === 'is_active'} direction={orderBy === 'is_active' ? order : 'asc'} onClick={() => handleRequestSort('is_active')}>Status</TableSortLabel></TableCell>
                  <TableCell sx={{ bgcolor: "#E5E8EB", color: "black" }}><TableSortLabel active={orderBy === 'expires_at'} direction={orderBy === 'expires_at' ? order : 'asc'} onClick={() => handleRequestSort('expires_at')}>Expires At</TableSortLabel></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Table Body rendering remains the same */}
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
                ) : visibleRows.length > 0 ? (
                  visibleRows.map((row) => {
                    const isItemSelected = isSelected(row.id);
                    return (
                      <TableRow hover onClick={(event) => handleClick(event, row.id)} role="checkbox" tabIndex={-1} key={row.id} selected={isItemSelected}>
                        <TableCell padding="checkbox"><Checkbox color="primary" checked={isItemSelected} /></TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell><code>{row.prefix}...{row.key_display_suffix}</code></TableCell>
                        <TableCell>{row.proxy_user_name || row.user_name || 'Unknown User'}</TableCell>
                        <TableCell>{row.created_by_user_name || 'Unknown User'}</TableCell>
                        <TableCell><Chip label={row.is_active ? 'Active' : 'Inactive'} color={row.is_active ? 'success' : 'default'} size="small"/></TableCell>
                        <TableCell>{formatDate(row.expires_at)}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary">No API keys found.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={apiKeys.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
        <ToastContainer position="top-center" />
      </Card>

      <CreateApiKeyModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onKeyCreated={fetchApiKeys} />

      {/* --- NEW: Confirmation Dialogs --- */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
        <DialogTitle>Confirm Revoke</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently revoke {selected.length} selected key(s)? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleConfirmRevoke} color="error" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Revoke'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>What action would you like to perform on the {selected.length} selected key(s)?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={() => handleConfirmSuspendReactivate(true)} color="success" variant="outlined" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Reactivate'}
          </Button>
          <Button onClick={() => handleConfirmSuspendReactivate(false)} color="warning" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Suspend'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ApiKeys;