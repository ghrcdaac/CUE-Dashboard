import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import usePageTitle from '../../hooks/usePageTitle'; // Import

function RejectedRequests() {
    
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Rejected Requests</Typography>
      <Typography variant="body1">
        This is a placeholder for the Rejected Requests content.
      </Typography>
    </Box>
  );
}

export default RejectedRequests;