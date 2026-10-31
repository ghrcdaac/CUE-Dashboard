// src/pages/collections/CollectionProvidersDialog.js
// Many-to-many: manage the providers mapped to one collection (plan 15 §3).
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Autocomplete, TextField, Typography
} from '@mui/material';
import { toast } from 'react-toastify';

import * as collectionApi from '../../api/collectionApi';
import { parseApiError } from '../../utils/errorUtils';

function CollectionProvidersDialog({ open, collection, providerOptions = [], canEdit, onClose, onChanged }) {
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [toAdd, setToAdd] = useState(null);

    const collectionId = collection?.id;

    const load = useCallback(async () => {
        if (!collectionId) return;
        setLoading(true);
        try {
            const data = await collectionApi.listCollectionProviders(collectionId);
            setMappings(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(parseApiError(error));
        } finally {
            setLoading(false);
        }
    }, [collectionId]);

    useEffect(() => {
        if (open) {
            setToAdd(null);
            load();
        }
    }, [open, load]);

    // Each action calls one endpoint, then refreshes the card and tells the parent to refresh its cache.
    // Returns true on success, so callers keep their input when it fails.
    const run = async (action, successMessage) => {
        setBusy(true);
        try {
            await action();
            toast.success(successMessage);
            await load();
            if (onChanged) onChanged();
            return true;
        } catch (error) {
            toast.error(parseApiError(error));
            return false;
        } finally {
            setBusy(false);
        }
    };

    const mappedIds = new Set(mappings.map(m => m.provider_id));
    // The options come from the active DAAC's provider list, so they are already the same DAAC.
    const addOptions = providerOptions.filter(p => !mappedIds.has(p.id));

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Providers for {collection?.short_name}</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Provider</TableCell>
                                <TableCell>Uploads</TableCell>
                                {canEdit && <TableCell align="right">Actions</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {mappings.length === 0 ? (
                                <TableRow><TableCell colSpan={3} align="center">No providers mapped.</TableCell></TableRow>
                            ) : mappings.map(m => (
                                <TableRow key={m.provider_id}>
                                    <TableCell>
                                        {m.short_name}
                                        {m.is_primary && <Chip label="Primary" size="small" color="primary" sx={{ ml: 1 }} />}
                                    </TableCell>
                                    <TableCell>{m.can_upload ? 'Allowed' : 'Not allowed'}</TableCell>
                                    {canEdit && (
                                        <TableCell align="right">
                                            {!m.is_primary && (
                                                <Button size="small" disabled={busy}
                                                    onClick={() => run(() => collectionApi.setPrimaryCollectionProvider(collectionId, m.provider_id), `${m.short_name} is now the primary provider.`)}>
                                                    Make primary
                                                </Button>
                                            )}
                                            <Tooltip title={m.is_primary ? 'Set another primary first' : ''}>
                                                <span>
                                                    <Button size="small" color="error" disabled={busy || m.is_primary}
                                                        onClick={() => run(() => collectionApi.removeCollectionProvider(collectionId, m.provider_id), `${m.short_name} removed.`)}>
                                                        Remove
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {canEdit && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
                        <Autocomplete
                            sx={{ flexGrow: 1 }}
                            size="small"
                            options={addOptions}
                            getOptionLabel={(option) => option.short_name || ''}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={toAdd}
                            onChange={(e, value) => setToAdd(value)}
                            renderInput={(params) => <TextField {...params} label="Add provider" />}
                        />
                        <Button variant="contained" disabled={!toAdd || busy || loading}
                            onClick={() => run(() => collectionApi.addCollectionProvider(collectionId, toAdd.id), `${toAdd.short_name} added.`).then((ok) => { if (ok) setToAdd(null); })}>
                            Add
                        </Button>
                    </Box>
                )}
                {!canEdit && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        You can view these mappings but not change them.
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

export default CollectionProvidersDialog;
