import React, { useState, useMemo } from 'react';
import { Printer, Calendar, Filter, ArrowLeft, Download, CheckSquare, FileCode, Tag } from 'lucide-react';
import { DocumentWithSla } from '../types/document';
import { parseDate, formatDateDMY, formatDateYMD } from '../utils/dateUtils';
import { exportToExcel } from '../utils/excelUtils';
import { printTargetElement, downloadPrintableHtml } from '../utils/printHelper';
import { PrintPreviewModal } from './PrintPreviewModal';

interface A4PrintRegisterProps {
  documents: DocumentWithSla[];
  onBack: () => void;
  branchName?: string;
  branchCode?: string;
  onOpenLabelPrint?: (dateFilter?: {
    mode: 'RANGE' | 'SINGLE';
    startDate?: string;
    endDate?: string;
    singleDate?: string;
  }) => void;
}

export const A4PrintRegister: React.FC<A4PrintRegisterProps> = ({
  documents,
  onBack,
  branchName = 'COLOMBO CENTRAL BRANCH',
  branchCode = 'BR-140',
  onOpenLabelPrint,
}) => {
  const [filterMode, setFilterMode] = useState<'RANGE' | 'SINGLE'>('RANGE');
  const [dateField, setDateField] = useState<'RECEIVED' | 'RELEASED'>('RECEIVED');
  const [singleDate, setSingleDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RELEASED' | 'WARNING_55_60' | 'CRITICAL_BREACH'>('ALL');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('asc');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Filtered documents calculation - strictly filtered by the selected date field (Recived Branch Date or Collected Date)
  // NEVER fall back to ladSentDate or include unmatched empty records.
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Status filter
      if (statusFilter === 'PENDING' && doc.isReleased) return false;
      if (statusFilter === 'RELEASED' && !doc.isReleased) return false;
      if (statusFilter === 'WARNING_55_60' && doc.slaStatus !== 'WARNING_55_60') return false;
      if (statusFilter === 'CRITICAL_BREACH' && doc.slaStatus !== 'CRITICAL_BREACH') return false;

      // Date field selection: strict check on target field
      const targetDateStr = dateField === 'RECEIVED' ? doc.receivedBranchDate : doc.collectedDate;

      // If user specified date filters, doc MUST have a valid target date
      const isDateFilteringActive = (filterMode === 'SINGLE' && Boolean(singleDate)) ||
                                    (filterMode === 'RANGE' && Boolean(startDate || endDate));

      if (isDateFilteringActive) {
        if (!targetDateStr || !targetDateStr.trim()) return false;
        const targetDate = parseDate(targetDateStr);
        if (!targetDate) return false;

        // Single Date filter (strict exact day match)
        if (filterMode === 'SINGLE' && singleDate) {
          const sDate = parseDate(singleDate);
          if (!sDate) return false;
          const isSameDay =
            targetDate.getFullYear() === sDate.getFullYear() &&
            targetDate.getMonth() === sDate.getMonth() &&
            targetDate.getDate() === sDate.getDate();
          if (!isSameDay) return false;
        }

        // Date Range filter (strict inclusive range)
        if (filterMode === 'RANGE') {
          if (startDate) {
            const sDate = parseDate(startDate);
            if (sDate) {
              const startOfDay = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 0, 0, 0);
              if (targetDate.getTime() < startOfDay.getTime()) return false;
            }
          }
          if (endDate) {
            const eDate = parseDate(endDate);
            if (eDate) {
              const endOfDay = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59);
              if (targetDate.getTime() > endOfDay.getTime()) return false;
            }
          }
        }
      }

      return true;
    });
  }, [documents, filterMode, dateField, singleDate, startDate, endDate, statusFilter]);

  // Clean document records excluding dummy return rows and strictly sort by Recived Branch Date
  const validFilteredDocs = useMemo(() => {
    const list = filteredDocs.filter((doc) => {
      const contractLower = (doc.contractNo || '').toLowerCase();
      const clientLower = (doc.clientName || '').toLowerCase();
      const remarksLower = (doc.remarks || '').toLowerCase();
      return !(
        contractLower.includes('return to mc') ||
        clientLower.includes('return to mc') ||
        remarksLower.includes('return to mc')
      );
    });

    // Strictly sort by receivedBranchDate chronologically
    return [...list].sort((a, b) => {
      const dateA = parseDate(a.receivedBranchDate)?.getTime() || 0;
      const dateB = parseDate(b.receivedBranchDate)?.getTime() || 0;

      if (dateA !== dateB) {
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      }

      const noA = Number(a.no) || 0;
      const noB = Number(b.no) || 0;
      return sortDirection === 'desc' ? noB - noA : noA - noB;
    });
  }, [filteredDocs, sortDirection]);

  // Exactly 60 days after Received Branch Date
  const returnToMcDate = useMemo(() => {
    let refDate: Date | null = null;
    for (const d of validFilteredDocs) {
      if (d.receivedBranchDate) {
        const parsed = parseDate(d.receivedBranchDate);
        if (parsed) {
          if (!refDate || parsed.getTime() > refDate.getTime()) {
            refDate = parsed;
          }
        }
      }
    }

    const baseDate = refDate ? new Date(refDate.getTime()) : new Date();
    const returnDate = new Date(baseDate.getTime());
    returnDate.setDate(returnDate.getDate() + 60);
    return formatDateDMY(returnDate);
  }, [validFilteredDocs]);

  const handlePrint = () => {
    setIsPreviewOpen(true);
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml('printable-a4-report', `Branch_Deletion_Register_${Date.now()}.html`);
  };

  const handleQuickPreset = (preset: 'all' | 'this_month' | 'last_month' | 'august_2026') => {
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      setSingleDate('');
      setStatusFilter('ALL');
    } else if (preset === 'august_2026') {
      setFilterMode('RANGE');
      setStartDate('2026-08-01');
      setEndDate('2026-08-31');
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden during Print) */}
      <div className="no-print p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Return to Main Ledger"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                A4 Official Deletion Register (A4 මුද්‍රණ අංශය)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filter by date or date range to format and generate printable A4 branch deletion register report.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenLabelPrint && (
              <button
                type="button"
                onClick={() =>
                  onOpenLabelPrint({
                    mode: filterMode,
                    startDate: filterMode === 'RANGE' ? startDate : undefined,
                    endDate: filterMode === 'RANGE' ? endDate : undefined,
                    singleDate: filterMode === 'SINGLE' ? singleDate : undefined,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                title="Print 1.5cm File Label Strips (No, Contract, Client & NIC, Reg No, Return to MC)"
              >
                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Label Print (1.5cm පටි)
              </button>
            )}
            <button
              onClick={() => exportToExcel(filteredDocs, `Filtered_Deletion_Report_${Date.now()}.xlsx`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export XLSX
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Download standalone single-file printable HTML report"
            >
              <FileCode className="w-4 h-4" /> Save HTML File
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print A4 Sheet / PDF
            </button>
          </div>
        </div>

        {/* Filters Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Mode */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Date Filter Mode
            </label>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setFilterMode('RANGE')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  filterMode === 'RANGE'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Date Range
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('SINGLE')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  filterMode === 'SINGLE'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Single Date
              </button>
            </div>
          </div>

          {/* Date Field to match */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Target Date Field
            </label>
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="RECEIVED">Recived Branch date (ලැබුණු දිනය)</option>
              <option value="RELEASED">Collected / Release date (භාරදුන් දිනය)</option>
            </select>
          </div>

          {/* Date Inputs */}
          {filterMode === 'RANGE' ? (
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Select Specific Date
              </label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Status filter bar and Sort Toggle */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          {(['ALL', 'PENDING', 'RELEASED', 'WARNING_55_60', 'CRITICAL_BREACH'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' && 'All Records'}
              {st === 'PENDING' && 'Pending at Branch'}
              {st === 'RELEASED' && 'Released / Handed Over'}
              {st === 'WARNING_55_60' && '55-60 Day Alert'}
              {st === 'CRITICAL_BREACH' && '>60 Day Breach'}
            </button>
          ))}

          <div className="flex items-center gap-2 ml-auto">
            {/* Strict Sorting Toggle */}
            <button
              type="button"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Sort chronologically by Recived Branch Date"
            >
              <span>Sort:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {sortDirection === 'asc' ? 'Oldest First (Asc ↑)' : 'Newest First (Desc ↓)'}
              </span>
            </button>

            <button
              onClick={() => handleQuickPreset('all')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Printable A4 Paper Container */}
      <div id="printable-a4-report" className="print-card print-container bg-white text-slate-900 rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 max-w-[1300px] mx-auto">
        {/* Printable Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                BRANCH DELETION DOCUMENT REGISTER & DISPATCH REPORT
              </h1>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                {branchName} ({branchCode}) · OPERATIONS & LEGAL ADMINISTRATION (LAD)
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-600 font-mono">
              <p>Printed: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}</p>
              <p>System Ref: LAD-DEL-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs mt-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-4">
              <span>
                <strong>Period: </strong>
                {filterMode === 'SINGLE' && singleDate
                  ? formatDateDMY(singleDate)
                  : startDate || endDate
                  ? `${startDate ? formatDateDMY(startDate) : 'Start'} to ${endDate ? formatDateDMY(endDate) : 'End'}`
                  : 'All Registered Dates'}
              </span>
              <span>·</span>
              <span>
                <strong>Criteria: </strong>
                {dateField === 'RECEIVED' ? 'Branch Received Date' : 'Release Handover Date'}
              </span>
              <span>·</span>
              <span>
                <strong>Status Filter: </strong> {statusFilter}
              </span>
            </div>

            <div className="font-mono text-xs font-bold">
              Total Records: {filteredDocs.length} (Released: {filteredDocs.filter(d => d.isReleased).length} | Pending: {filteredDocs.filter(d => !d.isReleased).length})
            </div>
          </div>
        </div>

        {/* Printable Table with exact 15 columns */}
        {filteredDocs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic">
            No document records match the selected date and status criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-[8.5px] border-collapse border-[1.5px] border-slate-950 font-bold text-slate-950">
              <colgroup>
                <col style={{ width: '3%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '6.5%' }} />
                <col style={{ width: '6.5%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '6.5%' }} />
                <col style={{ width: '6.5%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '7.5%' }} />
                <col style={{ width: '7.5%' }} />
                <col style={{ width: '6%' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-extrabold border-b-[1.5px] border-slate-950 uppercase text-[7.5px] leading-tight tracking-tight">
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">No</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Contract<br />No</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Client<br />Name</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Client<br />NIC</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Reg<br />No</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">LAD Sent<br />Date</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Sent LAD<br />Officer</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Recived Branch<br />Date</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Recvd Officer<br />Branch</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Collected<br />By</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Collected<br />NIC</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Collected<br />Date</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Collected<br />Sign</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Handed<br />Officer</th>
                  <th className="p-1 border-[1.5px] border-slate-950 text-center align-middle whitespace-normal break-words font-extrabold">Officer<br />Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y-[1.5px] divide-slate-950 font-mono font-bold text-slate-950 text-[9.5px]">
                {validFilteredDocs.map((doc, idx) => (
                  <tr
                    key={doc.id || idx}
                    className={`hover:bg-slate-50 font-bold ${
                      !doc.isReleased && doc.slaStatus === 'CRITICAL_BREACH'
                        ? 'bg-rose-50/50'
                        : !doc.isReleased && doc.slaStatus === 'WARNING_55_60'
                        ? 'bg-amber-50/50'
                        : ''
                    }`}
                    style={{ height: '1.45cm' }}
                  >
                    <td className="p-1 border-[1.5px] border-slate-950 text-center font-black align-middle text-slate-950">{doc.no || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-bold align-middle text-slate-950">{doc.contractNo || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-sans font-bold uppercase truncate max-w-[120px] align-middle text-slate-950">
                      {doc.clientName || ''}
                    </td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-bold whitespace-nowrap align-middle text-slate-950">{doc.clientNic || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-bold whitespace-nowrap align-middle text-slate-950">{doc.regNo || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-bold whitespace-nowrap align-middle text-slate-950">{doc.ladSentDate || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-bold align-middle text-slate-950">{doc.sentLadOfficer || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-black whitespace-nowrap align-middle text-slate-950">{doc.receivedBranchDate || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-bold align-middle text-slate-950">{doc.receivedOfficerBranch || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-sans font-bold truncate max-w-[110px] align-middle text-slate-950">
                      {doc.documentsCollectedBy && doc.documentsCollectedBy.trim() !== ''
                        ? doc.documentsCollectedBy
                        : ''}
                    </td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-bold whitespace-nowrap align-middle text-slate-950">{doc.documentsCollectedNic || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-bold whitespace-nowrap align-middle text-slate-950">{doc.collectedDate || ''}</td>
                    <td className="p-1 border-[1.5px] border-slate-950 text-center font-sans text-[8px] align-middle">
                      {doc.collectedSignature ? (
                        doc.collectedSignature.startsWith('data:image') ? (
                          <img
                            src={doc.collectedSignature}
                            alt="Sign"
                            className="h-6 max-w-[55px] mx-auto object-contain"
                          />
                        ) : (
                          <span className="font-extrabold text-emerald-900">Signed</span>
                        )
                      ) : (
                        ''
                      )}
                    </td>
                    <td className="p-1 border-[1.5px] border-slate-950 font-sans font-bold truncate max-w-[100px] align-middle text-slate-950">
                      {doc.handedOverOfficerName || ''}
                    </td>
                    <td className="p-1 border-[1.5px] border-slate-950 text-center font-sans text-[8px] align-middle">
                      {doc.handedOverOfficerSignature ? (
                        <span className="font-extrabold text-slate-950">Verified</span>
                      ) : (
                        ''
                      )}
                    </td>
                  </tr>
                ))}

                {/* Official 60-Day Return to MC Row spanning across the entire chart length (15 columns) */}
                <tr className="hover:bg-slate-100 font-mono text-[9.5px]" style={{ height: '1.3cm' }}>
                  <td
                    colSpan={15}
                    className="p-2 border-[1.5px] border-slate-950 font-black text-slate-950 bg-slate-200/90 text-left pl-4 text-[9.5px] tracking-wide align-middle"
                  >
                    Deletion Document Return to MC &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {returnToMcDate}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Printable Official Sign-Off Footer */}
        <div className="mt-8 pt-6 border-t-2 border-slate-800 grid grid-cols-3 gap-6 text-xs text-slate-800 break-inside-avoid">
          <div className="border border-slate-300 p-3 rounded-lg flex flex-col justify-between min-h-[90px]">
            <div>
              <p className="font-bold uppercase text-[10px]">Prepared By:</p>
              <p className="text-[11px] mt-1 text-slate-600">Branch Operations Officer</p>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
              Signature & Date
            </div>
          </div>

          <div className="border border-slate-300 p-3 rounded-lg flex flex-col justify-between min-h-[90px]">
            <div>
              <p className="font-bold uppercase text-[10px]">Checked & Verified By:</p>
              <p className="text-[11px] mt-1 text-slate-600">Branch Manager / Assistant Manager</p>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
              Signature & Date
            </div>
          </div>

          <div className="border border-slate-300 p-3 rounded-lg flex flex-col justify-between min-h-[90px] text-center">
            <p className="font-bold uppercase text-[10px]">Official Branch Seal</p>
            <div className="my-auto text-[9px] text-slate-400 italic">
              [ Official Stamp Area ]
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documents={filteredDocs}
        branchName={branchName}
        branchCode={branchCode}
      />
    </div>
  );
};
