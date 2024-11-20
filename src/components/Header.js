import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router-dom";
import Divider from "@mui/material/Divider";

export default function Header({
    isDrawerOpen,
    toggleDrawer,
    selectedMenu,
    onMenuClick, // Make sure onMenuClick is passed as a prop
  }) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ height: "150px" }}>
        <Toolbar
          sx={{
            alignItems: "flex-start",
            pt: 2,
            justifyContent: "space-between",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>
            <img src="/nasa_logo.png" alt="NASA Logo" height="60" />
            <Box sx={{ display: "flex", alignItems: "flex-start", ml: 2 }}>
              <Box sx={{ mr: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  CUE
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Link
                  to="/collections"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontFamily: "Arial, sans-serif",
                    marginRight: "20px",
                  }}
                >
                  <Button color="inherit">Collections</Button>
                </Link>
                <Link
                  to="/providers"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontFamily: "Arial, sans-serif",
                    marginRight: "20px",
                  }}
                >
                  <Button color="inherit">Providers</Button>
                </Link>
                <Link
                  to="/metrics"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontFamily: "Arial, sans-serif",
                    marginRight: "20px",
                  }}
                >
                  <Button color="inherit">Metrics</Button>
                </Link>
                <Link
                  to="/users"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontFamily: "Arial, sans-serif",
                    marginRight: "20px",
                  }}
                >
                  <Button color="inherit">Users</Button>
                </Link>
                <Link
                  to="/daac"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontFamily: "Arial, sans-serif",
                    marginRight: "20px",
                  }}
                >
                  <Button color="inherit">DAAC</Button>
                </Link>
              </Box>
            </Box>
            <Button color="inherit">Login</Button>
          </Box>
          <Divider sx={{ my: 2, width: "100%",  }} />
          <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "left", ml: 7 }}>
            {selectedMenu}
          </Typography>
          
        </Toolbar>
      </AppBar>
    </Box>
  );
}