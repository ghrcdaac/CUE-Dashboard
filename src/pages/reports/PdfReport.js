// src/reports/pdfReport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// ---------- CSV (accessible alternative to the PDF) ----------

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Builds and downloads a CSV with the same sections as the PDF.
 * sections: [{ title, head: [..], body: [[..], ..] }]
 */
export function downloadCsv(fileName, title, info, summary, sections) {
  const lines = [csvCell(title), ""];
  Object.entries(info || {}).forEach(([k, v]) => lines.push([csvCell(k), csvCell(v || "N/A")].join(",")));
  if (summary && Object.keys(summary).length) {
    lines.push("", csvCell("Summary"));
    Object.entries(summary).forEach(([k, v]) => lines.push([csvCell(k), csvCell(v)].join(",")));
  }
  (sections || []).forEach((sec) => {
    lines.push("", csvCell(sec.title));
    lines.push(sec.head.map(csvCell).join(","));
    sec.body.forEach((row) => lines.push(row.map(csvCell).join(",")));
  });
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Title and language in the PDF's metadata, so readers announce what it is. */
function setPdfMetadata(doc, title) {
  doc.setProperties({ title, subject: title, creator: "CUE Dashboard" });
  if (typeof doc.setLanguage === "function") doc.setLanguage("en-US");
}

function getUserInfo(userInfo){
  const session = localStorage.getItem('CUE_USER_SESSION');
  const parsedData = JSON.parse(session);
    return {
      "Name": parsedData?.user?.name,
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
export function generatePDFReport(title, columns, rows, summary = null, userInfo, format = "pdf") {
  if (format === "csv") {
    downloadCsv(`${title.replace(/\s+/g, "_")}.csv`, "CUE - " + toCamelCaseTitle(title), getUserInfo(userInfo), summary, [
      { title: toCamelCaseTitle(title), head: columns.map((c) => c.header), body: rows.map((row) => columns.map((c) => row[c.dataKey] ?? "")) },
    ]);
    return;
  }

  const doc = new jsPDF();
  setPdfMetadata(doc, "CUE - " + toCamelCaseTitle(title));
  let y = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CUE - " + toCamelCaseTitle(title), 14, 20);

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

export function generateCostReport(summary, daily, collections, files, userInfo, format = "pdf") {
  if (format === "csv") {
    downloadCsv("FilesByCostReport.csv", "CUE - Files by Cost Report", getUserInfo(userInfo), summary, [
      { title: "Daily Cost", head: ["Date", "Cost ($)"], body: (daily || []).map((d) => [d.day, d.value]) },
      { title: "Collection Cost", head: ["Collection", "Cost ($)"], body: (collections || []).map((c) => [c.name, c.cost]) },
      { title: "Files by Cost", head: ["File Name", "Cost ($)", "Size (Bytes)"], body: (files || []).map((f) => [f.name, f.cost, f.size]) },
    ]);
    return;
  }
  const doc = new jsPDF();
  setPdfMetadata(doc, "CUE - Files by Cost Report");
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
      body: daily.map((d) => [d.day, d.value]),
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

export function generateMetricsReport(summary, statusCounts, dailyVolume, dailyCount, userInfo, format = "pdf") {
  if (format === "csv") {
    downloadCsv("MetricsOverviewReport.csv", "CUE - Metrics Overview Report", getUserInfo(userInfo), summary, [
      { title: "Status Distribution", head: ["Status", "Count"], body: (statusCounts || []).map((s) => [s.status, s.count]) },
      { title: "Daily Volume", head: ["Day", "Volume"], body: (dailyVolume || []).map((d) => [d.day, d.value]) },
      { title: "Daily File Count", head: ["Day", "Files"], body: (dailyCount || []).map((d) => [d.day, d.value]) },
    ]);
    return;
  }
  const doc = new jsPDF();
  setPdfMetadata(doc, "CUE - Metrics Overview Report");
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
    doc.text("Daily Volume", 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Day", "Volume"]],
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

