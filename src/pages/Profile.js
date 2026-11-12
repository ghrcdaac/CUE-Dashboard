// src/pages/Profile.js

import { useEffect, useMemo } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import Box from '@mui/material/Box';

// Import desired icons from Material-UI
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import usePrivileges from '../hooks/usePrivileges';

function Profile() {
    const { setMenuItems } = useOutletContext();
    const { hasPrivilege } = usePrivileges();

    const profileMenuItems = useMemo(() => {
        const items = [
            { text: 'Profile Info', path: '/profile', icon: <AccountCircleIcon /> },
        ];
        if (hasPrivilege('api-key:read')) {
            items.push({ text: 'API Keys', path: '/profile/api-keys', icon: <VpnKeyIcon /> });
        }
        return items;
    }, [hasPrivilege]);

    useEffect(() => {
        setMenuItems(profileMenuItems);
        // Clean up the menu when the component unmounts
        return () => setMenuItems([]);
    }, [setMenuItems, profileMenuItems]);

    return (
        <Box sx={{ flexGrow: 1 }}>
            {/* This Outlet will render the active sub-page (e.g., ProfileInfo, ApiKeys) */}
            <Outlet />
        </Box>
    );
}

export default Profile;