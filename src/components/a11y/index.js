// src/components/a11y/index.js
// Small building blocks for Section 508 / WCAG 2.1 AA.
import React, { useId, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";

/** Hides content visually but keeps it for screen readers (same as MUI's visuallyHidden). */
export const visuallyHidden = {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    whiteSpace: "nowrap",
    width: "1px",
};

/** Text that only screen readers read. */
export function VisuallyHidden({ children, ...rest }) {
    return (
        <Box component="span" sx={visuallyHidden} {...rest}>
            {children}
        </Box>
    );
}

/**
 * Spinner for inside a busy button. The button keeps a name ("Saving…") while it
 * shows only the spinner; without this, screen readers just say "button".
 */
export function BusySpinner({ label = "Working", size = 24 }) {
    return (
        <>
            <CircularProgress size={size} color="inherit" aria-hidden="true" />
            <VisuallyHidden>{`${label}…`}</VisuallyHidden>
        </>
    );
}

/** First focusable element on the page: jumps past the header and side nav to <main>. */
export function SkipLink({ targetId = "main-content" }) {
    const onClick = (e) => {
        const target = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();
        target.focus();
        target.scrollIntoView();
    };
    return (
        <Box
            component="a"
            href={`#${targetId}`}
            onClick={onClick}
            sx={{
                position: "absolute",
                left: 8,
                top: -48,
                zIndex: 2000,
                px: 2,
                py: 1,
                bgcolor: "#ffffff",
                color: "#19577F",
                fontWeight: 600,
                borderRadius: 1,
                boxShadow: 3,
                textDecoration: "underline",
                "&:focus": { top: 8, outline: "3px solid #19577F", outlineOffset: 2 },
            }}
        >
            Skip to main content
        </Box>
    );
}

/**
 * Wraps a Recharts chart so it has a text alternative:
 *  - the chart is one image with a short summary (`summary`) for screen readers;
 *  - a "Show data table" button reveals the same numbers as a real table, for
 *    keyboard and screen-reader users (the chart's own tooltips are mouse-only).
 *
 * columns: [{ key, header, format? }]  rows: plain objects.
 */
export function ChartWithTable({ title, summary, columns, rows, children }) {
    const [showTable, setShowTable] = useState(false);
    const tableId = useId();
    const hasRows = Array.isArray(rows) && rows.length > 0;
    return (
        <Box>
            <Box role="img" aria-label={`${title}. ${summary || ""}`.trim()}>
                {children}
            </Box>
            {hasRows && (
                <>
                    <Button
                        size="small"
                        onClick={() => setShowTable((s) => !s)}
                        aria-expanded={showTable}
                        aria-controls={tableId}
                        sx={{ mt: 1 }}
                    >
                        {showTable ? "Hide data table" : "Show data table"}
                    </Button>
                    {showTable && (
                        <TableContainer id={tableId} sx={{ maxHeight: 320, mt: 1 }} tabIndex={0} aria-label={`${title} data`}>
                            <Table size="small" stickyHeader>
                                <caption style={visuallyHidden}>{title}</caption>
                                <TableHead>
                                    <TableRow>
                                        {columns.map((c) => (
                                            <TableCell key={c.key} scope="col">
                                                {c.header}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row, i) => (
                                        <TableRow key={i}>
                                            {columns.map((c) => (
                                                <TableCell key={c.key}>
                                                    {c.format ? c.format(row[c.key], row) : row[c.key] ?? ""}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}
        </Box>
    );
}
