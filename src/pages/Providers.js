import React from "react";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import useMenuSelection from '../hooks/useMenuSelection';

export default function Providers() {
  useMenuSelection("Providers");
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid2 container spacing={3}>
        <Grid2 item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Provider A
              </Typography>
              <Typography variant="h6" sx={{ color: "primary.main" }}>
                Provider A
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
        {/* Add more Grid2 items for other providers */}
      </Grid2>
    </Box>
  );
}