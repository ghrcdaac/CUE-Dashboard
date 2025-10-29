// src/pages/Profile.js

import { useEffect } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import Box from '@mui/material/Box';

// Import desired icons from Material-UI
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const profileMenuItems = [
    { text: 'Profile Info', path: '/profile', icon: <AccountCircleIcon /> },
    { text: 'API Keys', path: '/profile/api-keys', icon: <VpnKeyIcon /> },
];

function Profile() {
    // Define the new, ordered side navigation menu for the profile section


    const { setMenuItems } = useOutletContext();

    useEffect(() => {
        setMenuItems(profileMenuItems);
        // Clean up the menu when the component unmounts
        return () => setMenuItems([]);
    }, [setMenuItems]);

    return (
        <Box sx={{ flexGrow: 1 }}>
            {/* This Outlet will render the active sub-page (e.g., ProfileInfo, ApiKeys) */}
            <Outlet />
        </Box>
    );
}

export default Profile;