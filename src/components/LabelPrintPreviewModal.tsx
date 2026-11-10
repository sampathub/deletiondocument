import React, { useMemo } from 'react';
import { Printer, Download, X, Tag, ExternalLink } from 'lucide-react';
import { DeletionDocument } from '../types/document';
import { parseDate, formatDateDMY } from '../utils/dateUtils';
import { printTargetElement, downloadPrintableHtml, openPrintTab } from '../utils/printHelper';

interface LabelPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DeletionDocument[];
  branchName?: string;
  branchCode?: string;
}

export const LabelPrintPreviewModal: React.FC<LabelPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  documents,
  branchName = 'COLOMBO CENTRAL BRANCH',
  branchCode = 'BR-140',
}) => {
  // Exclude dummy "return to mc" rows
  const validDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const contractLower = (doc.contractNo || '').toLowerCase();
      const clientLower = (doc.clientName || '').toLowerCase();
      const remarksLower = (doc.remarks || '').toLowerCase();
      return !(
        contractLower.includes('return to mc') ||
        clientLower.includes('return to mc') ||
        remarksLower.includes('return to mc')
      );
    });
  }, [documents]);

  const computeReturnToMcDate = (receivedDateStr?: string) => {
    if (!receivedDateStr) return '';
    const parsed = parseDate(receivedDateStr);
    if (!parsed) return '';
    const target = new Date(parsed.getTime());
    target.setDate(target.getDate() + 60);
    return formatDateDMY(target);
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    printTargetElement('modal-printable-labels-sheet', {
      title: 'Branch_Deletion_File_Labels_A4_Landscape',
      orientation: 'landscape',
      isLabels: true,
    });
  };

  const handleOpenTab = () => {
    openPrintTab('modal-printable-labels-sheet', 'Branch_Deletion_File_Labels_A4_Landscape', {
      orientation: 'landscape',
      isLabels: true,
    });
  };

  const handleDownload = () => {
    downloadPrintableHtml('modal-printable-labels-sheet', `Deletion_File_Labels_${Date.now()}.html`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex flex-col items-center p-2 sm:p-4 animate-in fade-in">
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="no-print w-full max-w-7xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 mb-3 flex flex-wrap items-center justify-between gap-3 sticky top-2 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Label Print Preview (A4 Landscape) · ලේබල් මුද්‍රණ පෙරදසුන
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {validDocuments.length} Labels
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each strip is exactly 1.5cm high with extra large Serial No & Vehicle No on standard A4 Landscape.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Download standalone single-file printable HTML"
          >
            <Download className="w-4 h-4" /> Save HTML
          </button>

          <button
            type="button"
            onClick={handleOpenTab}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Open clean printable document in new tab & print"
          >
            <ExternalLink className="w-4 h-4" /> Open in New Tab & Print
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer scale-100 hover:scale-[1.02]"
            title="Trigger A4 Landscape Print (Ctrl + P)"
          >
            <Printer className="w-4 h-4" /> Print Labels Now (A4 Landscape)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Helpful Hint Banner */}
      <div className="no-print w-full max-w-7xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl px-4 py-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-950 dark:text-indigo-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            <strong>මුද්‍රණ පෙරදසුන:</strong> පහත පෙනෙන පරිදි A4 Landscape කඩදාසියක 1.5cm පටි ආකාරයෙන් මුද්‍රණය වේ. මුද්‍රණය සඳහා <strong>'Print Labels Now'</strong> හෝ <strong>'Open in New Tab & Print'</strong> ක්ලික් කරන්න.
          </span>
        </div>
        <button
          type="button"
          onClick={handleOpenTab}
          className="font-bold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
        >
          ↗️ නව Tab එකෙන් Print කරන්න
        </button>
      </div>

      {/* Realistic A4 Landscape Paper Preview Canvas */}
      <div className="w-full max-w-7xl overflow-x-auto pb-8 flex justify-center">
        <div
          id="modal-printable-labels-sheet"
          className="print-card bg-white text-slate-950 p-6 rounded-xl shadow-2xl border border-slate-400 w-full max-w-[1280px]"
          style={{ minHeight: '190mm' }}
        >
          {validDocuments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 italic">
              ලේබල් මුද්‍රණය සඳහා ලේඛන කිසිවක් තෝරා නොමැත.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {validDocuments.map((doc, idx) => {
                const returnDateStr = computeReturnToMcDate(doc.receivedBranchDate);

                return (
                  <table
                    key={doc.id || idx}
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
                      marginBottom: '8px',
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
