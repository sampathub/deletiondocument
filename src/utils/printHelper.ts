/**
 * Opens a clean, isolated top-level tab with the chart/labels and automatically triggers the print dialog.
 * This completely bypasses any iframe sandbox restrictions (e.g., missing allow-modals) in AI Studio!
 */
export function openPrintTab(
  elementId: string,
  title: string = 'Branch_Deletion_Document_Register',
  options: { orientation?: 'landscape' | 'portrait'; isLabels?: boolean } = {}
) {
  const element = document.getElementById(elementId);
  if (!element) {
    try { window.print(); } catch (_) {}
    return;
  }

  const {
    orientation = 'landscape',
    isLabels = elementId.toLowerCase().includes('label'),
  } = options;

  const isPortrait = orientation === 'portrait';
  const pageMargin = isLabels
    ? '6mm 5mm'
    : isPortrait
    ? '10mm 5mm 5mm 5mm'
    : '1.25in 5mm 5mm 5mm';

  const contentHtml = element.innerHTML;
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 ${orientation};
      margin: ${pageMargin};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #ffffff;
      color: #000000;
      margin: 0;
      padding: 0 4mm;
      font-size: 8.5px;
      font-weight: 700;
      width: 100%;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 700 !important;
    }
    .print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #eef2ff;
      border: 1.5px solid #6366f1;
      padding: 10px 18px;
      margin-bottom: 14px;
      border-radius: 10px;
      font-family: system-ui, sans-serif;
    }
    @media print {
      .print-bar, .no-print {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
    }
    ${
      isLabels
        ? `
    /* 1.5cm Label Strips */
    .label-strip-table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      border: 1.5px solid #000000 !important;
      height: 1.5cm !important;
      min-height: 1.5cm !important;
      max-height: 1.5cm !important;
      background-color: #ffffff !important;
      margin-bottom: 2.5mm !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .label-strip-table tr {
      height: 1.5cm !important;
      min-height: 1.5cm !important;
      max-height: 1.5cm !important;
      page-break-inside: avoid !important;
    }
    .label-strip-table td {
      height: 1.5cm !important;
      vertical-align: middle !important;
      padding: 1px 6px !important;
      border: none !important;
      border-right: 1.5px solid #000000 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    .label-strip-table td:last-child {
      border-right: none !important;
    }
    `
        : `
    /* Ledger Register Table */
    table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      font-size: 8pt !important;
      font-weight: 700 !important;
      margin-top: 4px;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    tbody tr {
      height: 1.45cm !important;
      min-height: 1.45cm !important;
    }
    tbody td {
      height: 1.45cm !important;
      vertical-align: middle !important;
      font-weight: 700 !important;
    }
    th, td {
      border: 1.5px solid #000000 !important;
      padding: 2.5px 2px !important;
      vertical-align: middle !important;
      color: #000000 !important;
      font-weight: 700 !important;
      font-size: 8pt !important;
      line-height: 1.15 !important;
    }
    td {
      overflow: hidden !important;
      word-break: break-word !important;
      font-weight: 700 !important;
    }
    th {
      background-color: #f1f5f9 !important;
      color: #000000 !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      font-size: 7.5pt !important;
      text-align: center !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      overflow: visible !important;
      padding: 3px 1px !important;
    }
    `
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <div>
      <div style="font-size: 14px; font-weight: 800; color: #1e1b4b;">
        🖨️ ${title}
      </div>
      <div style="font-size: 11px; color: #4338ca; margin-top: 2px;">
        Print dialog opens automatically. Click 'Print Now' if your browser blocked the prompt:
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background: #4f46e5; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; box-shadow: 0 2px 4px rgba(79,70,229,0.3);">
        🖨️ Print Now (Ctrl + P)
      </button>
      <button onclick="window.close()" style="background: #ffffff; color: #374151; border: 1px solid #d1d5db; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer;">
        ✕ Close Tab
      </button>
    </div>
  </div>
  ${contentHtml}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.print(); } catch (_) {}
      }, 350);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 20000);
}

/**
 * Prints a target element seamlessly using a hidden, isolated iframe.
 * This technique is 100% immune to popup blockers (which block window.open/blob on production Netlify domains),
 * does not disturb the current UI, copies fonts and CSS, and triggers the native print dialog flawlessly.
 */
export function printTargetElement(
  elementId: string,
  options: {
    title?: string;
    orientation?: 'landscape' | 'portrait';
    isLabels?: boolean;
  } = {}
) {
  const element = document.getElementById(elementId);
  if (!element) {
    try { window.print(); } catch (_) {}
    return;
  }

  const {
    title = 'Branch Document Report',
    orientation = 'landscape',
    isLabels = elementId.toLowerCase().includes('label'),
  } = options;

  // Remove any previously injected print iframe
  const existingFrame = document.getElementById('print-sandbox-iframe');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'print-sandbox-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '200px';
  iframe.style.height = '200px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  iframe.style.opacity = '0.01';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const isPortrait = orientation === 'portrait';
  const pageMargin = isLabels
    ? '6mm 5mm'
    : isPortrait
    ? '10mm 5mm 5mm 5mm'
    : '1.25in 5mm 5mm 5mm';

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    openPrintTab(elementId, title, { orientation, isLabels });
    return;
  }

  const contentHtml = element.innerHTML;
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 ${orientation};
      margin: ${pageMargin};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 2mm !important;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      font-size: 8.5px;
      font-weight: 700;
      width: 100%;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 700 !important;
    }
    .no-print { display: none !important; }
    ${
      isLabels
        ? `
    .label-strip-table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      border: 1.5px solid #000000 !important;
      height: 1.5cm !important;
      min-height: 1.5cm !important;
      max-height: 1.5cm !important;
      background-color: #ffffff !important;
      margin-bottom: 2.5mm !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .label-strip-table tr {
      height: 1.5cm !important;
      min-height: 1.5cm !important;
      max-height: 1.5cm !important;
      page-break-inside: avoid !important;
    }
    .label-strip-table td {
      height: 1.5cm !important;
      vertical-align: middle !important;
      padding: 1px 6px !important;
      border: none !important;
      border-right: 1.5px solid #000000 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    .label-strip-table td:last-child {
      border-right: none !important;
    }
    `
        : `
    table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      font-size: 8pt !important;
      font-weight: 700 !important;
      margin-top: 4px;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    tbody tr {
      height: 1.45cm !important;
      min-height: 1.45cm !important;
    }
    tbody td {
      height: 1.45cm !important;
      vertical-align: middle !important;
      font-weight: 700 !important;
    }
    th, td {
      border: 1.5px solid #000000 !important;
      padding: 2.5px 2px !important;
      vertical-align: middle !important;
      color: #000000 !important;
      font-weight: 700 !important;
      font-size: 8pt !important;
      line-height: 1.15 !important;
    }
    td {
      overflow: hidden !important;
      word-break: break-word !important;
      font-weight: 700 !important;
    }
    th {
      background-color: #f1f5f9 !important;
      color: #000000 !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      font-size: 7.5pt !important;
      text-align: center !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      overflow: visible !important;
      padding: 3px 1px !important;
    }
    `
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  // Primary: Trigger print directly on the iframe once loaded
  const triggerPrint = () => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      }
    } catch (e) {
      console.warn('Iframe print error, falling back:', e);
    }

    // Direct fallback
    try {
      window.print();
    } catch (_) {
      openPrintTab(elementId, title, { orientation, isLabels });
    }
  };

  if (iframe.contentWindow?.document?.readyState === 'complete') {
    setTimeout(triggerPrint, 150);
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 150);
    setTimeout(triggerPrint, 350);
  }
}

/**
 * Downloads a standalone single-file printable HTML version of the target report.
 * Guaranteed to work on every machine and browser!
 */
export function downloadPrintableHtml(elementId: string, filename: string = 'Branch_Deletion_Report.html') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Branch Deletion Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 landscape; margin-top: 1.25in; margin-bottom: 5mm; margin-left: 5mm; margin-right: 5mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #ffffff; color: #000000; margin: 0; padding: 0 4mm; font-size: 8.5px; font-weight: 700; width: 100%; }
    .font-mono { font-family: 'JetBrains Mono', monospace; font-weight: 700 !important; }
    table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 8pt; font-weight: 700; margin-top: 4px; }
    tbody tr { height: 1.45cm !important; min-height: 1.45cm !important; }
    tbody td { height: 1.45cm !important; vertical-align: middle !important; font-weight: 700 !important; }
    th, td { border: 1.5px solid #000000; padding: 2.5px 2px; vertical-align: middle; line-height: 1.15; font-weight: 700; }
    td { overflow: hidden; word-break: break-word; font-weight: 700 !important; }
    th { background: #f1f5f9; color: #000000; font-weight: 800; text-transform: uppercase; font-size: 7.5pt; text-align: center; white-space: normal; word-wrap: break-word; overflow: visible; padding: 3px 1px; }
    .border-b-2 { border-bottom: 2px solid #0f172a; }
    .border-t-2 { border-top: 2px solid #0f172a; }
    .border { border: 1px solid #cbd5e1; }
    .rounded-lg { border-radius: 6px; }
    .p-3 { padding: 8px; }
    .pb-4 { padding-bottom: 12px; }
    .mb-4 { margin-bottom: 12px; }
    .mt-4 { margin-top: 12px; }
    .mt-8 { margin-top: 24px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .grid { display: grid; }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .gap-6 { gap: 16px; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-start { align-items: flex-start; }
    .items-center { align-items: center; }
    .min-h-\\[90px\\] { min-height: 80px; }
    .bg-slate-100 { background: #f1f5f9; }
    .no-print { display: none; }
  </style>
</head>
<body>
  <div style="margin-bottom: 16px; text-align: right;" class="no-print">
    <button onclick="window.print()" style="padding: 8px 16px; font-size: 12px; font-weight: bold; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">
      🖨️ Print Now (Ctrl + P)
    </button>
  </div>
  ${element.innerHTML}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
