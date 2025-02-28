import React from "react";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";


export default function Home() {

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "flex-start", 
        width: "100%",
        paddingTop: "2rem", 
      }}
    >
      <Grid2 
        container 
        spacing={3} 
        rowSpacing={4} 
        sx={{
          width: "80%", 
          justifyContent: "center",
        }}
      >
        <Grid2  xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Files Uploaded
              </Typography>
              <Typography variant="h3" sx={{ color: "primary.main" }}>
                123
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2  xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Scanned
              </Typography>
              <Typography variant="h3" sx={{ color: "primary.main" }}>
                87
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2  xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Blocked
              </Typography>
              <Typography variant="h3" sx={{ color: "error.main" }}>
                36
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </Box>
  );
}
