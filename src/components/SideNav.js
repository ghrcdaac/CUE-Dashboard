// src/components/SideNav.js
import React from 'react';
import { List, ListItem, ListItemButton, ListItemText, ListItemIcon, Box, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const SIDENAV_WIDTH_OPEN = 250;
const SIDENAV_WIDTH_CLOSED = 60;

function SideNav({ menuItems, open, onToggle }) {
    const location = useLocation();

    return (
        <Box
            component="nav"
            id="section-nav"
            aria-label="Section"
            sx={{
                width: open ? `${SIDENAV_WIDTH_OPEN}px` : `${SIDENAV_WIDTH_CLOSED}px`,
                transition: 'width 0.2s ease-in-out',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                flexShrink: 0, // Prevents the sidebar from shrinking
                backgroundColor: '#d0d0d0',
                height: '100%', // Fills the height of its parent container
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <IconButton
                onClick={onToggle}
                aria-label={open ? 'Collapse section menu' : 'Expand section menu'}
                aria-expanded={open}
                sx={{
                    justifyContent: open ? 'flex-end' : 'center',
                    paddingRight: open ? '10px' : 0,
                    '&:hover': {
                        backgroundColor: 'transparent',
                    },
                }}
                size="large"
            >
                {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>

            <List sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {menuItems && menuItems.map((item) => (
                    <ListItem key={item.path} disablePadding>
                        <Tooltip title={open ? '' : item.text} placement="right">
                        <ListItemButton
                            component={RouterLink}
                            to={item.path}
                            selected={location.pathname === item.path}
                            aria-current={location.pathname === item.path ? 'page' : undefined}
                            aria-label={open ? undefined : item.text}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            {open && (
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: 18,
                                        fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                                    }}
                                />
                            )}
                        </ListItemButton>
                        </Tooltip>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

export default SideNav;