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

/** Sub-page names for the browser tab title; the section comes from the URL prefix. */
const PAGE_NAMES = {
    "/collections/create": "Collection Overview",
    "/collections/files": "Files",
    "/files-by-status": "Files by Status",
    "/files-by-cost": "Cost",
    "/global-metrics": "Global Metrics",
    "/users/pending-requests": "Pending Requests",
    "/users/spam-requests": "Spam Requests",
    "/profile/api-keys": "API Keys",
};

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
    else if (location.pathname.startsWith("/files-by-") || location.pathname.startsWith("/global-metrics")) sectionTitle = "Metrics";
    else if (location.pathname.startsWith("/users")) sectionTitle = "Users";
    else if (location.pathname.startsWith("/daac")) sectionTitle = "DAAC";
    else if (location.pathname.startsWith("/profile")) sectionTitle = "Profile";
    else if (location.pathname.startsWith("/sitemap")) sectionTitle = "Site map";

    // Browser tab title names the exact page (WCAG 2.4.2), e.g. "CUE - Users - Pending Requests".
    const pageName = PAGE_NAMES[location.pathname.replace(/\/+$/, "")];
    usePageTitle(pageName ? `${sectionTitle} - ${pageName}` : sectionTitle);

    const navLink = (to, label) => {
        const current = location.pathname === to || location.pathname.startsWith(`${to}/`);
        return (
            <Button
                color="inherit"
                component={RouterLink}
                to={to}
                aria-current={current ? "page" : undefined}
                sx={current ? { textDecoration: "underline", textUnderlineOffset: "6px", textDecorationThickness: "2px" } : undefined}
            >
                {label}
            </Button>
        );
    };

    return (
        <Box>
            <AppBar position="static" component="header" sx={{ minHeight: "150px" }}>
                <Toolbar sx={{ alignItems: "flex-start", pt: 2, pb: 1, justifyContent: "space-between", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: 'space-between', alignItems: "center", width: "100%", mb: 1, flexWrap: "wrap", rowGap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
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
                                <img src="/nasa_logo.png" alt="NASA Logo" width="72" height="60" style={{ marginRight: '16px' }} />
                                <Typography variant="h4" component="span" sx={{ fontWeight: "bold" }}>CUE</Typography>
                            </Box>
                            
                            <Box component="nav" aria-label="Main" sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                                {hasPrivilege("collection:page") && navLink("/collections", "Collections")}
                                {hasPrivilege("provider:read") && navLink("/providers", "Providers")}
                                {hasPrivilege("metrics:read") && navLink("/metrics", "Metrics")}
                                {hasPrivilege("user:page") && navLink("/users", "Users")}
                                {hasPrivilege("egress:read") && navLink("/daac", "DAAC")}
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                            {isAuthenticated ? (
                                <>
                                    {user?.ngroups && user.ngroups.length > 0 && (
                                        user.ngroups.length === 1 ? (
                                            <Typography sx={{ color: 'white', mr: 2, border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: 1, px: 1.5, py: 0.5, fontSize: '0.875rem' }}>
                                                {typeof user.ngroups[0] === 'object' ? user.ngroups[0].short_name : user.ngroups[0]}
                                            </Typography>
                                        ) : (
                                            <FormControl sx={{ m: 1, minWidth: 120, mr: 2 }} size="small">
                                                <Select
                                                    inputProps={{ 'aria-label': 'Active DAAC group' }}
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
                                        )
                                    )}
                                    <IconButton size="large" aria-label={`Account menu for ${user?.username || user?.cueusername || user?.name || 'user'}`}aria-controls={anchorEl ? "menu-appbar" : undefined} aria-haspopup="menu" aria-expanded={Boolean(anchorEl)} onClick={handleMenu} color="inherit" sx={{ padding: 0 }}>
                                        <AccountCircle aria-hidden="true" />
                                        <Typography sx={{ ml: 1, textTransform: 'none' }}>{user?.username || user?.cueusername}</Typography>
                                        <ArrowDropDownIcon aria-hidden="true" />
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
                    <Typography variant="h5" component="h1" sx={{ fontWeight: "bold", textAlign: "left", ml: 11 }}>
                        {sectionTitle}
                    </Typography>
                </Toolbar>
            </AppBar>
        </Box>
    );
}