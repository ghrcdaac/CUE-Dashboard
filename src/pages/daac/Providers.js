// src/pages/daac/Providers.js
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import usePageTitle from '../../hooks/usePageTitle'; // Import

function Providers() {
    usePageTitle("DAAC Providers"); // Set title
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">DAAC Providers</Typography>
      <Typography variant="body1">
        This is a placeholder for the DAAC Providers content.
      </Typography>
    </Box>
  );
}

export default Providers;