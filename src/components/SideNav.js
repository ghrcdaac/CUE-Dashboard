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
 // Use ChevronLeftIcon
import { useNavigate } from "react-router-dom";

export default function SideNav({ isDrawerOpen, toggleDrawer }) {
  const navigate = useNavigate();

  const list = () => (
    <Box
      sx={{
        width: 250,
        display: "flex",
        flexDirection: "column",
      }}
      role="presentation"
      onClick={toggleDrawer}
      onKeyDown={toggleDrawer}
    >

             
      <IconButton
        onClick={toggleDrawer}
        sx={{ alignSelf: "flex-end", mb: 2, mr: 1 }}
      >
        <ChevronLeftIcon /> {/* Use ChevronLeftIcon */}
      </IconButton>
      <List sx={{ flexGrow: 1 }}>
        {/* Rest of your list items */}
        <ListItem key="Home" disablePadding onClick={() => navigate("/")}>
          <ListItemButton>
            <ListItemIcon>
              <InboxIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>
        <ListItem   
 key="About" disablePadding onClick={() => navigate("/about")}>
          <ListItemButton>
            <ListItemIcon>
              <MailIcon />
            </ListItemIcon>
            <ListItemText primary="About" />
          </ListItemButton>
        </ListItem>
      </List>


    </Box>
  );

  return (
    <div>
      <Drawer variant="persistent" open={isDrawerOpen}>
        {list()}
      </Drawer>
    </div>
  );
}