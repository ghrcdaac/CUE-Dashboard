// src/pages/Profile.js
import React, {useEffect} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {Outlet, useOutletContext } from 'react-router-dom';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';


function Profile() {

    const profileMenuItems = [
        { text: 'Notification Preferences', path: '/profile/notification', icon: <MarkEmailUnreadIcon /> },
    ];

    const { setMenuItems } = useOutletContext();

    useEffect(() => {
            setMenuItems(profileMenuItems);
            // Optional: clear the menu when the page is left
            return () => setMenuItems([]);
        }, [setMenuItems]);

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Outlet/>
        </Box>
    );
}

export default Profile;