// src/pages/collections/Dummy1.js
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import usePageTitle from '../../hooks/usePageTitle'; // Import

function CreateCollection() {


  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Create Collection Page </Typography>
      <Typography variant="body1">
        This is a placeholder for Create Collection content.
      </Typography>
    </Box>
  );
}

export default CreateCollection;