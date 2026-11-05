// src/theme.js
// One MUI theme for every page (the auth pages used to build their own copy).
// Colors meet Section 508 / WCAG 2.1 AA: text >= 4.5:1, control borders >= 3:1.
import { createTheme } from "@mui/material/styles";

// Input borders: MUI's default (black at 23%) is only 1.7:1 on white.
const INPUT_BORDER = "#8a8a8a"; // 3.45:1 on white

const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F",
        },
        secondary: {
            main: "#f0f0f0",
        },
        // MUI's default warning (#ed6c02) gives white text only 3.1:1.
        warning: {
            main: "#b45309", // white text 5.0:1
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
    },
});

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
