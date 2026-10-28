import React, { useState } from 'react';
import { AlertTriangle, Clock, X, ChevronRight, CheckCircle, ShieldAlert } from 'lucide-react';
import { StartupExpiryCheckReport } from '../utils/expiry';

interface StartupExpiryBannerProps {
  report: StartupExpiryCheckReport | null;
  onFilterExpiring: () => void;
  onSelectDoc?: (docId: string) => void;
}

export const StartupExpiryBanner: React.FC<StartupExpiryBannerProps> = ({
  report,
  onFilterExpiring,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!report || dismissed) return null;

  const totalAlerts = report.expiringSoonCount + report.expiredCount;
  if (totalAlerts === 0) return null;

  const firstExpiring = report.expiringSoonDocs[0];
  const firstExpired = report.expiredDocs[0];

  return (
    <div className="mb-4 mx-1 rounded-2xl bg-gradient-to-r from-[#241A0B] via-[#1F1709] to-[#171206] border border-amber-500/40 p-3.5 text-white shadow-lg relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                Startup Expiry Check
              </span>
              <span className="text-[10px] font-mono text-amber-200/60 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>30-Day Window Alert</span>
              </span>
            </div>

            <p className="text-xs text-amber-100/90 font-medium mt-1">
              {report.expiredCount > 0 ? (
                <span>
                  <strong>{report.expiredCount} expired</strong> and{' '}
                  <strong>{report.expiringSoonCount} expiring soon</strong> (within 30 days).
                </span>
              ) : (
                <span>
                  <strong>{report.expiringSoonCount} document{report.expiringSoonCount > 1 ? 's' : ''}</strong> expiring within 30 days.
                </span>
              )}
            </p>

            {/* Preview of item */}
            {firstExpiring && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-amber-200/80 bg-black/30 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <span className="font-semibold text-white">{firstExpiring.document.title}:</span>
                <span className="text-amber-300 font-mono font-bold">
                  {firstExpiring.status.statusText}
                </span>
                {firstExpiring.status.expiryDateFormatted && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    ({firstExpiring.status.expiryDateFormatted})
                  </span>
                )}
              </div>
            )}

            {firstExpired && !firstExpiring && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-rose-200 bg-black/30 px-2.5 py-1 rounded-lg border border-rose-500/20">
                <span className="font-semibold text-white">{firstExpired.document.title}:</span>
                <span className="text-rose-300 font-mono font-bold">
                  {firstExpired.status.statusText}
                </span>
              </div>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={onFilterExpiring}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition active:scale-95 shadow-sm"
              >
                <span>Review Documents</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 text-gray-300 text-xs font-medium transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
