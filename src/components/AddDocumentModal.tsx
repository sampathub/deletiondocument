import React, { useState } from 'react';
import { PlusCircle, X, Check } from 'lucide-react';
import { DeletionDocument } from '../types/document';
import { formatDateDMY } from '../utils/dateUtils';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: DeletionDocument) => void;
  nextNo: number;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  nextNo,
}) => {
  if (!isOpen) return null;

  const today = formatDateDMY(new Date());

  const [no, setNo] = useState<string>(String(nextNo));
  const [contractNo, setContractNo] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientNic, setClientNic] = useState('');
  const [regNo, setRegNo] = useState('');
  const [ladSentDate, setLadSentDate] = useState(today);
  const [sentLadOfficer, setSentLadOfficer] = useState('14000496');
  const [receivedBranchDate, setReceivedBranchDate] = useState(today);
  const [receivedOfficerBranch, setReceivedOfficerBranch] = useState('14000084');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNo || !clientName) return;

    const newDoc: DeletionDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      no: isNaN(Number(no)) ? no : Number(no),
      contractNo: contractNo.trim().toUpperCase(),
      clientName: clientName.trim().toUpperCase(),
      clientNic: clientNic.trim().toUpperCase(),
      regNo: regNo.trim().toUpperCase(),
      ladSentDate: ladSentDate.trim(),
      sentLadOfficer: sentLadOfficer.trim(),
      receivedBranchDate: receivedBranchDate.trim(),
      receivedOfficerBranch: receivedOfficerBranch.trim(),
      documentsCollectedBy: '',
      documentsCollectedNic: '',
      collectedDate: '',
      collectedSignature: '',
      handedOverDate: '',
      handedOverOfficerName: '',
      handedOverOfficerSignature: '',
      remarks: remarks.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                New Deletion Document Entry (නව ලේඛනයක් එක්කිරීම)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add an individual deletion document arriving at the branch.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Serial / No *
              </label>
              <input
                type="text"
                required
                value={no}
                onChange={(e) => setNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Contract No *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. KEUV221306970"
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Client Name *
              </label>
              <input
                type="text"
                required
                placeholder="MR. H.M.K. JAYALATH"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Client NIC *
              </label>
              <input
                type="text"
                required
                placeholder="940083982V"
                value={clientNic}
                onChange={(e) => setClientNic(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Vehicle / Asset Reg No *
              </label>
              <input
                type="text"
                required
                placeholder="SG ABN-4772"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                LAD Sent Date (DD/MM/YYYY)
              </label>
              <input
                type="text"
                value={ladSentDate}
                onChange={(e) => setLadSentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Sent LAD Officer
              </label>
              <input
                type="text"
                value={sentLadOfficer}
                onChange={(e) => setSentLadOfficer(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Recived Branch Date (DD/MM/YYYY) *
              </label>
              <input
                type="text"
                required
                value={receivedBranchDate}
                onChange={(e) => setReceivedBranchDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Received Officer Branch
              </label>
              <input
                type="text"
                value={receivedOfficerBranch}
                onChange={(e) => setReceivedOfficerBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Initial Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Received via courier"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" /> Save to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
