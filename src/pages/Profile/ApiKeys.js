import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Paper, CircularProgress, Checkbox, TableSortLabel, Chip,
    Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SyncLockIcon from '@mui/icons-material/SyncLock';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// MODIFICATION: Added useAuth import
import useAuth from '../../hooks/useAuth';
import usePrivileges from '../../hooks/usePrivileges';
import { getApiKeys, revokeApiKey, updateApiKey } from '../../api/apiKeys';
import { parseApiError } from '../../utils/errorUtils';
import CreateApiKeyModal from './CreateApiKeyModal';

const formatDate = (isoString, emptyText = 'N/A') => {
    if (!isoString) return emptyText;
    return new Date(isoString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

function ApiKeys() {
    // MODIFICATION: Get the reactive activeNgroupId from useAuth.
    const { activeNgroupId } = useAuth();
    const { hasPrivilege } = usePrivileges();
    const [apiKeys, setApiKeys] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('created_at');
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

    const fetchApiKeys = useCallback(async () => {
        // MODIFICATION: Guard against running if no group is selected.
        if (!activeNgroupId) {
            setLoading(false);
            setApiKeys([]); // Clear keys if no group is active
            return;
        }
        setLoading(true);
        setSelected([]);
        try {
            const data = await getApiKeys();
            setApiKeys(data);
        } catch (err) {
            toast.error(parseApiError(err));
        } finally {
            setLoading(false);
        }
    // MODIFICATION: Added activeNgroupId to the dependency array.
    }, [activeNgroupId]);

    useEffect(() => {
        fetchApiKeys();
    }, [fetchApiKeys]);

    const filteredAndSortedKeys = useMemo(() => {
        const filtered = apiKeys.filter(key =>
            key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (key.key_type && key.key_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (key.user_name && key.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (key.proxy_user_name && key.proxy_user_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        const comparator = (a, b) => {
            const isAsc = order === 'asc';
            let aValue = a[orderBy] || '';
            let bValue = b[orderBy] || '';
            if (aValue < bValue) return isAsc ? -1 : 1;
            if (aValue > bValue) return isAsc ? 1 : -1;
            return 0;
        };
        return filtered.sort(comparator);
    }, [apiKeys, order, orderBy, searchTerm]);

    const visibleRows = useMemo(() => {
        return filteredAndSortedKeys.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredAndSortedKeys, page, rowsPerPage]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };
    
    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelected = filteredAndSortedKeys.map((n) => n.id);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) newSelected = [...selected, id];
        else newSelected = selected.filter(selId => selId !== id);
        setSelected(newSelected);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleCreateClick = () => setCreateModalOpen(true);
    const handleRevokeClick = () => setRevokeDialogOpen(true);
    const handleSuspendReactivateClick = () => setSuspendDialogOpen(true);

    const handleConfirmRevoke = async () => {
        setIsSubmitting(true);
        try {
            await Promise.all(selected.map(keyId => revokeApiKey(keyId)));
            toast.success(`${selected.length} key(s) revoked successfully!`);
            setRevokeDialogOpen(false);
            fetchApiKeys();
        } catch (err) {
            toast.error(parseApiError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmSuspendReactivate = async (newStatus) => {
        setIsSubmitting(true);
        try {
            await Promise.all(selected.map(keyId => updateApiKey(keyId, { is_active: newStatus })));
            toast.success(`${selected.length} key(s) updated successfully!`);
            setSuspendDialogOpen(false);
            fetchApiKeys();
        } catch (err) {
            toast.error(parseApiError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">API Key Management</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField label="Search Keys" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick} disabled={!hasPrivilege('api-key:create')}>Create API Key</Button>
                            <Button variant="outlined" startIcon={<SyncLockIcon />} onClick={handleSuspendReactivateClick} disabled={selected.length === 0 || !hasPrivilege('api-key:update')}>Suspend/Reactivate</Button>
                            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleRevokeClick} disabled={selected.length === 0 || !hasPrivilege('api-key:delete')}>Revoke</Button>
                        </Box>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ bgcolor: "#E5E8EB" }}><Checkbox color="primary" indeterminate={selected.length > 0 && selected.length < filteredAndSortedKeys.length} checked={filteredAndSortedKeys.length > 0 && selected.length === filteredAndSortedKeys.length} onChange={handleSelectAllClick} /></TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB" }}><TableSortLabel active={orderBy === 'name'} direction={order} onClick={() => handleRequestSort('name')}>Name</TableSortLabel></TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB" }}><TableSortLabel active={orderBy === 'key_type'} direction={order} onClick={() => handleRequestSort('key_type')}>Key Type</TableSortLabel></TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB" }}>Key Suffix</TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB" }}>Owner</TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB" }}>Created By</TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB" }}><TableSortLabel active={orderBy === 'is_active'} direction={order} onClick={() => handleRequestSort('is_active')}>Status</TableSortLabel></TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB" }}><TableSortLabel active={orderBy === 'expires_at'} direction={order} onClick={() => handleRequestSort('expires_at')}>Expires At</TableSortLabel></TableCell>
                                    <TableCell sx={{ bgcolor: "#E5E8EB" }}><TableSortLabel active={orderBy === 'last_used_at'} direction={order} onClick={() => handleRequestSort('last_used_at')}>Last Used</TableSortLabel></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={9} align="center"><CircularProgress /></TableCell></TableRow>
                                    : visibleRows.length > 0 ? visibleRows.map((row) => {
                                        const isItemSelected = isSelected(row.id);
                                        return (
                                            <TableRow hover onClick={(event) => handleClick(event, row.id)} role="checkbox" tabIndex={-1} key={row.id} selected={isItemSelected}>
                                                <TableCell padding="checkbox"><Checkbox color="primary" checked={isItemSelected} /></TableCell>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>{row.key_type}</TableCell>
                                                <TableCell><code>...{row.key_display_suffix}</code></TableCell>
                                                <TableCell>{row.proxy_user_name || row.user_name || 'N/A'}</TableCell>
                                                <TableCell>{row.created_by_user_name || 'N/A'}</TableCell>
                                                <TableCell><Chip label={row.is_active ? 'Active' : 'Suspended'} color={row.is_active ? 'success' : 'default'} size="small"/></TableCell>
                                                <TableCell>{formatDate(row.expires_at)}</TableCell>
                                                <TableCell>{formatDate(row.last_used_at, 'Never')}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                    : <TableRow><TableCell colSpan={9} align="center"><Typography color="text.secondary">No API keys found.</Typography></TableCell></TableRow>
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={filteredAndSortedKeys.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </CardContent>
            </Card>

            <CreateApiKeyModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onKeyCreated={fetchApiKeys} />
            
            <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
                <DialogTitle>Confirm Revoke</DialogTitle>
                <DialogContent><Typography>Are you sure you want to permanently revoke {selected.length} selected key(s)? This action cannot be undone.</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setRevokeDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleConfirmRevoke} color="error" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : 'Revoke'}</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)}>
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogContent><Typography>What action would you like to perform on the {selected.length} selected key(s)?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setSuspendDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={() => handleConfirmSuspendReactivate(true)} color="success" variant="outlined" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : 'Reactivate'}</Button>
                    <Button onClick={() => handleConfirmSuspendReactivate(false)} color="warning" variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : 'Suspend'}</Button>
                </DialogActions>
            </Dialog>
            
            <ToastContainer position="top-center" />
        </>
    );
}

export default ApiKeys;
