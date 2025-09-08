// src/reports/pdfReport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generate PDF report
 * @param {string} title - Title of the report
 * @param {Array} columns - Array of { header, dataKey }
 * @param {Array} rows - Array of objects with keys matching dataKey
 */
export function generatePDFReport(title, columns, rows, summary = null) {

  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  if (summary) {
    doc.setFontSize(14);
    let y = 30;
    Object.entries(summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, y);
      y += 8;
    });
  }
  
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

export function generateCostReport(summary, daily, collections, files) {
  const doc = new jsPDF();
  let y = 20;

  // ====== Title ======
  doc.setFontSize(30);
  doc.text("Files by Cost Report", 14, y);
  y += 10;

  // ====== Summary ======
  doc.setFontSize(14);
  Object.entries(summary).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`, 14, y);
    y += 10;
  });

  // ====== Daily Cost ======
  if (daily?.length) {
    y += 50;
    doc.setFontSize(20);
    doc.text("Daily Cost", 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Date", "Cost ($)"]],
      body: daily.map((d) => [d.date, d.cost]),
    });
    y = doc.lastAutoTable.finalY + 50;
  }

  // ====== Collection Cost ======
  if (collections?.length) {
    if (y > 250) {
      doc.addPage();
      (y = 20)
    }; // page break 
    doc.setFontSize(20);
    doc.text("Collection Cost", 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Collection", "Cost ($)"]],
      body: collections.map((c) => [c.collection_id, c.cost]),
    });
    y = doc.lastAutoTable.finalY + 50;
  }

  // ====== Files by Cost ======
  if (files?.length) {
    if (y > 250) {
      doc.addPage();
      (y = 20);
     } //  page break 
    doc.setFontSize(20);
    doc.text("Files by Cost", 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["File Name", "Cost ($)", "Size (Bytes)"]],
      body: files.map((f) => [f.name, f.cost, f.size]),
      styles: { fontSize: 8 },
    });
  }

  doc.save("FilesByCostReport.pdf");
}

