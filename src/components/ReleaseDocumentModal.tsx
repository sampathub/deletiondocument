import React, { useState, useEffect } from 'react';
import { CheckCircle2, UserCheck, ShieldCheck, X, FileText, Calendar } from 'lucide-react';
import { DeletionDocument } from '../types/document';
import { formatDateDMY } from '../utils/dateUtils';
import { SignaturePad } from './SignaturePad';

interface ReleaseDocumentModalProps {
  document: DeletionDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRelease: (updatedDoc: DeletionDocument, andPrintVoucher?: boolean) => void;
}

export const ReleaseDocumentModal: React.FC<ReleaseDocumentModalProps> = ({
  document,
  isOpen,
  onClose,
  onConfirmRelease,
}) => {
  if (!isOpen || !document) return null;

  const todayStr = formatDateDMY(new Date());

  const [collectedBy, setCollectedBy] = useState(
    document.documentsCollectedBy || document.clientName || ''
  );
  const [collectedNic, setCollectedNic] = useState(
    document.documentsCollectedNic || document.clientNic || ''
  );
  const [collectedDate, setCollectedDate] = useState(
    document.collectedDate || todayStr
  );
  const [collectedSignature, setCollectedSignature] = useState(
    document.collectedSignature || 'Signed in Physical Register (Verified with Original NIC)'
  );
  const [handedOverDate, setHandedOverDate] = useState(
    document.handedOverDate || todayStr
  );
  const [officerName, setOfficerName] = useState(
    document.handedOverOfficerName || 'Branch Operations Officer (14000084)'
  );
  const [officerSignature, setOfficerSignature] = useState(
    document.handedOverOfficerSignature || 'Officer Signed'
  );
  const [remarks, setRemarks] = useState(document.remarks || '');
  const [isRepresentative, setIsRepresentative] = useState(
    Boolean(document.documentsCollectedBy && document.documentsCollectedBy !== document.clientName)
  );

  const handleSelfFill = () => {
    setCollectedBy(document.clientName);
    setCollectedNic(document.clientNic);
    setIsRepresentative(false);
  };

  const handleSubmit = (andPrintVoucher: boolean = false) => {
    const updated: DeletionDocument = {
      ...document,
      documentsCollectedBy: collectedBy.trim(),
      documentsCollectedNic: collectedNic.trim(),
      collectedDate: collectedDate.trim(),
      collectedSignature: collectedSignature.trim() || 'Signed in Register',
      handedOverDate: handedOverDate.trim(),
      handedOverOfficerName: officerName.trim(),
      handedOverOfficerSignature: officerSignature.trim() || 'Officer Verified',
      remarks: remarks.trim(),
      updatedAt: new Date().toISOString(),
    };

    onConfirmRelease(updated, andPrintVoucher);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Release Deletion Document (ලේඛන භාරදීම)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record client/representative acknowledgment and branch officer authorization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Document Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Serial / No</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">#{document.no}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Contract No</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{document.contractNo}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Vehicle / Reg No</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{document.regNo}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Received at Branch</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{document.receivedBranchDate}</span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500">Registered Client: </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{document.clientName}</span>
                <span className="text-slate-400 ml-1.5">({document.clientNic})</span>
              </div>
            </div>
          </div>

          {/* Section 1: Collection Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Recipient / Collecting Party
              </h4>
              <button
                type="button"
                onClick={handleSelfFill}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Autofill Customer Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Documents Collected By (Name) *
                </label>
                <input
                  type="text"
                  required
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                  placeholder="Full name of person collecting"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Recipient NIC Number *
                </label>
                <input
                  type="text"
                  required
                  value={collectedNic}
                  onChange={(e) => setCollectedNic(e.target.value)}
                  placeholder="e.g. 940083982V or 200012345678"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Collected Date (DD/MM/YYYY) *
                </label>
                <input
                  type="text"
                  value={collectedDate}
                  onChange={(e) => setCollectedDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="repCheck"
                  checked={isRepresentative}
                  onChange={(e) => setIsRepresentative(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="repCheck" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  Collected by Authorized Representative / Power of Attorney
                </label>
              </div>
            </div>

            {/* Recipient Signature Pad */}
            <SignaturePad
              value={collectedSignature}
              onChange={setCollectedSignature}
              label="Recipient Signature / Fingerprint Verification"
            />
          </div>

          {/* Section 2: Handover Branch Officer */}
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Handed Over Branch Officer (භාරදුන් නිලධාරියා)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Handed Over Officer Name & ID *
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="e.g. K.D. CHATHURANGA (14000084)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Handed Over Date *
                </label>
                <input
                  type="text"
                  value={handedOverDate}
                  onChange={(e) => setHandedOverDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Handover Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. CR Book original & Deletion Letter released. Identity verified."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" /> Save & Print Voucher
          </button>
          <button
            type="button"
            disabled={!collectedBy || !collectedNic}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirm Release & Update Main Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
