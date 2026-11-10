import * as XLSX from 'xlsx';
import { DeletionDocument } from '../types/document';
import { formatDateDMY, parseDate } from './dateUtils';

// Standard 16 column headers
export const EXCEL_COLUMNS = [
  'No',
  'Contract No',
  'Client Name',
  'Client Nic',
  'Reg No',
  'LAD Sent Date',
  'Sent LAD Officer',
  'Recived Branch date',
  'Received Officer Branch',
  'Documents Collected by',
  'Documents Collected NIC',
  'Collected Date',
  'Collected Signature',
  'Handed over Date',
  'Handed Over Officer Name',
  'Handed Over Officer Signature',
] as const;

/**
 * Normalizes an arbitrary header string for matching.
 */
function normalizeHeader(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses an Excel or CSV file buffer and maps rows into DeletionDocument objects.
 */
export async function parseExcelFile(file: File): Promise<{
  documents: DeletionDocument[];
  rawRowCount: number;
  unmappedColumns: string[];
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON array of objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    raw: false,
    defval: '',
  });

  if (!rawRows || rawRows.length === 0) {
    return { documents: [], rawRowCount: 0, unmappedColumns: [] };
  }

  // Header detection mapping
  const sampleRow = rawRows[0];
  const detectedKeys = Object.keys(sampleRow);
  const columnMap: Record<string, string> = {};

  detectedKeys.forEach((key) => {
    const norm = normalizeHeader(key);

    if (
      norm === 'no' ||
      norm === 'no.' ||
      norm === 'srno' ||
      norm === 'serialno' ||
      norm === 'serial' ||
      norm === 'docno' ||
      norm === 'docnumber' ||
      norm === 'number' ||
      norm === 'itemno' ||
      norm === 'seqno' ||
      norm === 'recordno' ||
      norm === 'num'
    ) {
      columnMap['no'] = key;
    } else if (norm.includes('contract') || norm.includes('agreement')) {
      columnMap['contractNo'] = key;
    } else if (norm.includes('clientname') || norm.includes('customername') || (norm.includes('name') && !norm.includes('officer'))) {
      columnMap['clientName'] = key;
    } else if (norm.includes('clientnic') || norm.includes('customernic') || (norm.includes('nic') && !norm.includes('collected'))) {
      columnMap['clientNic'] = key;
    } else if (norm.includes('regno') || norm.includes('vehicleno') || norm.includes('registration')) {
      columnMap['regNo'] = key;
    } else if (norm.includes('ladsentdate') || (norm.includes('sent') && norm.includes('date'))) {
      columnMap['ladSentDate'] = key;
    } else if (norm.includes('sentladofficer') || (norm.includes('ladofficer') && !norm.includes('branch'))) {
      columnMap['sentLadOfficer'] = key;
    } else if (
      norm.includes('recivedbranchdate') ||
      norm.includes('receivedbranchdate') ||
      norm.includes('branchreceiveddate') ||
      (norm.includes('received') && norm.includes('date'))
    ) {
      columnMap['receivedBranchDate'] = key;
    } else if (
      norm.includes('receivedofficerbranch') ||
      norm.includes('branchofficer') ||
      (norm.includes('received') && norm.includes('officer'))
    ) {
      columnMap['receivedOfficerBranch'] = key;
    } else if (norm.includes('documentscollectedby') || norm.includes('collectedby')) {
      columnMap['documentsCollectedBy'] = key;
    } else if (norm.includes('documentscollectednic') || norm.includes('collectednic')) {
      columnMap['documentsCollectedNic'] = key;
    } else if (norm.includes('collecteddate')) {
      columnMap['collectedDate'] = key;
    } else if (norm.includes('collectedsignature') || norm.includes('clientsignature')) {
      columnMap['collectedSignature'] = key;
    } else if (norm.includes('handedoverdate') || norm.includes('handoverdate')) {
      // Intentionally ignored/omitted as per user request
    } else if (norm.includes('handedoverofficername') || norm.includes('handoverofficer')) {
      columnMap['handedOverOfficerName'] = key;
    } else if (norm.includes('handedoverofficersignature') || norm.includes('officersignature')) {
      columnMap['handedOverOfficerSignature'] = key;
    }
  });

  // If columnMap['no'] was still not matched, check if first column is likely the serial/no column
  if (!columnMap['no'] && detectedKeys.length > 0) {
    const firstKey = detectedKeys[0];
    const firstVal = sampleRow[firstKey];
    if (firstVal !== undefined && firstVal !== null && String(firstVal).trim() !== '' && !isNaN(Number(firstVal))) {
      columnMap['no'] = firstKey;
    }
  }

  const documents: DeletionDocument[] = rawRows
    .filter((row) => {
      // Must have at least a contractNo, clientName, or No to be valid
      const cNo = row[columnMap['contractNo'] || 'Contract No'] || row['Contract No'];
      const cName = row[columnMap['clientName'] || 'Client Name'] || row['Client Name'];
      const no = row[columnMap['no'] || 'No'] || row['No'];
      return Boolean(cNo || cName || no);
    })
    .map((row, index) => {
      const getVal = (field: string, fallbackHeaders: string[]): string => {
        const mappedKey = columnMap[field];
        if (mappedKey && row[mappedKey] !== undefined && row[mappedKey] !== null) {
          const v = String(row[mappedKey]).trim();
          if (v !== '') return v;
        }
        for (const h of fallbackHeaders) {
          if (row[h] !== undefined && row[h] !== null) {
            const v = String(row[h]).trim();
            if (v !== '') return v;
          }
        }
        return '';
      };

      // Specifically extract the exact 'No' from the Excel row
      let noVal = getVal('no', ['No', 'NO', 'No.', 'NO.', 'no', 'Sr No', 'Sr. No', 'Serial', 'Serial No', 'Doc No', 'Item No', 'Seq No']);
      
      // If still empty, check the very first column in row if it holds a number
      if (!noVal && detectedKeys.length > 0 && row[detectedKeys[0]] !== undefined) {
        const firstColVal = String(row[detectedKeys[0]]).trim();
        if (firstColVal !== '' && !isNaN(Number(firstColVal))) {
          noVal = firstColVal;
        }
      }

      // If still empty, fall back to index + 1
      if (!noVal) {
        noVal = String(index + 1);
      }

      const ladSentRaw = getVal('ladSentDate', ['LAD Sent Date', 'Sent Date', 'LAD Date']);
      const receivedRaw = getVal('receivedBranchDate', ['Recived Branch date', 'Received Branch date', 'Branch Received Date', 'Received Date']);
      const collectedRaw = getVal('collectedDate', ['Collected Date', 'Release Date']);

      return {
        id: `doc_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
        no: isNaN(Number(noVal)) ? noVal : Number(noVal),
        contractNo: getVal('contractNo', ['Contract No', 'Agreement No', 'Contract']),
        clientName: getVal('clientName', ['Client Name', 'Customer Name', 'Name']),
        clientNic: getVal('clientNic', ['Client Nic', 'Customer NIC', 'NIC']),
        regNo: getVal('regNo', ['Reg No', 'Vehicle No', 'Registration No', 'Asset No']),
        ladSentDate: ladSentRaw ? formatDateDMY(ladSentRaw) : '',
        sentLadOfficer: getVal('sentLadOfficer', ['Sent LAD Officer', 'LAD Officer']),
        receivedBranchDate: receivedRaw ? formatDateDMY(receivedRaw) : '',
        receivedOfficerBranch: getVal('receivedOfficerBranch', ['Received Officer Branch', 'Branch Officer']),
        documentsCollectedBy: getVal('documentsCollectedBy', ['Documents Collected by', 'Collected By']),
        documentsCollectedNic: getVal('documentsCollectedNic', ['Documents Collected NIC', 'Collector NIC']),
        collectedDate: collectedRaw ? formatDateDMY(collectedRaw) : '',
        collectedSignature: getVal('collectedSignature', ['Collected Signature', 'Client Signature']),
        handedOverDate: '', // Omitted per user instruction
        handedOverOfficerName: getVal('handedOverOfficerName', ['Handed Over Officer Name', 'Handover Officer']),
        handedOverOfficerSignature: getVal('handedOverOfficerSignature', ['Handed Over Officer Signature', 'Officer Signature']),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

  return {
    documents,
    rawRowCount: rawRows.length,
    unmappedColumns: detectedKeys.filter(
      (k) =>
        !Object.values(columnMap).includes(k) &&
        !normalizeHeader(k).includes('handedoverdate') &&
        !normalizeHeader(k).includes('handoverdate')
    ),
  };
}

/**
 * Exports documents to standard 15-column Excel sheet.
 */
export function exportToExcel(documents: DeletionDocument[], filename: string = 'Branch_Deletion_Documents.xlsx') {
  const exportData = documents.map((doc) => ({
    'No': doc.no,
    'Contract No': doc.contractNo,
    'Client Name': doc.clientName,
    'Client Nic': doc.clientNic,
    'Reg No': doc.regNo,
    'LAD Sent Date': doc.ladSentDate,
    'Sent LAD Officer': doc.sentLadOfficer,
    'Recived Branch date': doc.receivedBranchDate,
    'Received Officer Branch': doc.receivedOfficerBranch,
    'Documents Collected by': doc.documentsCollectedBy || '',
    'Documents Collected NIC': doc.documentsCollectedNic || '',
    'Collected Date': doc.collectedDate || '',
    'Collected Signature': doc.collectedSignature || '',
    'Handed Over Officer Name': doc.handedOverOfficerName || '',
    'Handed Over Officer Signature': doc.handedOverOfficerSignature || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: [...EXCEL_COLUMNS] });

  // Set nice column widths for 15 columns
  worksheet['!cols'] = [
    { wch: 8 },  // No
    { wch: 18 }, // Contract No
    { wch: 28 }, // Client Name
    { wch: 16 }, // Client Nic
    { wch: 16 }, // Reg No
    { wch: 14 }, // LAD Sent Date
    { wch: 16 }, // Sent LAD Officer
    { wch: 18 }, // Recived Branch date
    { wch: 20 }, // Received Officer Branch
    { wch: 26 }, // Documents Collected by
    { wch: 22 }, // Documents Collected NIC
    { wch: 16 }, // Collected Date
    { wch: 18 }, // Collected Signature
    { wch: 24 }, // Handed Over Officer Name
    { wch: 24 }, // Handed Over Officer Signature
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Branch Deletions');
  XLSX.writeFile(workbook, filename);
}

/**
 * Downloads a sample template Excel file with exact 15 columns and sample rows.
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'No': 3925,
      'Contract No': 'KEUV221306970',
      'Client Name': 'MR. H.M.K. JAYALATH',
      'Client Nic': '940083982V',
      'Reg No': 'SG ABN-4772',
      'LAD Sent Date': '14/08/2026',
      'Sent LAD Officer': '14000496',
      'Recived Branch date': '15/08/2026',
      'Received Officer Branch': '14000084',
      'Documents Collected by': '',
      'Documents Collected NIC': '',
      'Collected Date': '',
      'Collected Signature': '',
      'Handed Over Officer Name': '',
      'Handed Over Officer Signature': '',
    },
    {
      'No': 3926,
      'Contract No': 'KEUV231512510',
      'Client Name': 'Mr. L.P.K.S.G. Pathirana',
      'Client Nic': '873165227V',
      'Reg No': 'SG QR-6516',
      'LAD Sent Date': '14/08/2026',
      'Sent LAD Officer': '14000496',
      'Recived Branch date': '15/08/2026',
      'Received Officer Branch': '14000084',
      'Documents Collected by': '',
      'Documents Collected NIC': '',
      'Collected Date': '',
      'Collected Signature': '',
      'Handed Over Officer Name': '',
      'Handed Over Officer Signature': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: [...EXCEL_COLUMNS] });
  worksheet['!cols'] = [
    { wch: 8 },  // No
    { wch: 18 }, // Contract No
    { wch: 28 }, // Client Name
    { wch: 16 }, // Client Nic
    { wch: 16 }, // Reg No
    { wch: 14 }, // LAD Sent Date
    { wch: 16 }, // Sent LAD Officer
    { wch: 18 }, // Recived Branch date
    { wch: 20 }, // Received Officer Branch
    { wch: 26 }, // Documents Collected by
    { wch: 22 }, // Documents Collected NIC
    { wch: 16 }, // Collected Date
    { wch: 18 }, // Collected Signature
    { wch: 24 }, // Handed Over Officer Name
    { wch: 24 }, // Handed Over Officer Signature
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Deletion Register Template');
  XLSX.writeFile(workbook, 'Branch_Deletion_Documents_Template.xlsx');
}
