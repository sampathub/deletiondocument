import React, { useState } from 'react';
import { Sparkles, BrainCircuit, RefreshCw, X, ShieldAlert, CheckCircle, Copy, Check } from 'lucide-react';
import { DocumentWithSla, BranchStats } from '../types/document';

interface AiAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: BranchStats;
  documents: DocumentWithSla[];
}

export const AiAuditModal: React.FC<AiAuditModalProps> = ({
  isOpen,
  onClose,
  stats,
  documents,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const runAudit = async () => {
    setLoading(true);
    setErrorMsg('');
    setAnalysisText('');

    try {
      const pendingAndBreached = documents
        .filter((d) => !d.isReleased)
        .map((d) => ({
          no: d.no,
          contractNo: d.contractNo,
          clientName: d.clientName,
          clientNic: d.clientNic,
          regNo: d.regNo,
          receivedBranchDate: d.receivedBranchDate,
          daysAtBranch: d.daysAtBranch,
          slaStatus: d.slaStatus,
        }));

      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordsSummary: stats,
          recordsList: pendingAndBreached,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete AI audit.');
      }

      setAnalysisText(data.analysis || 'No analysis returned.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with AI service.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisText) return;
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  AI Branch SLA & Custody Auditor
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Thinking Mode High
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reasoning analysis of 55-60 day risks, &gt;60 day breaches, and operational escalation.
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
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block">Total Ledger</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">{stats.total}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block">Pending at Branch</span>
              <span className="text-base font-bold text-amber-600">{stats.pending}</span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-amber-800 dark:text-amber-300 block">55–60 Day Warning</span>
              <span className="text-base font-bold text-amber-600">{stats.warningCount}</span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
              <span className="text-rose-800 dark:text-rose-300 block">&gt;60 Day SLA Breached</span>
              <span className="text-base font-bold text-rose-600">{stats.breachedCount}</span>
            </div>
          </div>

          {!analysisText && !loading && !errorMsg && (
            <div className="py-10 text-center space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400 w-16 h-16 mx-auto flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Ready to perform Branch SLA Compliance Audit
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The AI auditor will inspect your active ledger, evaluate documents exceeding 55 days, highlight critical bottlenecks, and draft immediate branch manager instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={runAudit}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4" /> Run Deep SLA Audit Now
              </button>
            </div>
          )}

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Engaging High-Thinking Reasoning...
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Evaluating document aging cycles, cross-referencing LAD dispatch patterns, and structuring escalation procedures.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Audit Failed</p>
                <p className="mt-0.5">{errorMsg}</p>
                <button
                  onClick={runAudit}
                  className="mt-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Retry Audit
                </button>
              </div>
            </div>
          )}

          {analysisText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Audit Report & Executive Recommendations
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Report'}
                  </button>
                  <button
                    onClick={runAudit}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-audit
                  </button>
                </div>
              </div>

              <div className="prose prose-xs dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-sans">
                {analysisText}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
