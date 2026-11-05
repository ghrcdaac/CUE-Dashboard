// src/theme.js
// One MUI theme for every page (the auth pages used to build their own copy).
// Colors meet WCAG 2.1 AAA contrast (1.4.6): text >= 7:1 on white and on the page
// background (#f4f6f8); control borders >= 3:1 (1.4.11).
import { createTheme } from "@mui/material/styles";

// Input borders: MUI's default (black at 23%) is only 1.7:1 on white.
const INPUT_BORDER = "#8a8a8a"; // 3.45:1 on white

// Secondary text: MUI's default (black at 60%) is 5.7:1. At 70% it is 8.5:1.
const TEXT_SECONDARY = "rgba(0, 0, 0, 0.7)";

const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F", // white text 7.75:1
        },
        secondary: {
            main: "#f0f0f0",
        },
        text: {
            secondary: TEXT_SECONDARY,
        },
        // MUI's defaults give white text 3.1-5.1:1; these give 7.4:1 or more.
        error: {
            main: "#a31515", // 7.85:1 (MUI default #d32f2f: 4.98:1)
            contrastText: "#ffffff",
        },
        success: {
            main: "#1b5e20", // 7.87:1 (MUI default #2e7d32: 5.13:1)
            contrastText: "#ffffff",
        },
        warning: {
            main: "#8a4000", // 7.46:1 (MUI default #ed6c02: 3.1:1)
            contrastText: "#ffffff",
        },
        info: {
            main: "#01579b", // 7.40:1 (MUI default #0288d1: 3.86:1)
            contrastText: "#ffffff",
        },
    },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                notchedOutline: {
                    borderColor: INPUT_BORDER,
                },
            },
        },
        // Placeholder text: MUI's default (42% opacity) is 3.0:1, below even AA.
        MuiInputBase: {
            styleOverrides: {
                input: {
                    "&::placeholder": { color: TEXT_SECONDARY, opacity: 1 },
                },
            },
        },
    },
});

/**
 * A strong, consistent keyboard focus indicator (WCAG 2.4.7, and 2.4.13 at AAA):
 * a 3px outline on whatever has keyboard focus. MUI's own focus ripple is faint.
 * Text fields keep MUI's 2px focus border instead (an outline would double it), and on
 * the dark blue header and footer the outline is white.
 */
// The "body" prefix makes these win over MUI's own `outline: 0` on buttons (same
// single-class specificity otherwise, and MUI's styles load later).
export const focusStyles = {
    "body *:focus-visible, body .Mui-focusVisible": {
        outline: "3px solid #19577F",
        outlineOffset: "2px",
    },
    "body input:focus-visible, body textarea:focus-visible, body #main-content:focus-visible": {
        outline: "none",
    },
    "body header *:focus-visible, body header .Mui-focusVisible, body footer *:focus-visible, body footer .Mui-focusVisible": {
        outlineColor: "#ffffff",
    },
};

/** Chart colors, each at least 4.5:1 on white so lines and bars stay visible (WCAG 1.4.11). */
export const CHART_COLORS = [
    "#19577F",
    "#B35900",
    "#2E7D32",
    "#6A1B9A",
    "#C62828",
    "#00695C",
    "#5D4037",
    "#283593",
    "#AD1457",
    "#0277BD",
];

export default theme;
