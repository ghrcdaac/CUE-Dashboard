// src/utils/pdfReport.js
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Generate PDF report
 * @param {string} title - Title of the report
 * @param {Array} columns - Array of { header, dataKey }
 * @param {Array} rows - Array of objects with keys matching dataKey
 */
export function generatePDFReport(title, columns, rows) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Table
  doc.autoTable({
    startY: 30,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => row[c.dataKey] ?? "")),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}
