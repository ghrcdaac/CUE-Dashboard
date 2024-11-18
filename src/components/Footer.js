import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

export default function Footer() {
  return (
    <Box
      sx={{
        bgcolor: '#004d40',
        color: '#d7ccc8',
        p: 0.2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >

 <Typography variant="body2" sx={{  fontWeight: 'bold', backgroundColor: '#d7ccc8', p: '3px', borderRadius: '4px', color: 'black', }}> 
 <span style={{ margin: '4px' }}>v1.0.0</span>


</Typography>

      <Link href="#" color="inherit">
        NASA Official:
      </Link>
      <Link href="#" color="inherit">
        Aaron Kaulfus
      </Link>
      <Link href="#" color="inherit">
        Web Privacy Policy
      </Link>
      <Link href="#" color="inherit">
        Data & Information Policy
      </Link>
      <Link href="#" color="inherit">
        Communications Policy
      </Link>
      <Link href="#" color="inherit">
        Freedom of Information Act
      </Link>
      <Link href="#" color="inherit">
        USA.gov
      </Link>
      <Link href="#" color="inherit">
        User Guide
      </Link>
    </Box>
  );
}