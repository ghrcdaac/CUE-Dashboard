import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import { config } from '../config';
import { VisuallyHidden } from './a11y';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#19577F',
        color: '#ffffff', // 7.75:1 on the brand blue (AAA)
        p: 0.2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        columnGap: 10,
        rowGap: 0.5,
      }}
    >

 <Typography variant="body2" sx={{  fontWeight: 'bold', backgroundColor: '#d7ccc8', p: '3px', borderRadius: '4px', color: 'black', }}> 
 <span style={{ margin: '4px' }}>v{config.version}</span>


</Typography>

<Typography variant="body2">
        NASA Official: Doug Newman
      </Typography>

      <Typography variant="body2">
         <Link component={RouterLink} to="/sitemap" color="inherit">Site map</Link>
      </Typography>

      <Typography variant="body2">
         <Link href="https://www.nasa.gov/foia/" color="inherit" target="_blank" rel="noopener"> FOIA<VisuallyHidden> (opens in a new tab)</VisuallyHidden></Link>
      </Typography>

      <Typography variant="body2">
         <Link href="https://www.nasa.gov/privacy/" color="inherit" target="_blank" rel="noopener">NASA Privacy Policy<VisuallyHidden> (opens in a new tab)</VisuallyHidden></Link>
      </Typography>

      <Typography variant="body2">
         <Link href="https://USA.gov" color="inherit" target="_blank" rel="noopener"> USA.gov<VisuallyHidden> (opens in a new tab)</VisuallyHidden></Link>
      </Typography>
    </Box>
  );
}