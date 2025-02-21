// src/pages/Profile.js
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMenuSelection from '../hooks/useMenuSelection';

function Profile() {
    useMenuSelection("Profile");
    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Profile Page
            </Typography>
            <Typography>
                This is a placeholder for the user profile page.  
            </Typography>
        </Box>
    );
}

export default Profile;