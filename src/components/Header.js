import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { Link as RouterLink, useLocation } from "react-router-dom";
import Divider from "@mui/material/Divider";
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import useAuth from '../hooks/useAuth';
import usePageTitle from "../hooks/usePageTitle";
import usePrivileges from "../hooks/usePrivileges";
import { resetCache } from '../app/reducers/dataCacheSlice';

export default function Header() {
    const { isAuthenticated, user, logout, activeNgroupId, setActiveNgroup } = useAuth();
    const { hasPrivilege } = usePrivileges();
    const dispatch = useDispatch();
    
    const [anchorEl, setAnchorEl] = useState(null);
    const location = useLocation();

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleLogout = () => {
        logout();
        handleClose();
    };

    const handleNgroupChange = (event) => {
        const newNgroupId = event.target.value;
        setActiveNgroup(newNgroupId);
        dispatch(resetCache());
    };

    let sectionTitle = "Home";
    if (location.pathname.startsWith("/collections")) sectionTitle = "Collections";
    else if (location.pathname.startsWith("/providers")) sectionTitle = "Providers";
    else if (location.pathname.startsWith("/metrics")) sectionTitle = "Metrics";
    else if (location.pathname.startsWith("/users")) sectionTitle = "Users";
    else if (location.pathname.startsWith("/daac")) sectionTitle = "DAAC";
    else if (location.pathname.startsWith("/profile")) sectionTitle = "Profile";
    
    usePageTitle(sectionTitle);

    return (
        <Box>
            <AppBar position="static" sx={{ height: "150px" }}>
                <Toolbar sx={{ alignItems: "flex-start", pt: 2, justifyContent: "space-between", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: 'space-between', alignItems: "center", width: "100%", mb: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {/* UPDATED: This Box is now a clickable link to the home page */}
                            <Box
                                component={RouterLink}
                                to="/"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    mr: 5
                                }}
                            >
                                <img src="/nasa_logo.png" alt="NASA Logo" height="60" style={{ marginRight: '16px' }} />
                                <Typography variant="h4" sx={{ fontWeight: "bold" }}>CUE</Typography>
                            </Box>
                            
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                {hasPrivilege("collection:read") && <Button color="inherit" component={RouterLink} to="/collections">Collections</Button>}
                                {hasPrivilege("provider:read") && <Button color="inherit" component={RouterLink} to="/providers">Providers</Button>}
                                {hasPrivilege("metrics:read") && <Button color="inherit" component={RouterLink} to="/metrics">Metrics</Button>}
                                {hasPrivilege("user:read") && <Button color="inherit" component={RouterLink} to="/users">Users</Button>}
                                {hasPrivilege("egress:read") && <Button color="inherit" component={RouterLink} to="/daac">DAAC</Button>}
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {isAuthenticated ? (
                                <>
                                    {user?.ngroups && user.ngroups.length > 1 && (
                                        <FormControl sx={{ m: 1, minWidth: 120, mr: 2 }} size="small">
                                            <Select
                                                value={activeNgroupId || ''}
                                                onChange={handleNgroupChange}
                                                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '.MuiSvgIcon-root': { color: 'white' } }}
                                            >
                                                {user.ngroups.map((ngroup) => (
                                                    <MenuItem key={ngroup.id} value={ngroup.id}>
                                                        {ngroup.short_name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                    <IconButton size="large" aria-controls="menu-appbar" aria-haspopup="true" onClick={handleMenu} color="inherit" sx={{ padding: 0 }}>
                                        <AccountCircle />
                                        <Typography sx={{ ml: 1, textTransform: 'none' }}>{user?.username}</Typography>
                                        <ArrowDropDownIcon />
                                    </IconButton>
                                    <Menu id="menu-appbar" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
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
                        {sectionTitle}
                    </Typography>
                </Toolbar>
            </AppBar>
        </Box>
    );
}