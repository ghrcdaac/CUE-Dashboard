import React, { useId, useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function ExportMenu({ onExport }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const menuId = useId();

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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        // Light-grey button on a white card: a border keeps its edge visible (WCAG 1.4.11).
        sx={{ ml: 1, mr: 1, border: "1px solid #8a8a8a" }}
      >
        Export
      </Button>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: anchorEl ? anchorEl.offsetWidth : undefined, // match button width
          },
        }}
      >
        <MenuItem onClick={() => handleExport("pdf")}>PDF</MenuItem>
        {/* CSV is the accessible version of every report (jsPDF can't make tagged PDFs). */}
        <MenuItem onClick={() => handleExport("csv")}>CSV (accessible)</MenuItem>
      </Menu>
    </>
  );
}
