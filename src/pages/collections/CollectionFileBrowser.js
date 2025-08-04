// src/pages/CollectionFileBrowser.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, Paper, TableContainer,
  TablePagination, CircularProgress, TextField,
  Autocomplete, Card, CardContent
} from '@mui/material';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { listFilesForCollection, listCollectionsWithPagination } from '../../api/collectionApi';

function CollectionFileBrowser() {
  const { accessToken } = useAuth();
  const ngroupId = localStorage.getItem('CUE_ngroup_id');

  // Collection state
  const [collections, setCollections] = useState([]);
  const [collectionsTotal, setCollectionsTotal] = useState(0);
  const [searchParams] = useSearchParams();
  const initialCollectionId = searchParams.get('collection_id');
  const [selectedCollectionId, setSelectedCollectionId] = useState(initialCollectionId || '');
  const initialCollectionName = searchParams.get('collection_name');
  const [selectedCollection, setSelectedCollection] = useState(
    initialCollectionId ? { id: initialCollectionId, short_name: initialCollectionName } : null
  );
  const collectionsPageSize = 10;
  const [nextCollectionPage, setNextCollectionPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState(new Set());
  const [isFetchingCollections, setIsFetchingCollections] = useState(false);

  // File state
  const [files, setFiles] = useState([]);
  const [filesTotal, setFilesTotal] = useState(0);
  const [filesPage, setFilesPage] = useState(0);
  const [filesPageSize, setFilesPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Fetch paginated collections
  const fetchCollections = useCallback(async (page = 1) => {
    if (isFetchingCollections || loadedPages.has(page)) return;

    setIsFetchingCollections(true);
    try {
      const params = {
        ngroup_id: ngroupId,
        page,
        page_size: collectionsPageSize
      };
      const data = await listCollectionsWithPagination(params, accessToken);

      if (data && Array.isArray(data.collections) && data.collections.length > 0) {
        setCollections((prev) => [...prev, ...data.collections]);
        setCollectionsTotal(data.total_count || 0);
        setLoadedPages((prev) => new Set(prev).add(page));
        setNextCollectionPage(page + 1);
      }
    } catch (error) {
      toast.error('Failed to load collections');
    } finally {
      setIsFetchingCollections(false);
    }
  }, [ngroupId, accessToken, collectionsPageSize, loadedPages, isFetchingCollections]);

  // Fetch files in the selected collection
  const fetchFiles = useCallback(async () => {
    if (!selectedCollectionId) return;
    setLoading(true);
    try {
      const data = await listFilesForCollection(
        selectedCollectionId,
        ngroupId,
        filesPage + 1,
        filesPageSize,
        accessToken
      );
      setFiles(data.files || []);
      setFilesTotal(data.total_count || 0);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [selectedCollectionId, ngroupId, accessToken, filesPage, filesPageSize]);

  // Initial load of collections
  useEffect(() => {
    fetchCollections(1);
  }, [fetchCollections]);

  // Load files when collection selected
  useEffect(() => {
    if (initialCollectionId || selectedCollectionId) {
      fetchFiles();
    }
  }, [initialCollectionId, fetchFiles, selectedCollectionId]);

  // Sync selected collection with URL param
  useEffect(() => {
    if (initialCollectionId && collections.length > 0) {
      const match = collections.find((c) => c.id === initialCollectionId);
      if (match) {
        setSelectedCollectionId(initialCollectionId);
      }
    }
  }, [collections, initialCollectionId]);

  const handleCollectionChange = (id) => {
    setSelectedCollectionId(id);
    setFilesPage(0);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Card sx={{ marginBottom: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Files in Collection
            </Typography>

            <Autocomplete
              size="small"
              sx={{ width: 250, mb: 2 }}
              options={collections}
              getOptionLabel={(option) => option.short_name || ''}
              value={
                collections.find(c => c.id === selectedCollection?.id) || selectedCollection || null
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(e, newValue) => {
                if (newValue) {
                  setSelectedCollection(newValue);
                  handleCollectionChange(newValue.id);
                } else {
                  setSelectedCollection(null);
                  setSelectedCollectionId('');
                  setFiles([]);
                  setFilesTotal(0);
                }
              }}
              onOpen={() => {
                if (collections.length === 0) fetchCollections(1);
              }}
              ListboxProps={{
                style: { maxHeight: 200, overflow: 'auto' }, // ✅ force scroll
                onScroll: (event) => {
                  const listboxNode = event.currentTarget;
                  const atBottom =
                    listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 5;

                  if (atBottom && collections.length < collectionsTotal && !isFetchingCollections) {
                    fetchCollections(nextCollectionPage);
                  }
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Collection" variant="outlined" />
              )}
            />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#E5E8EB' }}>
                        <TableCell>File Name</TableCell>
                        <TableCell>File Size</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {files.length > 0 ? (
                        files.map((file, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{file.name}</TableCell>
                            <TableCell>{file.size_bytes}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            No files found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={filesTotal}
                  page={filesPage}
                  onPageChange={(e, newPage) => setFilesPage(newPage)}
                  rowsPerPage={filesPageSize}
                  onRowsPerPageChange={(e) => {
                    setFilesPageSize(parseInt(e.target.value, 10));
                    setFilesPage(0);
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

export default CollectionFileBrowser;
