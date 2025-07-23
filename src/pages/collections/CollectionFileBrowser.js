import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, Paper, TableContainer,
  TablePagination, CircularProgress, TextField, Autocomplete,Card, CardContent
} from '@mui/material';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { findFilesByCollection } from '../../api/collectionApi';

function CollectionFileBrowser() {
  const { accessToken } = useAuth();
  const ngroupId = localStorage.getItem('CUE_ngroup_id');

  // Collection state
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [collectionsPage, setCollectionsPage] = useState(0);
  const collectionsPageSize = 5;

  // File state
  const [files, setFiles] = useState([]);
  const [filesTotal, setFilesTotal] = useState(0);
  const [filesPage, setFilesPage] = useState(0);
  const [filesPageSize, setFilesPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [nextCollectionPage, setNextCollectionPage] = useState(1); // Start at page 1
  const [loadedPages, setLoadedPages] = useState(new Set());
  const [isFetchingCollections, setIsFetchingCollections] = useState(false);

  // Fetch paginated collections
 const fetchCollections = useCallback(async (page) => {
  if (isFetchingCollections || loadedPages.has(page)) return;

  setIsFetchingCollections(true);
  try {
    const res = await fetch(
      `http://localhost:8000/v1/collection?ngroup_id=${ngroupId}&page=${page}&page_size=${collectionsPageSize}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      setCollections((prev) => [...prev, ...data]);
      setLoadedPages((prev) => new Set(prev).add(page));
      setNextCollectionPage(page + 1);
    }
  } catch (error) {
    toast.error("Failed to load collections");
  } finally {
    setIsFetchingCollections(false); // ✅ reset flag
  }
}, [ngroupId, accessToken, collectionsPageSize, loadedPages, isFetchingCollections]);


  // Fetch files in the selected collection
  const fetchFiles = useCallback(async () => {
    if (!selectedCollectionId) return;
    setLoading(true);
    const params = {
       ngroup_id: ngroupId,
       page: filesPage +1,
       page_size: filesPageSize,
    }
    try {
      const data = await findFilesByCollection(selectedCollectionId,params,accessToken);
      setFiles(data[0] || []);
      setFilesTotal(data.total_count || 0);
    } catch (error) {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [selectedCollectionId, ngroupId, accessToken, filesPage, filesPageSize]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleCollectionChange = (id) => {
    setSelectedCollectionId(id);
    setFilesPage(0);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
      <Box sx={{ flexGrow: 1}}>
        <Card sx={{ marginBottom: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Files in Collection</Typography>

            <Autocomplete
              size="small"
              sx={{ width: 250, mb: 2 }} // explicitly set width
              options={collections}
              getOptionLabel={(option) => option.short_name || ''}
              value={collections.find(c => c.id === selectedCollectionId) || null}
              onChange={(e, newValue) => {
                if (newValue) {
                  handleCollectionChange(newValue.id);
                } else {
                  setSelectedCollectionId('');
                  setFiles([]);
                  setFilesTotal(0);
                }
              }}
              onOpen={() => {
                // Optional: load if not already
                if (collections.length === 0) fetchCollections();
              }}
              ListboxProps={{
                onScroll: (event) => {
                  const listboxNode = event.currentTarget;
                  const atBottom = listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 1;

                  if (atBottom) {
                    fetchCollections(nextCollectionPage); // now protected by flag
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
                      <TableRow sx={{ bgcolor: "#E5E8EB" }}>
                        <TableCell>File Name</TableCell>
                        <TableCell>File Size</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {files.length > 0 ? (
                        files.map((file, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{file.file_name}</TableCell>
                            <TableCell>{file.file_size}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} align="center">No files found</TableCell>
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
