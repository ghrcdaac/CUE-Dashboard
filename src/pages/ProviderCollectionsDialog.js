// src/pages/ProviderCollectionsDialog.js
// Many-to-many: read-only list of the collections mapped to one provider (plan 15 §4).
import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import { toast } from 'react-toastify';

import { listProviderCollections } from '../api/providerApi';
import { parseApiError } from '../utils/errorUtils';

function ProviderCollectionsDialog({ open, provider, onClose }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const providerId = provider?.id;

    useEffect(() => {
        if (!open || !providerId) return;
        let cancelled = false;
        setLoading(true);
        listProviderCollections(providerId)
            .then(data => { if (!cancelled) setRows(Array.isArray(data) ? data : []); })
            .catch(error => toast.error(parseApiError(error)))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, providerId]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Collections for {provider?.short_name} ({loading ? '…' : rows.length})</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress aria-label="Loading" /></Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow><TableCell>Collection</TableCell><TableCell>Status</TableCell></TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow><TableCell colSpan={2} align="center">No collections mapped.</TableCell></TableRow>
                            ) : rows.map(c => (
                                <TableRow key={c.collection_id}>
                                    <TableCell>
                                        {c.short_name}
                                        {c.is_primary && <Chip label="Primary" size="small" color="primary" sx={{ ml: 1 }} />}
                                    </TableCell>
                                    <TableCell>{c.active ? 'Active' : 'Inactive'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
        </Dialog>
    );
}

export default ProviderCollectionsDialog;
