import React, { useState } from 'react';
import { Send, Building, Truck, CheckCircle, X, FileText, Calendar, ArrowRight } from 'lucide-react';
import { DeletionDocument, DocumentWithSla } from '../types/document';
import { formatDateDMY } from '../utils/dateUtils';

interface DispatchTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentsToDispatch: DocumentWithSla[];
  onConfirmDispatch: (
    dispatchedDocs: DeletionDocument[],
    dispatchMeta: {
      type: 'DISPATCHED_HO' | 'TRANSFERRED_BRANCH';
      destination: string;
      dispatchDate: string;
      courierRef: string;
      officer: string;
      reason: string;
    },
    printMemo?: boolean
  ) => void;
}

const COMMON_BRANCHES = [
  'Head Office (LAD - Legal Administration Dept)',
  'Kandy Branch',
  'Gampaha Branch',
  'Kurunegala Branch',
  'Galle Branch',
  'Matara Branch',
  'Negombo Branch',
  'Jaffna Branch',
  'Anuradhapura Branch',
  'Ratnapura Branch',
  'Kalutara Branch',
  'Badulla Branch',
  'Batticaloa Branch',
];

const PRESET_REASONS = [
  'Exceeded 60-Day Branch Retention SLA (Returned to HO LAD Safe Custody)',
  'Client requested collection from another branch closer to their residence',
  'Client untraceable / phone unreachable after multiple attempts',
  'Legal Administration Dept (LAD) recalled document for title deed audit',
  'Facility settled via another branch / legal compromise',
];

export const DispatchTransferModal: React.FC<DispatchTransferModalProps> = ({
  isOpen,
  onClose,
  documentsToDispatch,
  onConfirmDispatch,
}) => {
  if (!isOpen || documentsToDispatch.length === 0) return null;

  const todayStr = formatDateDMY(new Date());

  const [destinationType, setDestinationType] = useState<'DISPATCHED_HO' | 'TRANSFERRED_BRANCH'>('DISPATCHED_HO');
  const [destinationName, setDestinationName] = useState<string>(
    'Head Office (LAD - Legal Administration Dept)'
  );
  const [dispatchDate, setDispatchDate] = useState<string>(todayStr);
  const [courierService, setCourierService] = useState<string>('Internal Branch Courier');
  const [trackingNo, setTrackingNo] = useState<string>('');
  const [officerName, setOfficerName] = useState<string>('Branch Operations Officer (14000084)');
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  const handleDestinationTypeChange = (type: 'DISPATCHED_HO' | 'TRANSFERRED_BRANCH') => {
    setDestinationType(type);
    if (type === 'DISPATCHED_HO') {
      setDestinationName('Head Office (LAD - Legal Administration Dept)');
      setSelectedReason(PRESET_REASONS[0]);
    } else {
      setDestinationName('Kandy Branch');
      setSelectedReason(PRESET_REASONS[1]);
    }
  };

  const handleSubmit = (andPrintMemo: boolean = false) => {
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    const finalCourierRef = trackingNo.trim()
      ? `${courierService} - Waybill: ${trackingNo.trim()}`
      : courierService;

    const updatedList: DeletionDocument[] = documentsToDispatch.map((doc) => ({
      ...doc,
      dispatchStatus: destinationType,
      dispatchedTo: destinationName,
      dispatchDate: dispatchDate.trim(),
      dispatchCourierRef: finalCourierRef,
      dispatchOfficer: officerName.trim(),
      dispatchReason: finalReason,
      updatedAt: new Date().toISOString(),
    }));

    onConfirmDispatch(
      updatedList,
      {
        type: destinationType,
        destination: destinationName,
        dispatchDate: dispatchDate.trim(),
        courierRef: finalCourierRef,
        officer: officerName.trim(),
        reason: finalReason,
      },
      andPrintMemo
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Dispatch / Return Deletion Documents (ලේඛන ආපසු හෝ වෙනත් ශාඛාවකට යැවීම)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Return overdue (55-60d / &gt;60d) documents to Head Office LAD or transfer to another branch.
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Target Documents Summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Selected for Dispatch ({documentsToDispatch.length} Document{documentsToDispatch.length > 1 ? 's' : ''}):
              </span>
              <span className="text-[11px] text-slate-400">
                Overdue items will be cleared from active branch pending list
              </span>
            </div>
            <div className="max-h-28 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 font-mono text-[11px]">
              {documentsToDispatch.map((d) => (
                <div key={d.id} className="py-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">#{d.no}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{d.contractNo}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-sans truncate max-w-[140px]">{d.clientName}</span>
                    <span className="text-slate-400">({d.regNo})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-600 font-bold">{d.daysAtBranch} Days at Branch</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Destination Selector */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Select Destination Target (යවන ස්ථානය) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDestinationTypeChange('DISPATCHED_HO')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  destinationType === 'DISPATCHED_HO'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                }`}
              >
                <Building className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs">Return to Head Office (LAD)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Legal Administration Department safe custody</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDestinationTypeChange('TRANSFERRED_BRANCH')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  destinationType === 'TRANSFERRED_BRANCH'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                }`}
              >
                <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs">Transfer to Another Branch</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Send to convenient branch for client collection</p>
                </div>
              </button>
            </div>
          </div>

          {/* Specific Branch / Destination Input */}
          {destinationType === 'TRANSFERRED_BRANCH' && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Destination Branch Name *
              </label>
              <select
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                {COMMON_BRANCHES.filter((b) => !b.includes('Head Office')).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dates & Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Dispatch Date (DD/MM/YYYY) *
              </label>
              <input
                type="text"
                required
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Courier / Delivery Method *
              </label>
              <select
                value={courierService}
                onChange={(e) => setCourierService(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Internal Branch Courier">Internal Branch Dispatch Bag / Courier</option>
                <option value="ProntoFlex Express">ProntoFlex Express</option>
                <option value="Certis Lanka Courier">Certis Lanka Secure Courier</option>
                <option value="Domex Courier">Domex Courier</option>
                <option value="Registered Post">Registered Post (Sri Lanka Post)</option>
                <option value="Hand Carried by Branch Staff">Hand Carried by Branch Officer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Courier Waybill / Bag / Tracking No (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. PR-9948201 or DISP-BAG-44"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Dispatching Branch Officer Name & ID *
              </label>
              <input
                type="text"
                required
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Reason for Return / Transfer *
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-2"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other">Other reason (specify below)...</option>
            </select>
            {selectedReason === 'Other' && (
              <input
                type="text"
                placeholder="Enter specific transfer reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            )}
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
            <FileText className="w-4 h-4" /> Confirm & Print Dispatch Memo (A4)
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" /> Confirm Dispatch ({documentsToDispatch.length})
          </button>
        </div>
      </div>
    </div>
  );
};
