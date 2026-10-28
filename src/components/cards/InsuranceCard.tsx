import React, { useState } from 'react';
import { VaultDocument, InsuranceCardData } from '../../types';
import { getDocumentExpiryStatus } from '../../utils/expiry';
import { ExpiringSoonBadge } from '../ExpiringSoonBadge';
import { Copy, Check, Eye, EyeOff, RotateCw, Phone, Activity, QrCode } from 'lucide-react';

interface InsuranceCardProps {
  document: VaultDocument;
  hideSensitive?: boolean;
  onEdit: () => void;
  onShowBarcode: (code: string, title: string) => void;
}

export const InsuranceCard: React.FC<InsuranceCardProps> = ({
  document,
  hideSensitive = false,
  onEdit,
  onShowBarcode,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealSensitive, setRevealSensitive] = useState(false);

  const ins = document.insurance as InsuranceCardData;
  if (!ins) return null;

  const expiryStatus = getDocumentExpiryStatus(document);
  const isMasked = hideSensitive && !revealSensitive;

  const maskValue = (val: string) => {
    if (!isMasked) return val;
    if (val.length <= 4) return '••••';
    return '•••• ' + val.slice(-4);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ins.memberId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000 my-3">
      {/* Expiration Banner if applicable */}
      <ExpiringSoonBadge
        status={expiryStatus}
        variant="banner"
        onActionClick={onEdit}
        actionText="Update Insurance"
      />

      {/* 3D Flip Card Container */}
      <div
        className={`relative w-full aspect-[1.58/1] rounded-2xl transition-transform duration-500 transform-style-3d cursor-pointer shadow-xl border border-teal-900/60 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* FRONT SIDE */}
        <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#064E3B] via-[#042F2E] to-[#0F172A] p-4 text-white backface-hidden flex flex-col justify-between overflow-hidden shadow-2xl border border-emerald-500/20">
          {/* Subtle medical cross watermark */}
          <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none text-white font-bold text-[180px] leading-none">
            +
          </div>

          {/* Top Header */}
          <div className="relative z-10 flex items-start justify-between border-b border-emerald-500/30 pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] tracking-widest font-mono uppercase font-bold">HEALTH PLAN</span>
              </div>
              <h2 className="text-base font-bold tracking-wide text-white font-sans leading-tight">
                {ins.providerName || 'Anthem Blue Cross'}
              </h2>
              <p className="text-[10px] text-emerald-200/80 font-mono mt-0.5">
                {ins.planName || 'PPO Platinum Comprehensive'}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Expiring Soon Card Stamp */}
              <ExpiringSoonBadge status={expiryStatus} variant="card-stamp" showDays={false} />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-emerald-200 transition"
                title="Flip to back"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Member & Plan IDs */}
          <div className="relative z-10 grid grid-cols-2 gap-2 my-1">
            <div className="space-y-1">
              <div>
                <span className="text-[9px] font-mono text-emerald-300 uppercase block">MEMBER NAME</span>
                <span className="font-bold text-white text-xs tracking-wide">
                  {ins.memberName}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-mono text-emerald-300 uppercase block">MEMBER ID</span>
                <span className="font-mono font-bold text-white text-sm tracking-wider">
                  {maskValue(ins.memberId)}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-mono text-emerald-400/80 uppercase block">GROUP NUMBER</span>
                <span className="font-mono font-semibold text-emerald-100 text-xs">
                  {maskValue(ins.groupNumber)}
                </span>
              </div>
            </div>

            {/* Pharmacy Rx Information */}
            <div className="bg-black/30 rounded-xl p-2 border border-emerald-500/20 text-[10px] space-y-1">
              <span className="text-[9px] font-mono text-amber-300 font-bold block border-b border-white/10 pb-0.5">
                PHARMACY / RX
              </span>
              <div className="flex justify-between">
                <span className="text-emerald-300">RxBIN:</span>
                <span className="font-mono font-bold text-white">{ins.rxBin || '004336'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300">RxPCN:</span>
                <span className="font-mono font-bold text-white">{ins.rxPcn || 'ADV'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300">RxGrp:</span>
                <span className="font-mono font-bold text-white">{ins.rxGroup || 'RX8941'}</span>
              </div>
            </div>
          </div>

          {/* Copays Matrix Footer */}
          <div className="relative z-10 grid grid-cols-4 gap-1.5 pt-1.5 border-t border-emerald-500/20 text-center text-[9px] font-mono">
            <div className="bg-white/5 rounded py-0.5 px-1">
              <span className="text-emerald-300/80 block text-[8px]">PRIMARY</span>
              <span className="font-bold text-white">{ins.copays?.primaryCare || '$20'}</span>
            </div>
            <div className="bg-white/5 rounded py-0.5 px-1">
              <span className="text-emerald-300/80 block text-[8px]">SPEC</span>
              <span className="font-bold text-white">{ins.copays?.specialist || '$40'}</span>
            </div>
            <div className="bg-white/5 rounded py-0.5 px-1">
              <span className="text-emerald-300/80 block text-[8px]">URGENT</span>
              <span className="font-bold text-white">{ins.copays?.urgentCare || '$50'}</span>
            </div>
            <div className="bg-white/5 rounded py-0.5 px-1">
              <span className="text-amber-300/90 block text-[8px]">ER ROOM</span>
              <span className="font-bold text-amber-300">{ins.copays?.emergencyRoom || '$250'}</span>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="absolute inset-0 w-full h-full rounded-2xl bg-[#0B1516] p-4 text-white rotate-y-180 backface-hidden flex flex-col justify-between overflow-hidden shadow-2xl border border-teal-800">
          <div className="flex items-center justify-between border-b border-teal-900 pb-1.5">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
              CLAIMS & SUPPORT SERVICES
            </span>
            <span className="text-[9px] text-gray-400">Tap to flip</span>
          </div>

          {/* Quick Contact Numbers */}
          <div className="grid grid-cols-2 gap-2 my-auto">
            <div className="bg-[#122224] p-2 rounded-xl border border-teal-900/60">
              <span className="text-[8px] font-mono text-gray-400 block uppercase">24/7 NURSE LINE</span>
              <a
                href={`tel:${ins.nurseLinePhone || '1-800-700-9184'}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-emerald-300 text-xs font-bold mt-0.5 hover:underline"
              >
                <Phone className="w-3 h-3" />
                <span>{ins.nurseLinePhone || '1-800-700-9184'}</span>
              </a>
            </div>

            <div className="bg-[#122224] p-2 rounded-xl border border-teal-900/60">
              <span className="text-[8px] font-mono text-gray-400 block uppercase">MEMBER SERVICES</span>
              <a
                href={`tel:${ins.customerServicePhone || '1-800-677-6669'}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-blue-300 text-xs font-bold mt-0.5 hover:underline"
              >
                <Phone className="w-3 h-3" />
                <span>{ins.customerServicePhone || '1-800-677-6669'}</span>
              </a>
            </div>
          </div>

          {/* Barcode representation */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onShowBarcode(ins.memberId, `${ins.providerName} Member Barcode`);
            }}
            className="p-2 rounded-xl bg-white text-black flex flex-col items-center hover:bg-slate-100 transition"
          >
            <div className="w-full h-10 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 260 40" preserveAspectRatio="none">
                {Array.from({ length: 50 }).map((_, i) => {
                  const seed = (i * 47 + ins.memberId.charCodeAt(i % ins.memberId.length)) % 100;
                  return seed > 35 ? (
                    <rect key={i} x={i * 5.2} y={0} width={(seed % 3) + 1.2} height={40} fill="#000" />
                  ) : null;
                })}
              </svg>
            </div>
            <span className="font-mono text-[8px] text-gray-700 font-bold mt-1">
              PHARMACY / PROVIDER MEMBER BARCODE • {ins.memberId}
            </span>
          </div>

          <div className="text-[8px] font-mono text-gray-400 border-t border-teal-900 pt-1 flex justify-between">
            <span className="truncate max-w-[220px]">Claims: {ins.claimsAddress || 'P.O. Box 60007, Los Angeles, CA'}</span>
            <span className="text-emerald-400">Deductible: {ins.deductible || '$500 Ind'}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar underneath the Card */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-emerald-300 border border-[#323945] transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy ID'}</span>
          </button>

          <button
            type="button"
            onClick={() => setRevealSensitive(!revealSensitive)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-gray-300 border border-[#323945] transition"
          >
            {revealSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{revealSensitive ? 'Hide' : 'Show All'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onShowBarcode(ins.memberId, `${ins.providerName} Member Barcode`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-teal-300 border border-[#323945] transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Barcode</span>
          </button>

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
