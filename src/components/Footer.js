import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

export default function Footer() {
  return (
    <Box
      sx={{
        bgcolor: '#19577F',
        color: '#f0f0f0',
        p: 0.2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >

 <Typography variant="body2" sx={{  fontWeight: 'bold', backgroundColor: '#d7ccc8', p: '3px', borderRadius: '4px', color: 'black', }}> 
 <span style={{ margin: '4px' }}>v0.0.4</span>


</Typography>

<Typography variant="body2"> 
        NASA Official: Doug Newman 
      </Typography>

      <Typography variant="body2">
         <Link href="https://www.nasa.gov/foia/" color="inherit" target="_blank" rel="noopener"> FOIA</Link> 
      </Typography>

      <Typography variant="body2">
         <Link href="https://www.nasa.gov/privacy/" color="inherit" target="_blank" rel="noopener">NASA Privacy Policy</Link>
      </Typography>

      <Typography variant="body2">
         <Link href="https://USA.gov" color="inherit" target="_blank" rel="noopener"> USA.gov</Link>
      </Typography>
    </Box>
  );
}