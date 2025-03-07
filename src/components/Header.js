import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { Link as RouterLink, useLocation } from "react-router-dom"; // Import useLocation
import Divider from "@mui/material/Divider";
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import useAuth from '../hooks/useAuth';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useNavigate } from 'react-router-dom';
import usePageTitle from "../hooks/usePageTitle";


export default function Header() {
    const { isAuthenticated, logout, username } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const location = useLocation(); // Get current location

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout(navigate);
        handleClose();
    };

    // Determine the section title based on the route
    let sectionTitle = "Home"; // Default title
    if (location.pathname.startsWith("/collections")) {
        sectionTitle = "Collections";
    } else if (location.pathname.startsWith("/providers")) {
        sectionTitle = "Providers";
    } else if (location.pathname.startsWith("/metrics")) {
        sectionTitle = "Metrics";
    } else if (location.pathname.startsWith("/users")) {
        sectionTitle = "Users";
    } else if (location.pathname.startsWith("/daac")) {
        sectionTitle = "DAAC";
    }
       else if (location.pathname.startsWith("/profile")) { //added profile
        sectionTitle = "Profile";
    }
    const pageTitle = usePageTitle(sectionTitle);

    return (
        <Box>
            <AppBar position="static" sx={{ height: "150px" }}>
                <Toolbar
                    sx={{
                        alignItems: "flex-start",
                        pt: 2,
                        justifyContent: "space-between",
                        flexDirection: "column",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            mb: 1,
                        }}
                    >
                        <img src="/nasa_logo.png" alt="NASA Logo" height="60" />
                        <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
                            <Box sx={{ mr: 5 }}>
                                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                                    CUE
                                </Typography>
                            </Box>
                            {/* Navigation Buttons */}
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Button color="inherit" component={RouterLink} to="/collections">Collections</Button>
                                <Button color="inherit" component={RouterLink} to="/providers">Providers</Button>
                                <Button color="inherit" component={RouterLink} to="/metrics">Metrics</Button>
                                <Button color="inherit" component={RouterLink} to="/users">Users</Button>
                                <Button color="inherit" component={RouterLink} to="/daac">DAAC</Button>
                            </Box>
                        </Box>

                        {/* User/Login Section */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            {isAuthenticated ? (
                                <>
                                    <IconButton
                                        size="large"
                                        aria-label="account of current user"
                                        aria-controls="menu-appbar"
                                        aria-haspopup="true"
                                        onClick={handleMenu}
                                        color="inherit"
                                        sx={{ padding: 0 }}
                                    >
                                        <AccountCircle />
                                        <Typography sx={{ ml: 1, textTransform: 'none' }}>{username}</Typography>
                                        <ArrowDropDownIcon />
                                    </IconButton>
                                    <Menu
                                        id="menu-appbar"
                                        anchorEl={anchorEl}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right',
                                        }}
                                        keepMounted
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
                                         <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>Profile</MenuItem>
                                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                                    </Menu>
                                </>
                            ) : (
                                <Button color="inherit" component={RouterLink} to="/login">Login</Button>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1, width: "100%" }} />
                    <Typography variant="h5" sx={{ fontWeight: "bold", textAlign: "left", ml: 11 }}>
                    {pageTitle}
                    </Typography>
                </Toolbar>
            </AppBar>
        </Box>
    );
}