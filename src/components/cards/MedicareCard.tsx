import React, { useState } from 'react';
import { VaultDocument, MedicareCardData } from '../../types';
import { getDocumentExpiryStatus } from '../../utils/expiry';
import { ExpiringSoonBadge } from '../ExpiringSoonBadge';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  HeartPulse,
  Phone,
  QrCode,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface MedicareCardProps {
  document: VaultDocument;
  hideSensitive?: boolean;
  onEdit: () => void;
  onShowBarcode?: (code: string, title: string) => void;
}

export const MedicareCard: React.FC<MedicareCardProps> = ({
  document,
  hideSensitive = false,
  onEdit,
  onShowBarcode,
}) => {
  const [copiedNum, setCopiedNum] = useState(false);
  const [copiedIrn, setCopiedIrn] = useState(false);
  const [revealSensitive, setRevealSensitive] = useState(false);
  const [viewPhotoScan, setViewPhotoScan] = useState(false);

  const med = document.medicare as MedicareCardData;
  if (!med) return null;

  const isMasked = hideSensitive && !revealSensitive;

  // Format Medicare number as "2954 81920 1" (standard Australian 4-5-1 grouping)
  const formatMedicareNumber = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 9)} ${clean.slice(9)}`;
    }
    return num;
  };

  const maskValue = (val: string) => {
    if (!isMasked) return formatMedicareNumber(val);
    const clean = val.replace(/\s+/g, '');
    if (clean.length <= 4) return '••••';
    return '•••• ••••• ' + clean.slice(-1);
  };

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = med.cardNumber.replace(/\s+/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 2000);
  };

  const handleCopyIrn = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(med.irn || '1');
    setCopiedIrn(true);
    setTimeout(() => setCopiedIrn(false), 2000);
  };

  // Color theme styling
  const isGreen = med.cardColor === 'green' || !med.cardColor;
  const isBlue = med.cardColor === 'blue';
  const isYellow = med.cardColor === 'yellow';

  const cardTheme = isBlue
    ? {
        bg: 'from-[#0B3558] via-[#08243D] to-[#0A1624]',
        border: 'border-sky-500/30',
        badge: 'bg-sky-400/20 text-sky-200 border-sky-400/40',
        textAccent: 'text-sky-300',
        label: 'INTERIM MEDICARE',
      }
    : isYellow
    ? {
        bg: 'from-[#4D3808] via-[#332505] to-[#1C1504]',
        border: 'border-amber-500/30',
        badge: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
        textAccent: 'text-amber-300',
        label: 'RECIPROCAL MEDICARE',
      }
    : {
        bg: 'from-[#0A3D28] via-[#06291B] to-[#041B12]',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
        textAccent: 'text-emerald-300',
        label: 'AUSTRALIAN RESIDENT',
      };

  const beneficiaries =
    med.beneficiaries && med.beneficiaries.length > 0
      ? med.beneficiaries
      : [
          { irn: med.irn || '1', name: med.cardholderName || 'CARDHOLDER' },
        ];

  // Calculate comprehensive expiry status (e.g. validTo MM/YYYY)
  const expiryStatus = getDocumentExpiryStatus(document);

  return (
    <div className="w-full max-w-md mx-auto my-3">
      {/* Expiration Banner if within 30 days or expired */}
      <ExpiringSoonBadge
        status={expiryStatus}
        variant="banner"
        onActionClick={onEdit}
        actionText="Update Card"
      />

      {/* Top Header Bar with view photo scan button */}
      <div className="flex items-center justify-between px-1 mb-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
            AUSTRALIA • MEDICARE
          </span>
          <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">Front</span>
          {/* Expiring Soon Badge in Header */}
          <ExpiringSoonBadge status={expiryStatus} variant="pill" showDays={true} />
        </div>

        {/* Physical Front Scan Toggle */}
        {med.frontPhotoUrl && (
          <button
            type="button"
            onClick={() => setViewPhotoScan(!viewPhotoScan)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border transition ${
              viewPhotoScan
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-[#181D25] text-gray-300 border-[#2D3544] hover:bg-[#232A35]'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>{viewPhotoScan ? 'Digital View' : 'Physical Front Photo'}</span>
          </button>
        )}
      </div>

      {/* Main Australian Medicare Card Visual */}
      <div
        className={`relative w-full aspect-[1.58/1] rounded-2xl bg-gradient-to-br ${cardTheme.bg} p-4 text-white shadow-2xl border ${cardTheme.border} overflow-hidden flex flex-col justify-between`}
      >
        {/* Subtle Medicare iconic wave micro-pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6ee7b7_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-emerald-400 font-serif italic text-9xl leading-none">
          +
        </div>

        {/* Physical Photo Scan Overlay if active */}
        {viewPhotoScan && med.frontPhotoUrl ? (
          <div className="absolute inset-0 z-20 bg-black flex items-center justify-center p-2 rounded-2xl">
            <img
              src={med.frontPhotoUrl}
              alt="Front of Australian Medicare Card"
              className="w-full h-full object-contain rounded-xl"
            />
            <span className="absolute bottom-2 right-3 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded text-emerald-300">
              Captured Medicare Front Photo
            </span>
          </div>
        ) : null}

        {/* Card Header: Services Australia & Brand */}
        <div className="relative z-10 flex items-start justify-between border-b border-white/15 pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] tracking-widest font-mono text-emerald-300 uppercase font-bold">
                COMMONWEALTH OF AUSTRALIA
              </span>
            </div>
            {/* Iconic Medicare logo wordmark styling */}
            <h2 className="text-2xl font-black tracking-tight text-white font-sans lowercase leading-none mt-1">
              medicare
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Expiring Soon Card Stamp */}
            <ExpiringSoonBadge status={expiryStatus} variant="card-stamp" showDays={false} />

            <div
              className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${cardTheme.badge}`}
            >
              {cardTheme.label}
            </div>
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <HeartPulse className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Center: 10-Digit Medicare Card Number */}
        <div className="relative z-10 my-auto">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono text-emerald-300/80 uppercase tracking-wider block">
              MEDICARE CARD NUMBER
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono text-amber-300 uppercase flex items-center gap-1">
                VALID TO:
                {expiryStatus.isExpiringSoon && (
                  <span className="text-[7px] bg-amber-400 text-black px-1 rounded font-extrabold">SOON</span>
                )}
                <strong
                  className={`text-xs ${
                    expiryStatus.isExpiringSoon
                      ? 'text-amber-200 underline decoration-amber-400'
                      : 'text-white'
                  }`}
                >
                  {med.validTo || '11/2028'}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-0.5">
            <span className="font-mono font-bold text-white text-xl tracking-widest drop-shadow-sm">
              {maskValue(med.cardNumber)}
            </span>
            <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-md border border-white/10">
              <span className="text-[9px] font-mono text-emerald-300">IRN:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{med.irn || '1'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Beneficiaries & Dependants List */}
        <div className="relative z-10 border-t border-white/15 pt-2">
          <div className="flex items-center justify-between text-[8px] font-mono text-emerald-200/70 mb-1">
            <span>CARDHOLDERS & BENEFICIARIES (LINE NO.)</span>
            <span className="text-[7px] text-gray-400">Services Australia</span>
          </div>

          <div className="space-y-1">
            {beneficiaries.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 text-xs font-mono px-1.5 py-0.5 rounded ${
                  item.irn === med.irn ? 'bg-white/10 font-bold text-white' : 'text-emerald-100/80'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                  {item.irn}
                </span>
                <span className="truncate tracking-wide text-xs">{item.name.toUpperCase()}</span>
                {item.irn === med.irn && (
                  <span className="text-[8px] text-amber-300 ml-auto font-sans font-semibold">
                    (You)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar underneath the Card */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-2">
          {/* Copy Full Medicare Number */}
          <button
            type="button"
            onClick={handleCopyNumber}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-emerald-300 border border-[#323945] transition active:scale-95"
            title="Copy 10-digit Medicare card number"
          >
            {copiedNum ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedNum ? 'Copied' : 'Copy Number'}</span>
          </button>

          {/* Copy IRN Line Number (Essential for Australian clinics & doctors!) */}
          <button
            type="button"
            onClick={handleCopyIrn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-amber-300 border border-[#323945] transition active:scale-95"
            title="Copy Individual Reference Number (IRN)"
          >
            {copiedIrn ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedIrn ? 'Copied' : `IRN (${med.irn || '1'})`}</span>
          </button>

          {/* Reveal/Mask Sensitive */}
          <button
            type="button"
            onClick={() => setRevealSensitive(!revealSensitive)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-gray-300 border border-[#323945] transition"
          >
            {revealSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{revealSensitive ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onShowBarcode && (
            <button
              type="button"
              onClick={() =>
                onShowBarcode(
                  `${med.cardNumber.replace(/\s+/g, '')}${med.irn || '1'}`,
                  'Australian Medicare Card Barcode'
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-emerald-300 border border-[#323945] transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Barcode</span>
            </button>
          )}

          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 rounded-xl bg-[#262E3B] hover:bg-[#323E50] text-xs font-medium text-white border border-[#3A4659] transition"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};
