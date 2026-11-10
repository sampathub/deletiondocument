import { DeletionDocument, DocumentWithSla, SlaStatus } from '../types/document';

/**
 * Standardizes any date representation (DD/MM/YYYY, YYYY-MM-DD, Excel Serial)
 * into a Date object.
 */
export function parseDate(dateStr: string | number | null | undefined): Date | null {
  if (!dateStr) return null;

  // Handle Excel serial date numbers (e.g. 45520)
  if (typeof dateStr === 'number' || (!isNaN(Number(dateStr)) && !String(dateStr).includes('/') && !String(dateStr).includes('-'))) {
    const serial = Number(dateStr);
    // Excel epoch offset (considering 1900 leap year bug)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = excelEpoch.getTime() + serial * 86400000;
    const d = new Date(millis);
    if (!isNaN(d.getTime())) return d;
  }

  const s = String(dateStr).trim();
  if (!s) return null;

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Check YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback to Date.parse
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a date into DD/MM/YYYY for standard Sri Lankan office registers.
 */
export function formatDateDMY(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : parseDate(dateInput);
  if (!d) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date into YYYY-MM-DD for HTML input[type="date"]
 */
export function formatDateYMD(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : parseDate(dateInput);
  if (!d) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Calculates days difference between two dates.
 */
export function getDaysDifference(fromDate: Date, toDate: Date): number {
  const utc1 = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const utc2 = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  const diffTime = utc2 - utc1;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Computes SLA status and days pending for a document.
 */
export function computeDocumentSla(doc: DeletionDocument, referenceDate: Date = new Date()): DocumentWithSla {
  const isReleased = Boolean(doc.collectedDate && doc.collectedDate.trim() !== '');
  const isDispatched = Boolean(doc.dispatchStatus === 'DISPATCHED_HO' || doc.dispatchStatus === 'TRANSFERRED_BRANCH');

  let daysAtBranch = 0;
  const receivedDate = parseDate(doc.receivedBranchDate);

  if (receivedDate) {
    if (isReleased) {
      const releaseDate = parseDate(doc.collectedDate) || referenceDate;
      daysAtBranch = Math.max(0, getDaysDifference(receivedDate, releaseDate));
    } else if (isDispatched) {
      const dispDate = parseDate(doc.dispatchDate) || referenceDate;
      daysAtBranch = Math.max(0, getDaysDifference(receivedDate, dispDate));
    } else {
      daysAtBranch = Math.max(0, getDaysDifference(receivedDate, referenceDate));
    }
  }

  let slaStatus: SlaStatus = 'NORMAL';
  if (isReleased) {
    slaStatus = 'RELEASED';
  } else if (isDispatched) {
    slaStatus = 'DISPATCHED';
  } else if (daysAtBranch > 60) {
    slaStatus = 'CRITICAL_BREACH';
  } else if (daysAtBranch >= 55) {
    slaStatus = 'WARNING_55_60';
  } else {
    slaStatus = 'NORMAL';
  }

  const daysRemainingTo60 = Math.max(0, 60 - daysAtBranch);

  return {
    ...doc,
    daysAtBranch,
    daysRemainingTo60,
    slaStatus,
    isReleased,
    isDispatched,
  };
}

/**
 * Sorts documents chronologically by receivedBranchDate and No.
 */
export function sortDocuments(docs: DocumentWithSla[], direction: 'asc' | 'desc' = 'desc'): DocumentWithSla[] {
  return [...docs].sort((a, b) => {
    const dateA = parseDate(a.receivedBranchDate)?.getTime() || 0;
    const dateB = parseDate(b.receivedBranchDate)?.getTime() || 0;

    if (dateA !== dateB) {
      return direction === 'desc' ? dateB - dateA : dateA - dateB;
    }

    const noA = Number(a.no) || 0;
    const noB = Number(b.no) || 0;
    return direction === 'desc' ? noB - noA : noA - noB;
  });
}
