// src/pages/users/RejectedRequests.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Typography, Checkbox, TablePagination,
    TextField, Box, Card, CardContent,
    TableSortLabel, CircularProgress, Container, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { parseApiError } from '../../utils/errorUtils';
import UndoIcon from '@mui/icons-material/Undo';

import { listUserApplications, restoreUserApplication } from '../../api/userApplicationApi';
import { fetchProviders } from '../../app/reducers/dataCacheSlice';



function RejectedRequests() {
    const dispatch = useDispatch();
    const { user: currentUser, activeNgroupId } = useAuth();
    const { providers } = useSelector((state) => state.dataCache);

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedApplications, setSelectedApplications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [spamFilter] = useState('spam');
    const [confirmUnmarkDialog, setConfirmUnmarkDialog] = useState({ open: false, idsToRestore: [] });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');

    usePageTitle(spamFilter === 'spam' ? 'Spam User Requests' : 'Rejected User Requests');

    const isPrivilegedViewer = useMemo(() =>
        currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('security'),
        [currentUser?.roles]
    );

    const hasSelectedSpam = useMemo(() => {
        return selectedApplications.some(id => {
            const app = applications.find(a => a.id === id);
            return app ? app.is_spam : false;
        });
    }, [selectedApplications, applications]);

    const activeHeadCells = useMemo(() => {
        const cells = [
            { id: 'name', label: 'Name' },
            { id: 'email', label: 'Email' },
            { id: 'username', label: 'Username' },
            { id: 'applied', label: 'Applied' },
            { id: 'account_type', label: 'Account Type' },
            { id: 'providerName', label: 'Provider' },
        ];
        if (spamFilter === 'all') {
            cells.push({ id: 'is_spam', label: 'Spam' });
        }
        return cells;
    }, [spamFilter]);

    useEffect(() => {
        if (providers.status === 'idle') dispatch(fetchProviders());
    }, [providers.status, dispatch]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'Invalid Date';

        return new Intl.DateTimeFormat(navigator.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short'
        }).format(date);
    };

    const fetchRejectedApplications = useCallback(async () => {
        if (!isPrivilegedViewer && !activeNgroupId) {
            setApplications([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let isSpamVal;
            if (spamFilter === 'spam') {
                isSpamVal = true;
            } else if (spamFilter === 'rejected') {
                isSpamVal = false;
            }

            const apps = await listUserApplications('rejected', {
                forceGlobal: isPrivilegedViewer,
                isSpam: isSpamVal,
            });
            setApplications(apps || []);
            setSelectedApplications([]);
        } catch (err) {
            const apiError = parseApiError(err);
            setError(apiError);
            toast.error(apiError);
        } finally {
            setLoading(false);
        }
    }, [activeNgroupId, isPrivilegedViewer, spamFilter]);

    useEffect(() => {
        fetchRejectedApplications();
    }, [fetchRejectedApplications]);

    const processedApplications = useMemo(() => {
        const providerMap = new Map((providers.data || []).map(provider => [provider.id, provider.short_name]));
        const lowerSearch = searchTerm.toLowerCase();

        const populated = applications.map(application => ({
            ...application,
            providerName: application.provider_id ? providerMap.get(application.provider_id) || 'N/A' : '',
        }));

        const filtered = lowerSearch
            ? populated.filter(application =>
                application.name?.toLowerCase().includes(lowerSearch) ||
                application.email?.toLowerCase().includes(lowerSearch) ||
                application.username?.toLowerCase().includes(lowerSearch) ||
                application.providerName?.toLowerCase().includes(lowerSearch) ||
                application.justification?.toLowerCase().includes(lowerSearch)
            )
            : populated;

        return [...filtered].sort((a, b) => {
            const isAsc = order === 'asc' ? 1 : -1;
            const aValue = orderBy === 'applied'
                ? new Date(a.applied || 0).getTime()
                : orderBy === 'is_spam'
                ? (a.is_spam ? 1 : 0)
                : (a[orderBy] || '').toString().toLowerCase();
            const bValue = orderBy === 'applied'
                ? new Date(b.applied || 0).getTime()
                : orderBy === 'is_spam'
                ? (b.is_spam ? 1 : 0)
                : (b[orderBy] || '').toString().toLowerCase();

            if (aValue < bValue) return -1 * isAsc;
            if (aValue > bValue) return 1 * isAsc;
            return 0;
        });
    }, [applications, providers.data, order, orderBy, searchTerm]);

    const visibleRows = useMemo(
        () => processedApplications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [processedApplications, page, rowsPerPage]
    );

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };



    const handleUnmarkSpamClick = () => {
        const spamIdsToUnmark = selectedApplications.filter(id => {
            const app = applications.find(a => a.id === id);
            return app ? app.is_spam : false;
        });

        const idsToRestore = spamFilter === 'spam' ? selectedApplications : spamIdsToUnmark;

        if (idsToRestore.length === 0) {
            toast.error('Please select at least one spam application to unmark.');
            return;
        }

        setConfirmUnmarkDialog({ open: true, idsToRestore });
    };

    const handleConfirmUnmarkSpam = async () => {
        const { idsToRestore } = confirmUnmarkDialog;
        setRestoreLoading(true);
        try {
            await Promise.all(idsToRestore.map(applicationId => restoreUserApplication(applicationId)));
            if (spamFilter === 'spam') {
                setApplications(applications.filter(app => !idsToRestore.includes(app.id)));
            } else {
                setApplications(applications.map(app =>
                    idsToRestore.includes(app.id) ? { ...app, is_spam: false } : app
                ));
            }
            setSelectedApplications(selectedApplications.filter(id => !idsToRestore.includes(id)));
            setConfirmUnmarkDialog({ open: false, idsToRestore: [] });
            toast.success('Applications unmarked from spam successfully!');
        } catch (err) {
            toast.error(`Error unmarking applications: ${parseApiError(err)}`);
        } finally {
            setRestoreLoading(false);
        }
    };

    const handleSelectAllClick = (event) => {
        setSelectedApplications(event.target.checked ? visibleRows.map((row) => row.id) : []);
    };

    const handleClick = (id) => {
        setSelectedApplications((currentSelected) =>
            currentSelected.includes(id)
                ? currentSelected.filter(selectedId => selectedId !== id)
                : [...currentSelected, id]
        );
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const isSelected = (id) => selectedApplications.includes(id);
    const emptyMessage = spamFilter === 'spam'
        ? 'No spam applications found.'
        : spamFilter === 'rejected'
        ? 'No rejected applications found.'
        : 'No rejected or spam applications found.';

    return (
        <Container maxWidth={false} disableGutters>
            <ToastContainer position="top-center" />
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h5">
                            {spamFilter === 'spam' ? 'Spam User Applications' : 'Rejected User Applications'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <TextField
                                label="Search Applications"
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setPage(0);
                                }}
                            />

                            {((spamFilter === 'spam' && selectedApplications.length > 0) ||
                              (spamFilter === 'all' && hasSelectedSpam)) && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleUnmarkSpamClick}
                                    disabled={restoreLoading}
                                    startIcon={<UndoIcon />}
                                >
                                    {restoreLoading ? <CircularProgress size={24} color="inherit" /> : 'Unmark Spam'}
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                            <CircularProgress />
                        </Box>
                    ) : !error && (
                        <>
                            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                                <Table aria-label="rejected applications table" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    indeterminate={selectedApplications.length > 0 && selectedApplications.length < visibleRows.length}
                                                    checked={visibleRows.length > 0 && selectedApplications.length === visibleRows.length}
                                                    onChange={handleSelectAllClick}
                                                />
                                            </TableCell>
                                            {activeHeadCells.map((headCell) => (
                                                <TableCell key={headCell.id} sortDirection={orderBy === headCell.id ? order : false}>
                                                    <TableSortLabel
                                                        active={orderBy === headCell.id}
                                                        direction={orderBy === headCell.id ? order : 'asc'}
                                                        onClick={() => handleRequestSort(headCell.id)}
                                                    >
                                                        {headCell.label}
                                                    </TableSortLabel>
                                                </TableCell>
                                            ))}
                                            <TableCell>Justification</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {visibleRows.length > 0 ? (
                                            visibleRows.map((application) => {
                                                const isItemSelected = isSelected(application.id);
                                                return (
                                                    <TableRow
                                                        key={application.id}
                                                        hover
                                                        onClick={() => handleClick(application.id)}
                                                        selected={isItemSelected}
                                                        sx={{ cursor: 'pointer' }}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox checked={isItemSelected} />
                                                        </TableCell>
                                                        <TableCell>{application.name}</TableCell>
                                                        <TableCell>{application.email}</TableCell>
                                                        <TableCell>{application.username}</TableCell>
                                                        <TableCell>{formatDate(application.applied)}</TableCell>
                                                        <TableCell>{application.account_type}</TableCell>
                                                        <TableCell>{application.providerName || 'N/A'}</TableCell>
                                                        {spamFilter === 'all' && (
                                                            <TableCell>{application.is_spam ? 'Yes' : 'No'}</TableCell>
                                                        )}
                                                        <TableCell>{application.justification}</TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={activeHeadCells.length + 2} align="center">
                                                    <Typography sx={{ py: 5 }} color="text.secondary">
                                                        {searchTerm ? 'No applications match your search.' : emptyMessage}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                component="div"
                                count={processedApplications.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={confirmUnmarkDialog.open} onClose={() => setConfirmUnmarkDialog({ open: false, idsToRestore: [] })}>
                <DialogTitle>Confirm Unmark Spam</DialogTitle>
                <DialogContent>
                    <Typography>
                        After unmarking, the user will be able to submit applications again. Do you want to unmark?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmUnmarkDialog({ open: false, idsToRestore: [] })}>Cancel</Button>
                    <Button onClick={handleConfirmUnmarkSpam} color="primary" variant="contained" disabled={restoreLoading}>
                        {restoreLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}

export default RejectedRequests;
