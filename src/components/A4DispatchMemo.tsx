import React from 'react';
import { Printer, ArrowLeft, Building, Truck, ShieldCheck } from 'lucide-react';
import { DeletionDocument } from '../types/document';
import { printTargetElement } from '../utils/printHelper';

interface A4DispatchMemoProps {
  documents: DeletionDocument[];
  onBack: () => void;
  branchName?: string;
  branchCode?: string;
}

export const A4DispatchMemo: React.FC<A4DispatchMemoProps> = ({
  documents,
  onBack,
  branchName = 'COLOMBO CENTRAL BRANCH',
  branchCode = 'BR-140',
}) => {
  if (!documents || documents.length === 0) return null;

  const firstDoc = documents[0];
  const isHeadOffice = firstDoc.dispatchStatus === 'DISPATCHED_HO';
  const destination = firstDoc.dispatchedTo || (isHeadOffice ? 'Head Office (LAD)' : 'Another Branch');
  const dispatchDate = firstDoc.dispatchDate || new Date().toLocaleDateString('en-GB');
  const courierRef = firstDoc.dispatchCourierRef || 'Internal Courier';
  const officer = firstDoc.dispatchOfficer || 'Branch Operations Officer';
  const reason = firstDoc.dispatchReason || 'Return to Safe Custody / Branch Transfer';

  const handlePrint = () => {
    printTargetElement('printable-dispatch-memo', {
      title: `Dispatch_Memo_${destination.replace(/\s+/g, '_')}`,
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Header (Hidden on print) */}
      <div className="no-print p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Ledger
        </button>
        <button
          onClick={handlePrint}
          className="print-allow inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> Print A4 Dispatch Memo / Manifest
        </button>
      </div>

      {/* Official A4 Document Canvas */}
      <div id="printable-dispatch-memo" className="print-card bg-white text-slate-900 rounded-2xl border-2 border-slate-800 shadow-md p-8 max-w-4xl mx-auto">
        {/* Memo Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase text-slate-900">
                OFFICIAL DOCUMENT DISPATCH & TRANSFER MEMORANDUM
              </h1>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                {branchName} ({branchCode}) · DELETION DOCUMENT CUSTODY DIVISION
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-600 font-mono">
              <p>Dispatch Date: {dispatchDate}</p>
              <p>Ref: LAD-DISP-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Dispatch Destination:</span>
              <strong className="text-slate-900">{destination}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Mode / Courier Ref:</span>
              <span className="text-slate-800 font-mono">{courierRef}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Dispatching Officer:</span>
              <span className="text-slate-800">{officer}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Packets / Docs:</span>
              <span className="text-slate-900 font-bold font-mono">{documents.length} File{documents.length > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-bold text-slate-700">Official Transfer Justification: </span>
            <span className="text-slate-800">{reason}</span>
          </div>
        </div>

        {/* Itemized Table of Dispatched Documents */}
        <div className="my-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Itemized Manifest of Documents Enclosed:
          </h3>
          <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase">
                <th className="p-1.5 border border-slate-300 w-10 text-center">Item</th>
                <th className="p-1.5 border border-slate-300">Contract No</th>
                <th className="p-1.5 border border-slate-300">Client Name</th>
                <th className="p-1.5 border border-slate-300">Client NIC</th>
                <th className="p-1.5 border border-slate-300">Vehicle / Reg No</th>
                <th className="p-1.5 border border-slate-300">Branch Recvd Date</th>
                <th className="p-1.5 border border-slate-300">Enclosed Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[10px]">
              {documents.map((d, i) => (
                <tr key={d.id || i}>
                  <td className="p-1.5 border border-slate-300 text-center font-bold">{i + 1}</td>
                  <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{d.contractNo}</td>
                  <td className="p-1.5 border border-slate-300 font-sans font-semibold">{d.clientName}</td>
                  <td className="p-1.5 border border-slate-300">{d.clientNic}</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">{d.regNo}</td>
                  <td className="p-1.5 border border-slate-300">{d.receivedBranchDate}</td>
                  <td className="p-1.5 border border-slate-300 font-sans text-[9px] text-slate-600">
                    Original Deletion Letter, CR Book / Title Clearance
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sign-Off & Acknowledgment Grid */}
        <div className="mt-8 pt-4 border-t-2 border-slate-800 grid grid-cols-3 gap-6 text-xs text-slate-800 break-inside-avoid">
          {/* Dispatching Branch Officer */}
          <div className="border border-slate-300 p-3 rounded-lg flex flex-col justify-between min-h-[95px]">
            <div>
              <p className="font-bold uppercase text-[10px]">Dispatched By (Branch Officer):</p>
              <p className="text-[11px] mt-1 text-slate-600">{officer}</p>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
              Signature & Date
            </div>
          </div>

          {/* Branch Manager Approval */}
          <div className="border border-slate-300 p-3 rounded-lg flex flex-col justify-between min-h-[95px]">
            <div>
              <p className="font-bold uppercase text-[10px]">Authorized By (Branch Manager):</p>
              <p className="text-[11px] mt-1 text-slate-600">Branch Operations Head</p>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
              Signature & Date
            </div>
          </div>

          {/* Receiving Party / Courier Acknowledgment */}
          <div className="border border-slate-300 p-3 rounded-lg flex flex-col justify-between min-h-[95px]">
            <div>
              <p className="font-bold uppercase text-[10px]">Received By (Courier / Destination):</p>
              <p className="text-[11px] mt-1 text-slate-600">Name & NIC of Recipient / Courier</p>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
              Acknowledgment Signature & Stamp
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
          Note: This document accompanies sensitive legal vehicle registration papers. Maintain one signed copy at branch dispatch records.
        </div>
      </div>
    </div>
  );
};
