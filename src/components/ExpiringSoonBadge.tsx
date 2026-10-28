import React from 'react';
import { AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { DocumentExpiryStatus } from '../utils/expiry';

interface ExpiringSoonBadgeProps {
  status: DocumentExpiryStatus;
  variant?: 'pill' | 'banner' | 'card-stamp' | 'compact';
  showDays?: boolean;
  className?: string;
  onActionClick?: () => void;
  actionText?: string;
}

export const ExpiringSoonBadge: React.FC<ExpiringSoonBadgeProps> = ({
  status,
  variant = 'pill',
  showDays = true,
  className = '',
  onActionClick,
  actionText = 'Update',
}) => {
  if (!status.hasExpiry) return null;
  if (!status.isExpiringSoon && !status.isExpired) return null;

  const isExpired = status.isExpired;

  // Banner variant (shown above a document card)
  if (variant === 'banner') {
    return (
      <div
        className={`mb-2.5 px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-all ${
          isExpired
            ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200'
            : 'bg-amber-950/35 border border-amber-500/40 text-amber-200'
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          {isExpired ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          )}
          <div>
            <span className="font-bold tracking-wide mr-1.5 uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/40">
              {isExpired ? 'Expired' : 'Expiring Soon'}
            </span>
            <span className="text-[11px]">{status.statusText}</span>
            {status.expiryDateFormatted && (
              <span className="text-[10px] font-mono text-gray-400 ml-1.5">
                ({status.expiryDateFormatted})
              </span>
            )}
          </div>
        </div>

        {onActionClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onActionClick();
            }}
            className="text-[11px] font-mono underline hover:text-white transition active:scale-95 shrink-0 ml-2"
          >
            {actionText}
          </button>
        )}
      </div>
    );
  }

  // Card stamp variant (designed to sit directly on top of the card face)
  if (variant === 'card-stamp') {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-sans text-[9px] font-extrabold uppercase tracking-wider shadow-md backdrop-blur-xs ${
          isExpired
            ? 'bg-rose-500 text-white border border-rose-300/40'
            : 'bg-amber-400 text-slate-950 border border-amber-300'
        } ${className}`}
      >
        {isExpired ? (
          <AlertCircle className="w-3 h-3 stroke-[2.5]" />
        ) : (
          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
        )}
        <span>{isExpired ? 'Expired' : 'Expiring Soon'}</span>
        {showDays && status.daysRemaining !== null && !isExpired && (
          <span className="font-mono text-[8px] bg-black/20 px-1 rounded-sm ml-0.5">
            {status.daysRemaining}d
          </span>
        )}
      </div>
    );
  }

  // Compact variant (minimal icon + text)
  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold ${
          isExpired ? 'text-rose-400' : 'text-amber-300'
        } ${className}`}
      >
        {isExpired ? (
          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
        )}
        <span>{isExpired ? 'Expired' : 'Expiring Soon'}</span>
      </span>
    );
  }

  // Default: Pill Chip Badge
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xs ${
        isExpired
          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
      } ${className}`}
      title={status.statusText}
    >
      {isExpired ? (
        <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
      ) : (
        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
      )}
      <span>{isExpired ? 'Expired' : 'Expiring Soon'}</span>
      {showDays && status.daysRemaining !== null && !isExpired && (
        <span className="text-amber-200/80 font-normal">({status.daysRemaining}d left)</span>
      )}
    </span>
  );
};
