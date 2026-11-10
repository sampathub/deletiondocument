import React, { useState, useMemo } from 'react';
import { Printer, Download, X, Eye, FileText, Check, CheckSquare, Square, ExternalLink } from 'lucide-react';
import { DocumentWithSla } from '../types/document';
import { parseDate, formatDateDMY } from '../utils/dateUtils';
import { printTargetElement, downloadPrintableHtml, openPrintTab } from '../utils/printHelper';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentWithSla[];
  branchName?: string;
  branchCode?: string;
  reportTitle?: string;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  documents,
  branchName = 'COLOMBO CENTRAL BRANCH',
  branchCode = 'BR-140',
  reportTitle = 'BRANCH DELETION DOCUMENT REGISTER',
}) => {
  const [showSignatures, setShowSignatures] = useState<boolean>(false);

  // Filter out any existing dummy return row from the document list
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

  // Compute exactly 60 days after the Received Branch Date
  const returnToMcDate = useMemo(() => {
    let refDate: Date | null = null;
    for (const d of documents) {
      const contractLower = (d.contractNo || '').toLowerCase();
      const clientLower = (d.clientName || '').toLowerCase();
      if (!contractLower.includes('return to mc') && !clientLower.includes('return to mc') && d.receivedBranchDate) {
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
  }, [documents]);

  if (!isOpen) return null;

  const handlePrint = () => {
    printTargetElement('printable-pure-chart', {
      title: 'Branch_Deletion_Document_Register',
      orientation: 'landscape',
    });
  };

  const handleOpenTab = () => {
    openPrintTab('printable-pure-chart', 'Branch_Deletion_Document_Register');
  };

  const handleDownload = () => {
    downloadPrintableHtml('printable-pure-chart', `Deletion_Chart_${Date.now()}.html`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex flex-col items-center p-2 sm:p-4 animate-in fade-in">
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="no-print w-full max-w-7xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 mb-3 flex flex-wrap items-center justify-between gap-3 sticky top-2 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Print Preview (A4 Landscape) · මුද්‍රණ පෙරදසුන
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {validDocuments.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only the pure 15-column ledger chart with 60-day MC Return footer will be printed on standard A4 Landscape.
            </p>
          </div>
        </div>

        {/* Toggles & Print Buttons */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 select-none">
            <input
              type="checkbox"
              checked={showSignatures}
              onChange={(e) => setShowSignatures(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Branch Signatures</span>
          </label>

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
            title="Open clean printable document in new tab"
          >
            <ExternalLink className="w-4 h-4" /> Open in New Tab & Print
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer scale-100 hover:scale-[1.02]"
            title="Trigger A4 Landscape Print (Ctrl + P)"
          >
            <Printer className="w-4 h-4" /> Print Chart Now (A4 Landscape)
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

      {/* Helpful Hint Banner for IFrame Users */}
      <div className="no-print w-full max-w-7xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl px-4 py-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-950 dark:text-indigo-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            <strong>මුද්‍රණ ඉඟිය:</strong> බ්‍රවුසරයේ Preview කවුළුව තුළ Print Window එක නොපෙනේ නම්, <strong>'Open in New Tab & Print'</strong> හෝ <strong>'Save HTML'</strong> ක්ලික් කර සෘජුවම Print ලබාගන්න.
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

      {/* Realistic A4 Paper Preview Canvas */}
      <div className="w-full max-w-7xl overflow-x-auto pb-8 flex justify-center">
        <div
          id="printable-pure-chart"
          className="print-card bg-white text-slate-950 pb-6 px-4 sm:px-6 rounded-xl shadow-2xl border border-slate-400 w-full max-w-[1280px]"
          style={{ paddingTop: '1.25in' }}
        >
          {/* The Exact 15-Column Pure Chart requested by User (Zero Extra Headers, Handed Over Date removed) */}
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
              <tr className="bg-slate-200 text-slate-950 font-extrabold uppercase text-[7.5px] leading-tight tracking-tight">
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
              {validDocuments.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-6 text-center text-slate-500 italic font-sans text-xs">
                    No documents to print for this selection.
                  </td>
                </tr>
              ) : (
                <>
                  {validDocuments.map((doc, idx) => (
                    <tr key={doc.id || idx} className="hover:bg-slate-50 font-bold" style={{ height: '1.45cm' }}>
                      <td className="p-1 border-[1.5px] border-slate-950 text-center font-black truncate align-middle text-slate-950">{doc.no || ''}</td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-bold truncate align-middle text-slate-950">{doc.contractNo || ''}</td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-sans font-bold uppercase truncate align-middle text-slate-950">
                        {doc.clientName || ''}
                      </td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-bold truncate align-middle text-slate-950">{doc.clientNic || ''}</td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-bold truncate align-middle text-slate-950">{doc.regNo || ''}</td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-bold truncate align-middle text-slate-950">{doc.ladSentDate || ''}</td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-bold truncate align-middle text-slate-950">{doc.sentLadOfficer || ''}</td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-black truncate align-middle text-slate-950">
                        {doc.receivedBranchDate || ''}
                      </td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-bold truncate align-middle text-slate-950">{doc.receivedOfficerBranch || ''}</td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-sans font-bold text-slate-950 truncate align-middle">
                        {doc.documentsCollectedBy && doc.documentsCollectedBy.trim() !== ''
                          ? doc.documentsCollectedBy
                          : ''}
                      </td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-bold truncate align-middle text-slate-950">{doc.documentsCollectedNic || ''}</td>
                      <td className="p-1 border-[1.5px] border-slate-950 font-bold truncate align-middle text-slate-950">{doc.collectedDate || ''}</td>
                      <td className="p-1 border-[1.5px] border-slate-950 text-center text-[7.5px] truncate align-middle">
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
                      <td className="p-1 border-[1.5px] border-slate-950 font-sans font-bold truncate align-middle text-slate-950">
                        {doc.handedOverOfficerName || ''}
                      </td>
                      <td className="p-1 border-[1.5px] border-slate-950 text-center text-[7.5px] truncate align-middle">
                        {doc.handedOverOfficerSignature ? (
                          <span className="font-extrabold text-slate-950">Verified</span>
                        ) : (
                          ''
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Official 60-Day Return to MC Row spanning across the entire chart width (15 columns) */}
                  <tr className="hover:bg-slate-100 font-mono text-[9.5px]" style={{ height: '1.3cm' }}>
                    <td
                      colSpan={15}
                      className="p-2 border-[1.5px] border-slate-950 font-black text-slate-950 bg-slate-200/90 text-left pl-4 text-[9.5px] tracking-wide align-middle"
                    >
                      Deletion Document Return to MC &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {returnToMcDate}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          {/* Optional Official Sign-Off Footer */}
          {showSignatures && (
            <div className="mt-6 pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-[10px] text-slate-900 break-inside-avoid">
              <div className="border border-slate-400 p-2.5 rounded-lg flex flex-col justify-between min-h-[75px]">
                <div>
                  <p className="font-bold uppercase text-[9px]">Prepared By:</p>
                  <p className="text-[10px] mt-0.5 text-slate-700">Branch Operations Officer</p>
                </div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[9px] text-slate-500">
                  Signature & Date
                </div>
              </div>

              <div className="border border-slate-400 p-2.5 rounded-lg flex flex-col justify-between min-h-[75px]">
                <div>
                  <p className="font-bold uppercase text-[9px]">Checked & Verified By:</p>
                  <p className="text-[10px] mt-0.5 text-slate-700">Branch Manager / Assistant Manager</p>
                </div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[9px] text-slate-500">
                  Signature & Date
                </div>
              </div>

              <div className="border border-slate-400 p-2.5 rounded-lg flex flex-col justify-between min-h-[75px] text-center">
                <p className="font-bold uppercase text-[9px]">Official Branch Seal</p>
                <div className="my-auto text-[9px] text-slate-400 italic">
                  [ Official Branch Stamp Area ]
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
