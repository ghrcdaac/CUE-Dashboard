// src/pages/CollectionOverview.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, TablePagination, Card, CardContent,
  CircularProgress, TableSortLabel
} from '@mui/material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { collectionFilesCount } from '../../api/collectionApi';

function CollectionOverview() {
  const [collections, setCollections] = useState([]);
  const [page, setPage] = useState(0); // zero-based index for MUI
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sorting state
  const [orderBy, setOrderBy] = useState('name'); // default sort by collection name
  const [order, setOrder] = useState('asc');

  const ngroupId = localStorage.getItem('CUE_ngroup_id');
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (collectionId, collectionName) => {
    navigate(`/collections/files?collection_id=${collectionId}&collection_name=${encodeURIComponent(collectionName)}`);
  };

  const fetchCollectionOverview = useCallback(async () => {
    if (!ngroupId) {
      toast.error("Ngroup ID not found. Please log in again.");
      logout();
      return;
    }

    setLoading(true);
    try {
      const params = {
        ngroup_id: ngroupId,
        page: page + 1,
        page_size: rowsPerPage,
      };
      const data = await collectionFilesCount(params, accessToken);
      setCollections(data.files_by_count || []);
      setTotalCount(data.total_count || 0);
    } catch (error) {
      toast.error("Failed to load collection overview");
    } finally {
      setLoading(false);
    }
  }, [ngroupId, page, rowsPerPage, accessToken, logout]);

  useEffect(() => {
    fetchCollectionOverview();
  }, [fetchCollectionOverview]);

  // Handle sort toggle
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Apply sorting client-side
  const sortedCollections = React.useMemo(() => {
    return [...collections].sort((a, b) => {
      if (orderBy === 'name') {
        return order === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (orderBy === 'file_count') {
        return order === 'asc'
          ? a.file_count - b.file_count
          : b.file_count - a.file_count;
      }
      return 0;
    });
  }, [collections, order, orderBy]);

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Card sx={{ marginBottom: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Collection Files Overview
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#E5E8EB" }}>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'name'}
                            direction={orderBy === 'name' ? order : 'asc'}
                            onClick={() => handleRequestSort('name')}
                          >
                            Collection
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'file_count'}
                            direction={orderBy === 'file_count' ? order : 'asc'}
                            onClick={() => handleRequestSort('file_count')}
                          >
                            Files
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedCollections.length > 0 ? (
                        sortedCollections.map((col) => (
                          <TableRow key={col.id} hover sx={{ cursor: 'pointer' }}>
                            <TableCell onClick={() => handleNavigate(col.id, col.name)}>{col.name}</TableCell>
                            <TableCell onClick={() => handleNavigate(col.id, col.name)}>{col.file_count}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} align="center">No collections found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={totalCount}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default CollectionOverview;
