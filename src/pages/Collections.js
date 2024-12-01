import React from "react";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function Collections({ setSelectedMenu }) {
  React.useEffect(() => {
    setSelectedMenu("Collections");
  }, [setSelectedMenu]);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid2 container spacing={3}>
        <Grid2 item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Collection 1
              </Typography>
              <Typography variant="h6" sx={{ color: "primary.main" }}>
                Collection 1
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Collection 2
              </Typography>
              <Typography variant="h6" sx={{ color: "primary.main" }}>
                Collection 2
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
       
      </Grid2>
    </Box>
  );
}