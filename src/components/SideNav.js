import * as React from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useNavigate } from "react-router-dom";

export default function SideNav({ isDrawerOpen, toggleDrawer, selectedMenu }) {
  const navigate = useNavigate();

  const list = () => (
<Box
      sx={{
        width: 250,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        mt: "64px",
      }}
      role="presentation"
      onKeyDown={toggleDrawer}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={toggleDrawer}> 
            <ListItemIcon>
              <ChevronLeftIcon />
            </ListItemIcon>
          </ListItemButton>
        </ListItem>

        {/* Conditionally render submenus based on selectedMenu */}
        {selectedMenu === "DAAC" && (
          <>
            <ListItem key="DAAC-Submenu-1" disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <InboxIcon />
                </ListItemIcon>
                <ListItemText primary="DAAC Submenu 1" />
              </ListItemButton>
            </ListItem>
            <ListItem key="DAAC-Submenu-2" disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary="DAAC Submenu 2" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        {selectedMenu === "Collections" && (
          <>
            <ListItem key="Collections-Submenu-1" disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <InboxIcon />
                </ListItemIcon>
                <ListItemText primary="Collections Submenu 1" />
              </ListItemButton>
            </ListItem>
            <ListItem key="Collections-Submenu-2" disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary="Collections Submenu 2" />
              </ListItemButton>
            </ListItem>
          </>
        )}
       

      </List>
    </Box>
  );

  return (
    <div>
      <Drawer
        variant="persistent"
        open={isDrawerOpen} // Open drawer if isDrawerOpen is true
        sx={{
          "& .MuiDrawer-paper": {
            top: "150px", // Adjust top position to account for the updated header height
            height: "calc(100vh - 130px)", // Adjust height to account for the updated header height
          },
        }}
      >
        {list()}
      </Drawer>
    </div>
  );
}