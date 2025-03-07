// src/components/SideNav.js
import React from 'react';
import { List, ListItem, ListItemButton, ListItemText, ListItemIcon, Box, IconButton } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function SideNav({ menuItems, open, onToggle }) {
    const location = useLocation();

    return (
        <>
            {open && (  // This was already correct, keeping it
            <Box sx={{
                width: '250px',
                backgroundColor: '#d0d0d0',
                transition: 'width 0.3s ease, opacity 0.3s ease',
                position: 'sticky',
                top: '150px',
                height: 'calc(100vh - 150px - 30px)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
            }}>
                 <IconButton
                        onClick={onToggle}
                        sx={{
                            width: "100%",
                            justifyContent: 'flex-end',
                            paddingRight: '10px',
                        }}
                        size="large">
                        <ChevronLeftIcon />
                    </IconButton>
                <List sx={{ flexGrow: 1 }}>
                    {menuItems.map((item) => (
                        <ListItem key={item.path} disablePadding>
                            <ListItemButton
                                component={RouterLink}
                                to={item.path}
                                selected={location.pathname === item.path}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: 18,
                                        fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        )}
         {!open && ( // This was already correct, keeping it
                <Box sx={{
                    width: '60px', // Width when collapsed
                    backgroundColor: '#d0d0d0', //keep the bg color.
                    position: 'sticky',
                    transition: 'opacity 0.3s ease', //transition
                    top: '150px',
                    height: 'calc(100vh - 150px - 30px)',
                    display: 'flex',
                    justifyContent: 'center', // Center the button
                    alignItems: 'flex-start', // Align to the top

                }}>
                    <IconButton onClick={onToggle} size="large" >
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
            )}
        </>
    );
}

export default SideNav;