import React from "react";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function DAAC({ setSelectedMenu }) {
  React.useEffect(() => {
    setSelectedMenu("DAAC");
  }, [setSelectedMenu]);

  const createData = (id, type, path, config, ngroup_id) => {
    return { id, type, path, config, ngroup_id };
  };

  const rows = [
    createData("1234abcd", "S3", "s3://bucket1/path1", "File Size: 10MB", 101),
    createData("5678efgh", "S3", "s3://bucket2/path2", "File Size: 20MB", 102),
    createData("9101ijkl", "S3", "s3://bucket3/path3", "File Size: 15MB", 103),
    createData("1121mnop", "S3", "s3://bucket4/path4", "File Size: 25MB", 104),
    createData("3141qrst", "S3", "s3://bucket5/path5", "File Size: 30MB", 105),
  ];

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflow: "hidden",
      }}
    >
      <Grid2 container spacing={2} direction="column">
        <Grid2 item xs={12}>
          <Card>
            <CardContent sx={{ pb: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h5">Egress</Typography>
                <Button variant="contained" color="success">
                  Add
                </Button>
              </Box>
            </CardContent>
            <CardContent sx={{ overflow: "auto" }}>
              <TableContainer component={Paper}>
                <Table
                  stickyHeader
                  sx={{ minWidth: 650 }}
                  aria-label="example table"
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                        ID
                      </TableCell>
                      <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                        Type
                      </TableCell>
                      <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                        Path
                      </TableCell>
                      <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                        Config
                      </TableCell>
                      <TableCell sx={{ bgcolor: "primary.main", color: "white" }}>
                        ngroup_id
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {row.id}
                        </TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.path}</TableCell>
                        <TableCell>{row.config}</TableCell>
                        <TableCell>{row.ngroup_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </Box>
  );
}
