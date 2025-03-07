import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import usePageTitle from '../../hooks/usePageTitle'; // Import

function PendingRequests() {
   
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Pending Requests</Typography>
      <Typography variant="body1">
        This is a placeholder for the Pending Requests content.
      </Typography>
    </Box>
  );
}

export default PendingRequests;