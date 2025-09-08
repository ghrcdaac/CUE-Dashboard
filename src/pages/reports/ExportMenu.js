import React, { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function ExportMenu({ onExport }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format) => {
    handleClose();
    onExport(format);
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        sx = {{ml:1, mr:1}}
      >
        Export
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => handleExport("pdf")}>PDF</MenuItem>
        {/* Later more can be added:
        <MenuItem onClick={() => handleExport("csv")}>CSV</MenuItem>
        */}
      </Menu>
    </>
  );
}
