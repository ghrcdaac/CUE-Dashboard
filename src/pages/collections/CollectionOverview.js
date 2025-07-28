// src/pages/CollectionOverview.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, TablePagination, Card, CardContent,
  CircularProgress
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
  const ngroupId = localStorage.getItem('CUE_ngroup_id');
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (collectionId) => {
    navigate(`/collections/files?collection_id=${collectionId}`);
  };

  const fetchCollectionOverview = useCallback(async () => {
    if (!ngroupId) {
        toast.error("Ngroup ID not found. Please log in again.");
        logout(); // optional
        return;
    }

    setLoading(true);
    try {
      const params = {
       ngroup_id: ngroupId,
       page: page +1,
       page_size: rowsPerPage,
    }
      const data = await collectionFilesCount(params,accessToken);

      setCollections(data.collections || []);
      setTotalCount(data.total_count || 0);
    } catch (error) {
      toast.error("Failed to load collection overview");
    } finally {
      setLoading(false);
    }
  }, [ngroupId, page, rowsPerPage]);

  useEffect(() => {
    fetchCollectionOverview();
  }, [fetchCollectionOverview]);

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
                        <TableCell>Collection Name</TableCell>
                        <TableCell>File Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                        {collections.length > 0 ? (
                            collections.map((col) => (
                            <TableRow key={col.id} hover sx={{ cursor: 'pointer' }}>
                                <TableCell onClick={() => handleNavigate(col.id)}>{col.name}</TableCell>
                                <TableCell onClick={() => handleNavigate(col.id)}>{col.file_count}</TableCell>
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
