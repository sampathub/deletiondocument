import React from 'react';
import { Printer, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import { DeletionDocument } from '../types/document';
import { printTargetElement } from '../utils/printHelper';

interface A4ReleaseReceiptProps {
  document: DeletionDocument;
  onBack: () => void;
  branchName?: string;
}

export const A4ReleaseReceipt: React.FC<A4ReleaseReceiptProps> = ({
  document,
  onBack,
  branchName = 'COLOMBO CENTRAL BRANCH',
}) => {
  const handlePrint = () => {
    printTargetElement('printable-release-voucher', {
      title: `Deletion_Release_${document.contractNo}`,
      orientation: 'portrait',
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Header (Hidden during print) */}
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
          <Printer className="w-4 h-4" /> Print Customer Handover Voucher (A4/A5)
        </button>
      </div>

      {/* Voucher Canvas */}
      <div id="printable-release-voucher" className="print-card bg-white text-slate-900 rounded-2xl border-2 border-slate-800 shadow-md p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center border-b-2 border-slate-800 pb-4">
          <h2 className="text-lg font-black tracking-tight uppercase">
            DELETION DOCUMENT HANDOVER & RELEASE ACKNOWLEDGMENT
          </h2>
          <p className="text-xs font-semibold text-slate-700 mt-1">
            {branchName} · LEGAL & LEASING DOCUMENT OPERATIONS
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono mt-1">
            <span>Doc Serial No: #{document.no}</span>
            <span>·</span>
            <span>Voucher Date: {document.collectedDate || document.handedOverDate || new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>

        {/* Contract & Client Identification */}
        <div className="my-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Contract / Lease No:</span>
              <span className="font-bold font-mono text-sm text-slate-900">{document.contractNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Vehicle / Asset Reg No:</span>
              <span className="font-bold font-mono text-sm text-slate-900">{document.regNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Registered Client Name:</span>
              <span className="font-semibold text-slate-900">{document.clientName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Client NIC Number:</span>
              <span className="font-semibold font-mono text-slate-900">{document.clientNic}</span>
            </div>
          </div>

          {/* Acknowledgement statement */}
          <div className="p-4 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-700">
            <p className="font-medium text-slate-900 mb-1">
              Acknowledgment of Receipt (ලියකියවිලි ලැබුණු බවට තහවුරු කිරීම):
            </p>
            <p>
              I hereby acknowledge receipt of the original deletion letter, Certificate of Registration (CR Book / Title Deeds), and related clearance documents pertaining to the above mentioned facility, in complete and undamaged condition.
            </p>
            {document.remarks && (
              <p className="mt-2 text-[11px] text-slate-500 italic">
                Note: {document.remarks}
              </p>
            )}
          </div>

          {/* Signatures & Collection Identity */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-300 text-xs">
            {/* Recipient */}
            <div className="p-3 border border-slate-300 rounded-xl space-y-2">
              <span className="font-bold text-[10px] uppercase text-slate-500 block">Collected By (Recipient):</span>
              <p className="font-semibold text-slate-900">{document.documentsCollectedBy || document.clientName}</p>
              <p className="text-[11px] font-mono text-slate-600">NIC: {document.documentsCollectedNic || document.clientNic}</p>
              <p className="text-[11px] text-slate-500">Date: {document.collectedDate}</p>
              
              <div className="mt-3 pt-3 border-t border-dashed border-slate-300 min-h-[50px] flex items-center justify-center">
                {document.collectedSignature?.startsWith('data:image') ? (
                  <img src={document.collectedSignature} alt="Recipient Signature" className="h-10 object-contain" />
                ) : (
                  <span className="text-xs font-semibold text-emerald-800">
                    {document.collectedSignature || 'Signed & Verified'}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 block text-center">Customer / Recipient Signature</span>
            </div>

            {/* Branch Officer */}
            <div className="p-3 border border-slate-300 rounded-xl space-y-2">
              <span className="font-bold text-[10px] uppercase text-slate-500 block">Handed Over Officer:</span>
              <p className="font-semibold text-slate-900">{document.handedOverOfficerName || 'Branch Officer'}</p>
              <p className="text-[11px] text-slate-500">Branch: {branchName}</p>
              <p className="text-[11px] text-slate-500">Date: {document.handedOverDate || document.collectedDate}</p>

              <div className="mt-3 pt-3 border-t border-dashed border-slate-300 min-h-[50px] flex items-center justify-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>{document.handedOverOfficerSignature || 'Officer Authorized'}</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 block text-center">Branch Officer Signature & Stamp</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
          This is an official document handover receipt generated by the Branch Deletion Management System.
        </div>
      </div>
    </div>
  );
};
