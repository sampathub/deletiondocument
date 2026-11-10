import React, { useState, useMemo } from 'react';
import { ArrowLeft, Printer, Tag, Download, Calendar, Filter, FileText, CheckSquare, Square, Eye, ExternalLink } from 'lucide-react';
import { DeletionDocument } from '../types/document';
import { parseDate, formatDateDMY } from '../utils/dateUtils';
import { printTargetElement, downloadPrintableHtml, openPrintTab } from '../utils/printHelper';
import { LabelPrintPreviewModal } from './LabelPrintPreviewModal';

interface A4LabelPrintProps {
  documents: DeletionDocument[];
  onBack: () => void;
  branchName?: string;
  branchCode?: string;
  initialDateFilter?: {
    mode: 'RANGE' | 'SINGLE';
    startDate?: string;
    endDate?: string;
    singleDate?: string;
  };
}

export const A4LabelPrint: React.FC<A4LabelPrintProps> = ({
  documents,
  onBack,
  branchName = 'COLOMBO CENTRAL BRANCH',
  branchCode = 'BR-140',
  initialDateFilter,
}) => {
  const [filterMode, setFilterMode] = useState<'RANGE' | 'SINGLE'>(
    initialDateFilter?.mode || 'RANGE'
  );
  const [singleDate, setSingleDate] = useState<string>(
    initialDateFilter?.singleDate || ''
  );
  const [startDate, setStartDate] = useState<string>(
    initialDateFilter?.startDate || ''
  );
  const [endDate, setEndDate] = useState<string>(
    initialDateFilter?.endDate || ''
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RELEASED'>('ALL');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  
  // Custom manual selection (all selected by default)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionInitialized, setIsSelectionInitialized] = useState<boolean>(false);

  // Filtered documents strictly by Received Branch Date
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Exclude dummy "return to mc" rows
      const contractLower = (doc.contractNo || '').toLowerCase();
      const clientLower = (doc.clientName || '').toLowerCase();
      const remarksLower = (doc.remarks || '').toLowerCase();
      if (
        contractLower.includes('return to mc') ||
        clientLower.includes('return to mc') ||
        remarksLower.includes('return to mc')
      ) {
        return false;
      }

      // Status filter
      const isDocReleased = Boolean(doc.collectedDate && doc.collectedDate.trim() !== '');
      if (statusFilter === 'PENDING' && isDocReleased) return false;
      if (statusFilter === 'RELEASED' && !isDocReleased) return false;

      // Date filtering strictly on receivedBranchDate
      const isDateFilteringActive =
        (filterMode === 'SINGLE' && Boolean(singleDate)) ||
        (filterMode === 'RANGE' && Boolean(startDate || endDate));

      if (isDateFilteringActive) {
        if (!doc.receivedBranchDate || !doc.receivedBranchDate.trim()) return false;
        const targetDate = parseDate(doc.receivedBranchDate);
        if (!targetDate) return false;

        // Single Date
        if (filterMode === 'SINGLE' && singleDate) {
          const sDate = parseDate(singleDate);
          if (!sDate) return false;
          const isSameDay =
            targetDate.getFullYear() === sDate.getFullYear() &&
            targetDate.getMonth() === sDate.getMonth() &&
            targetDate.getDate() === sDate.getDate();
          if (!isSameDay) return false;
        }

        // Date Range
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
  }, [documents, filterMode, singleDate, startDate, endDate, statusFilter]);

  // Sorted documents chronologically by receivedBranchDate
  const sortedDocs = useMemo(() => {
    return [...filteredDocs].sort((a, b) => {
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

  // Keep selection in sync when filter changes if not manually overridden
  const activeDocs = useMemo(() => {
    if (!isSelectionInitialized) {
      return sortedDocs;
    }
    return sortedDocs.filter((d) => selectedIds.has(d.id));
  }, [sortedDocs, selectedIds, isSelectionInitialized]);

  const toggleSelectDoc = (id: string) => {
    if (!isSelectionInitialized) {
      // initialize with all except this one
      const newSet = new Set(sortedDocs.map((d) => d.id));
      newSet.delete(id);
      setSelectedIds(newSet);
      setIsSelectionInitialized(true);
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(sortedDocs.map((d) => d.id)));
    setIsSelectionInitialized(true);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
    setIsSelectionInitialized(true);
  };

  // Helper to compute return to MC date (exactly 60 days after receivedBranchDate)
  const computeReturnToMcDate = (receivedDateStr?: string) => {
    if (!receivedDateStr) return '';
    const parsed = parseDate(receivedDateStr);
    if (!parsed) return '';
    const target = new Date(parsed.getTime());
    target.setDate(target.getDate() + 60);
    return formatDateDMY(target);
  };

  const handlePrintLabels = () => {
    setIsPreviewOpen(true);
  };

  const handleOpenTabLabels = () => {
    openPrintTab('printable-labels-sheet', `Branch_Deletion_File_Labels_A4_Landscape`, {
      orientation: 'landscape',
      isLabels: true,
    });
  };

  const handleDownloadLabelsHtml = () => {
    downloadPrintableHtml('printable-labels-sheet', `Deletion_File_Labels_${Date.now()}.html`);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden during Print) */}
      <div className="no-print p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Return to Main Ledger"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Label Print (ලේබල් මුද්‍රණය - 1.5cm තීරු පටි)
                </h2>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                  {activeDocs.length} Labels Selected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                දින පරාසය (Date Range) තෝරා ලේඛන ගොනු (File Strips) සඳහා 1.5cm ප්‍රමාණයේ ලේබල් පටි මුද්‍රණය කරගන්න.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadLabelsHtml}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Save standalone HTML file"
            >
              <Download className="w-4 h-4" /> Save HTML
            </button>
            <button
              type="button"
              onClick={handleOpenTabLabels}
              disabled={activeDocs.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white shadow-xs transition-colors cursor-pointer"
              title="Open clean printable labels sheet in new tab and print"
            >
              <ExternalLink className="w-4 h-4" /> Open in New Tab & Print
            </button>
            <button
              type="button"
              onClick={handlePrintLabels}
              disabled={activeDocs.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white shadow-sm transition-colors cursor-pointer"
              title="Print A4 Landscape Labels (Ctrl + P)"
            >
              <Printer className="w-4 h-4" /> Print Labels A4 Landscape ({activeDocs.length})
            </button>
          </div>
        </div>

        {/* Date Filters Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Filter Mode */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Date Filter Mode
            </label>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setFilterMode('RANGE')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
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
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterMode === 'SINGLE'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Single Date
              </button>
            </div>
          </div>

          {/* Date Inputs */}
          {filterMode === 'RANGE' ? (
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  From Date (Recived Branch Date)
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
                  To Date (Recived Branch Date)
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
                Select Date (Recived Branch Date)
              </label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Document Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="ALL">All Documents (සියල්ල)</option>
              <option value="PENDING">Pending at Branch (භාරනොගත්)</option>
              <option value="RELEASED">Released (භාරදුන්)</option>
            </select>
          </div>
        </div>

        {/* Toolbar Sub-bar: Select/Deselect and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Select:</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              All ({sortedDocs.length})
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-slate-600 dark:text-slate-400 font-semibold hover:underline cursor-pointer"
            >
              Clear Selection
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Sort chronologically by Recived Branch Date"
            >
              <span>Sort:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {sortDirection === 'asc' ? 'Oldest First (Asc ↑)' : 'Newest First (Desc ↓)'}
              </span>
            </button>

            {(startDate || endDate || singleDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSingleDate('');
                }}
                className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Printable Labels Canvas */}
      <div className="bg-white text-slate-900 rounded-2xl border border-slate-300 shadow-md p-4 sm:p-8 max-w-[950px] mx-auto">
        <div className="no-print flex items-center justify-between pb-3 mb-4 border-b border-slate-200 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-indigo-600" />
            <span>Label Strip Preview (1.5cm Height per Label Strip)</span>
          </div>
          <span className="text-slate-500 font-mono">
            {activeDocs.length} Label{activeDocs.length === 1 ? '' : 's'} to Print
          </span>
        </div>

        {/* Printable Container targeted by Print Engine */}
        <div id="printable-labels-sheet" className="w-full">
          {activeDocs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 italic">
              ලේබල් මුද්‍රණය සඳහා ලේඛන කිසිවක් තෝරා නොමැත. කරුණාකර දින පරාසය වෙනස් කරන්න හෝ ලේඛනයක් තෝරන්න.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeDocs.map((doc, idx) => {
                const returnDateStr = computeReturnToMcDate(doc.receivedBranchDate);
                const isSelected = !isSelectionInitialized || selectedIds.has(doc.id);

                return (
                  <div key={doc.id || idx} className="flex items-stretch gap-1.5" style={{ display: 'flex', alignItems: 'stretch', gap: '6px' }}>
                    {/* Checkbox for quick exclusion (hidden during print) */}
                    <div
                      onClick={() => toggleSelectDoc(doc.id)}
                      className="no-print w-7 bg-slate-100 hover:bg-indigo-50 border border-slate-300 rounded-md flex items-center justify-center cursor-pointer select-none shrink-0"
                      title="Click to toggle selection for print"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <table
                      className="label-strip-table"
                      style={{
                        width: '100%',
                        tableLayout: 'fixed',
                        borderCollapse: 'collapse',
                        border: '1.5px solid #000000',
                        height: '1.5cm',
                        minHeight: '1.5cm',
                        maxHeight: '1.5cm',
                        backgroundColor: '#ffffff',
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid',
                      }}
                    >
                      <colgroup>
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '37%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '15%' }} />
                      </colgroup>
                      <tbody>
                        <tr style={{ height: '1.5cm' }}>
                          {/* Column 1: No */}
                          <td
                            style={{
                              borderRight: '1.5px solid #000000',
                              padding: '1px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              backgroundColor: '#f1f5f9',
                            }}
                          >
                            <div style={{ fontSize: '7.5px', fontFamily: 'sans-serif', fontWeight: '800', textTransform: 'uppercase', color: '#475569', lineHeight: 1 }}>
                              NO
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'monospace', color: '#000000', marginTop: '2px', lineHeight: 1 }}>
                              {doc.no || idx + 1}
                            </div>
                          </td>

                          {/* Column 2: Contract No */}
                          <td
                            style={{
                              borderRight: '1.5px solid #000000',
                              padding: '1px 8px',
                              verticalAlign: 'middle',
                            }}
                          >
                            <div style={{ fontSize: '7.5px', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', lineHeight: 1 }}>
                              CONTRACT NO
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'monospace', color: '#000000', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.contractNo || '—'}
                            </div>
                          </td>

                          {/* Column 3: Client Name & NIC */}
                          <td
                            style={{
                              borderRight: '1.5px solid #000000',
                              padding: '1px 10px',
                              verticalAlign: 'middle',
                            }}
                          >
                            <div style={{ fontSize: '7.5px', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', lineHeight: 1 }}>
                              CLIENT NAME & NIC
                            </div>
                            <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: '900', fontFamily: 'sans-serif', textTransform: 'uppercase', color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {doc.clientName || '—'}
                              </span>
                              <span style={{ fontSize: '10.5px', fontWeight: '800', fontFamily: 'monospace', color: '#1e293b', flexShrink: 0 }}>
                                [{doc.clientNic || 'NO NIC'}]
                              </span>
                            </div>
                          </td>

                          {/* Column 4: Vehicle / Reg No */}
                          <td
                            style={{
                              borderRight: '1.5px solid #000000',
                              padding: '1px 8px',
                              verticalAlign: 'middle',
                              backgroundColor: '#f8fafc',
                            }}
                          >
                            <div style={{ fontSize: '7.5px', fontFamily: 'sans-serif', fontWeight: '800', textTransform: 'uppercase', color: '#475569', lineHeight: 1 }}>
                              VEHICLE / REG NO
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'monospace', color: '#000000', marginTop: '2px', lineHeight: 1, letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.regNo || '—'}
                            </div>
                          </td>

                          {/* Column 5: Return to MC Date */}
                          <td
                            style={{
                              padding: '1px 8px',
                              verticalAlign: 'middle',
                              backgroundColor: '#fffbeb',
                            }}
                          >
                            <div style={{ fontSize: '7.5px', fontFamily: 'sans-serif', fontWeight: '900', textTransform: 'uppercase', color: '#be123c', lineHeight: 1 }}>
                              RETURN TO MC DATE
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '900', fontFamily: 'monospace', color: '#881337', marginTop: '2px', lineHeight: 1 }}>
                              {returnDateStr || '—'}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Print Instruction Box */}
        <div className="no-print mt-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <span>
              <strong>ලේබල් උපදෙස්:</strong> එක් එක් ලේබලයක උස හරියටම 1.5cm වන පරිදි සකසා ඇත. A4 කඩදාසියක හෝ Sticker Sheet එකක මුද්‍රණය කර ලේඛන ගොනුවල (Files) පහසුවෙන්ම ඇලවිය හැක.
            </span>
          </div>
          <button
            type="button"
            onClick={handlePrintLabels}
            disabled={activeDocs.length === 0}
            className="px-3 py-1.5 font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-400 cursor-pointer shrink-0"
          >
            Print Now
          </button>
        </div>
      </div>

      {/* Interactive Label Print Preview Modal (A4 Landscape) */}
      <LabelPrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documents={activeDocs}
        branchName={branchName}
        branchCode={branchCode}
      />
    </div>
  );
};
