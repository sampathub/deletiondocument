import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, Bell, BellOff, ArrowRight } from 'lucide-react';
import { DocumentWithSla } from '../types/document';

interface SlaAlertBannerProps {
  warningDocs: DocumentWithSla[]; // 55 to 60 days
  breachedDocs: DocumentWithSla[]; // >60 days
  onSelectFilter: (filter: 'ALL' | 'WARNING_55_60' | 'CRITICAL_BREACH' | 'PENDING' | 'RELEASED') => void;
  activeFilter: string;
}

export const SlaAlertBanner: React.FC<SlaAlertBannerProps> = ({
  warningDocs,
  breachedDocs,
  onSelectFilter,
  activeFilter,
}) => {
  const [audioEnabled, setAudioEnabled] = useState(false);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // AudioContext may be restricted by browser policy
    }
  };

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    if (next) {
      playBeep();
    }
  };

  if (warningDocs.length === 0 && breachedDocs.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5 mb-6 no-print">
      {/* Critical SLA Breach (> 60 Days) */}
      {breachedDocs.length > 0 && (
        <div
          role="alert"
          className={`p-4 rounded-xl border transition-all ${
            activeFilter === 'CRITICAL_BREACH'
              ? 'bg-rose-50 border-rose-400 dark:bg-rose-950/40 dark:border-rose-600 ring-2 ring-rose-500/30'
              : 'bg-rose-50/80 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500 text-white shrink-0 mt-0.5 sm:mt-0">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                    CRITICAL SLA BREACH: {breachedDocs.length} Document{breachedDocs.length > 1 ? 's' : ''} Pending &gt; 60 Days!
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-600 text-white">
                    Action Required Immediately
                  </span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                  ශාඛාවට ලැබී දින 60 ඉක්මවූ ලියකියවිලි පද්ධතියේ හඳුනාගෙන ඇත. (Contracts: {breachedDocs.slice(0, 3).map(d => d.contractNo).join(', ')}{breachedDocs.length > 3 ? ` +${breachedDocs.length - 3} more` : ''}). Legal LAD / Client follow-up mandatory.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={handleToggleAudio}
                title={audioEnabled ? 'Mute alert sound' : 'Enable alert sound'}
                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 transition-colors"
              >
                {audioEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 opacity-70" />}
              </button>
              <button
                onClick={() => onSelectFilter(activeFilter === 'CRITICAL_BREACH' ? 'ALL' : 'CRITICAL_BREACH')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                {activeFilter === 'CRITICAL_BREACH' ? 'Show All Records' : `View ${breachedDocs.length} Breached`}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Tier (55 to 60 Days) */}
      {warningDocs.length > 0 && (
        <div
          role="alert"
          className={`p-4 rounded-xl border transition-all ${
            activeFilter === 'WARNING_55_60'
              ? 'bg-amber-50 border-amber-400 dark:bg-amber-950/40 dark:border-amber-600 ring-2 ring-amber-500/30'
              : 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                    SLA WARNING (Day 55 – 60): {warningDocs.length} Document{warningDocs.length > 1 ? 's' : ''} Approaching Cutoff
                  </h4>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    Deadline Approaching
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  ශාඛාවට ලැබී දින 55 ඉක්මවූ ලේඛන. දින 60 සම්පූර්ණ වීමට පෙර ගනුදෙනුකරුවන් අමතා භාර දීමට කටයුතු කරන්න.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectFilter(activeFilter === 'WARNING_55_60' ? 'ALL' : 'WARNING_55_60')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-100 bg-amber-200 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg shadow-sm transition-colors self-end sm:self-center whitespace-nowrap"
            >
              {activeFilter === 'WARNING_55_60' ? 'Show All Records' : `View ${warningDocs.length} Approaching Limit`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
