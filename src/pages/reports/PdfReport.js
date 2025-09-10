// src/reports/pdfReport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function getUserInfo(userInfo){
    return {
      "User Name": userInfo?.name,
      // "NGroup": userInfo?.ngroup,
      // "Email": userInfo?.role,
      "Generated At": new Date().toLocaleString(),
      "Report Start": userInfo?.start,
      "Report End" :userInfo?.end
    }
}

export function addUserInfoSection(doc, userInfo, startY = 20) {
  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("User Information", 14, startY);

  // Build rows as [key, value]
  const rows = Object.entries(userInfo).map(([key, value]) => [
    key,
    value || "N/A",
  ]);

  // Render as 2-column table, fixed widths
  autoTable(doc, {
    startY: startY + 3,
    body: rows,
    theme: "plain", // no lines
    styles: {
      fontSize: 11,
      cellPadding: 1,
      valign: "middle",
      fillColor: [227, 242, 253], // light blue
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" }, // fixed width for labels
      1: { cellWidth: 120 },                   // fixed width for values
    },
  });

  return doc.lastAutoTable.finalY + 10; // next Y position
}

function toCamelCaseTitle(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
/**
 * Generate PDF report
 * @param {string} title - Title of the report
 * @param {Array} columns - Array of { header, dataKey }
 * @param {Array} rows - Array of objects with keys matching dataKey
 */
export function generatePDFReport(title, columns, rows, summary = null, userInfo) {

  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(toCamelCaseTitle("CUE - " + title+" Report"), 14, 20);

  y += 10;

  y = addUserInfoSection(doc, getUserInfo(userInfo), y);

  if (summary) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Summary", 14, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    Object.entries(summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, y);
      y += 7;
    });
  }
  
  // Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(toCamelCaseTitle(title), 14, y);
  doc.autoTable({
    startY: y + 7,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => row[c.dataKey] ?? "")),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}

export function generateCostReport(summary, daily, collections, files, userInfo) {
  const doc = new jsPDF();
  let y = 20;

  // ====== Title ======
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CUE - Files by Cost Report", 14, y);
  y += 10;

  y = addUserInfoSection(doc, getUserInfo(userInfo), y);

  // ====== Summary ======
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Cost Summary", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  y += 7;
  Object.entries(summary).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`, 14, y);
    y += 7;
  });

  // ====== Daily Cost ======
  if (daily?.length) {
    y += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Cost", 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Date", "Cost ($)"]],
      body: daily.map((d) => [d.date, d.cost]),
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ====== Collection Cost ======
  if (collections?.length) {
    y += 10
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Collection Cost", 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Collection", "Cost ($)"]],
      body: collections.map((c) => [c.name, c.cost,c.size]),
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ====== Files by Cost ======
  if (files?.length) {
    y += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
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

export function generateMetricsReport(summary, statusCounts, dailyVolume, dailyCount, userInfo) {
  const doc = new jsPDF();
  let y = 20;
 // ===== Title =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CUE - Metrics Overview Report", 14, y);
  y += 15;

  y = addUserInfoSection(doc, getUserInfo(userInfo), y);

  // ===== Summary (Cards) =====
  doc.setFontSize(14);
  doc.text("Metrics Overview", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  Object.entries(summary).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`, 14, y);
    y += 7;
  });

  // ===== Status Counts =====
  if (statusCounts?.length) {
    y += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Status Distribution", 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Status", "Count"]],
      body: statusCounts.map((s) => [s.status, s.count]),
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ===== Daily Volume =====
  if (dailyVolume?.length) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Volume (GB)", 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Day", "Volume (GB)"]],
      body: dailyVolume.map((d) => [d.day, d.value]),
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ===== Daily Count =====
  if (dailyCount?.length) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Daily File Count", 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Day", "Files"]],
      body: dailyCount.map((d) => [d.day, d.value]),
    });
  }

  doc.save("MetricsOverviewReport.pdf");
}

