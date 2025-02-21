import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
// import MenuIcon from "@mui/icons-material/Menu"; // Not used, based on your request
import { Link as RouterLink } from "react-router-dom";
import Divider from "@mui/material/Divider";
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import useAuth from '../hooks/useAuth'; // Import useAuth
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'; // Import down arrow
import { useNavigate } from 'react-router-dom'; // Import useNavigate


export default function Header({ selectedMenu }) { // isDrawerOpen, toggleDrawer removed
    const { isAuthenticated, logout, username } = useAuth(); // Use the hook!
    const [anchorEl, setAnchorEl] = useState(null); // State for menu anchor
    const navigate = useNavigate(); // Get the navigate function

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout(navigate); // Pass navigate to logout
        handleClose();    // Close the menu
    };

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

                        {/* User/Login Section - Aligned Right */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-end", // Right-align
                                alignItems: "center",
                                width: "100%", // Take full width to push to the right
                            }}
                        >
                            {isAuthenticated ? (
                                <>
                                    {/* User Avatar and Dropdown */}
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
                                // Login Button (if not authenticated)
                                <Button color="inherit" component={RouterLink} to="/login">Login</Button>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1, width: "100%" }} />
                    <Typography variant="h5" sx={{ fontWeight: "bold", textAlign: "left", ml: 11 }}>
                        {selectedMenu}
                    </Typography>
                </Toolbar>
            </AppBar>
        </Box>
    );
}