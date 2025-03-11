import React, { useState, useEffect  } from "react";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { Outlet, useLocation } from 'react-router-dom';
import SideNav from "../components/SideNav";
import InboxIcon from '@mui/icons-material/Inbox';
import DraftsIcon from '@mui/icons-material/Drafts';
import SendIcon from '@mui/icons-material/Send';
import usePageTitle from "../hooks/usePageTitle"; // Import

export default function Collections() {
    usePageTitle("Collections");
    const [open, setOpen] = useState(true);
    const location = useLocation();
    
    const handleToggle = () => {
        setOpen(!open);
    };

    const collectionsMenuItems = [
        { text: 'Overview', path: '/collections', icon: <InboxIcon /> },
        { text: 'Create Collection', path: '/collections/create', icon: <SendIcon /> },

    ];


    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
            <SideNav menuItems={collectionsMenuItems} open={open} onToggle={handleToggle} />

            <Box sx={{ flexGrow: 1, p: 3 }}>
                {/* Conditionally render Cards OR Outlet based on route */}
                {location.pathname === '/collections' || location.pathname === '/collections/' ? (
                    <Grid2 container spacing={3}>
                        <Grid2 item xs={12} sm={6} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" component="div">
                                        Collection 1
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: "primary.main" }}>
                                        Collection 1
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid2>
                        <Grid2 item xs={12} sm={6} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" component="div">
                                        Collection 2
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: "primary.main" }}>
                                        Collection 2
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid2>
                    </Grid2>
                ) : (
                     <Outlet key={location.pathname} />  
                )}
            </Box>
        </Box>
    );
}