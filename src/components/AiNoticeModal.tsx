import React, { useState } from 'react';
import { MessageSquare, Send, Copy, Check, X, Sparkles, FileText } from 'lucide-react';
import { DocumentWithSla } from '../types/document';

interface AiNoticeModalProps {
  document: DocumentWithSla | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AiNoticeModal: React.FC<AiNoticeModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !document) return null;

  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateNotice = async (type: 'SMS' | 'WHATSAPP' | 'LETTER') => {
    setLoading(true);
    setErrorMsg('');
    setDraft('');

    try {
      const res = await fetch('/api/ai/draft-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            contractNo: document.contractNo,
            clientName: document.clientName,
            clientNic: document.clientNic,
            regNo: document.regNo,
            receivedBranchDate: document.receivedBranchDate,
            daysPending: document.daysAtBranch,
          },
          type: type === 'SMS' ? 'SMS reminder' : type === 'WHATSAPP' ? 'WhatsApp notice' : 'formal branch notification letter',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to draft notice');
      }

      setDraft(data.draft || '');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with AI service');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Draft Client Collection Notice (AI නිවේදන සකසනය)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate tailored SMS, WhatsApp, or official reminder letter in Sinhala & English.
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
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-500">Client: </span>
              <strong className="text-slate-900 dark:text-slate-100">{document.clientName}</strong>
              <span className="text-slate-400 ml-1">({document.clientNic})</span>
            </div>
            <div>
              <span className="text-slate-500">Contract: </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{document.contractNo}</span>
              <span className="mx-2">·</span>
              <span className="font-semibold text-rose-600">{document.daysAtBranch} Days at Branch</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateNotice('SMS')}
              disabled={loading}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Draft SMS / Text
            </button>
            <button
              onClick={() => generateNotice('WHATSAPP')}
              disabled={loading}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Draft WhatsApp
            </button>
            <button
              onClick={() => generateNotice('LETTER')}
              disabled={loading}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Formal Letter
            </button>
          </div>

          {loading && (
            <div className="py-8 text-center text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Generating bilingual collection notice in Sinhala & English...
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200">
              {errorMsg}
            </div>
          )}

          {draft && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Generated Notice</span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard' : 'Copy Text'}
                </button>
              </div>

              <textarea
                readOnly
                value={draft}
                rows={10}
                className="w-full p-3.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 font-sans leading-relaxed focus:outline-hidden"
              />
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
