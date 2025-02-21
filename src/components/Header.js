import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import Divider from "@mui/material/Divider"; 
import { Link as RouterLink } from "react-router-dom";


export default function Header({ isDrawerOpen, toggleDrawer, selectedMenu }) {
  return (
    <Box >
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
            {/* <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton> */}
            <img src="/nasa_logo.png" alt="NASA Logo" height="60" />
            <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}> {/* Changed to 'center' */}
              <Box sx={{ mr: 5 }}>
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
            <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end", // Align the Login button to the right
              width: "100%",
            }}
          >
            <Button color="inherit" component={RouterLink} to="/login">Login</Button>
          </Box>
          </Box>

          <Divider sx={{ my: 1, width: "100%"}} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              textAlign: "left",
              ml: 11,
          
            }}
          >
            {selectedMenu}
          </Typography>
        </Toolbar>
      </AppBar> 
    </Box>
  );
}