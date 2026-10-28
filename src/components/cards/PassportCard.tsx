import React, { useState } from 'react';
import { VaultDocument, PassportData } from '../../types';
import { getDocumentExpiryStatus } from '../../utils/expiry';
import { ExpiringSoonBadge } from '../ExpiringSoonBadge';
import { Copy, Check, Eye, EyeOff, RotateCw, Globe, ShieldCheck, AlertTriangle } from 'lucide-react';

interface PassportCardProps {
  document: VaultDocument;
  hideSensitive?: boolean;
  onEdit: () => void;
}

export const PassportCard: React.FC<PassportCardProps> = ({
  document,
  hideSensitive = false,
  onEdit,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedMrz, setCopiedMrz] = useState(false);
  const [revealSensitive, setRevealSensitive] = useState(false);

  const pass = document.passport as PassportData;
  if (!pass) return null;

  const isMasked = hideSensitive && !revealSensitive;

  const maskValue = (val: string) => {
    if (!isMasked) return val;
    if (val.length <= 4) return '••••';
    return '•••• ' + val.slice(-4);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pass.passportNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMrz = (e: React.MouseEvent) => {
    e.stopPropagation();
    const mrz = `${pass.mrzLine1 || ''}\n${pass.mrzLine2 || ''}`;
    navigator.clipboard.writeText(mrz);
    setCopiedMrz(true);
    setTimeout(() => setCopiedMrz(false), 2000);
  };

  // Expiry status calculation using unified 30-day background check logic
  const expiryStatus = getDocumentExpiryStatus(document);

  // Travel validity calculation (e.g. 6-month international travel rule)
  const expDate = new Date(pass.expiryDate);
  const now = new Date();
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30.4);

  const isExpired = diffDays <= 0;
  // 6-month advisory applies only if not already under the critical 30-day expiring soon alert
  const isSixMonthWarning = !isExpired && diffDays < 180 && !expiryStatus.isExpiringSoon;

  return (
    <div className="w-full max-w-md mx-auto perspective-1000 my-3">
      {/* 30-day Expiring Soon or Expired Alert Banner */}
      <ExpiringSoonBadge
        status={expiryStatus}
        variant="banner"
        onActionClick={onEdit}
        actionText="Update Passport"
      />

      {/* Travel Advisory Alert Banner (for 31-180 days) */}
      {isSixMonthWarning && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Travel Advisory:</strong> Less than 6 months validity remaining ({diffMonths} mos). Many international airlines and destinations require 6+ months.
          </span>
        </div>
      )}

      {/* 3D Flip Card Container */}
      <div
        className={`relative w-full aspect-[1.48/1] rounded-2xl transition-transform duration-500 transform-style-3d cursor-pointer shadow-2xl border border-slate-700/60 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* FRONT: BIO-DATA IDENTITY PAGE */}
        <div className="absolute inset-0 w-full h-full rounded-2xl bg-[#0F172A] p-4 text-white backface-hidden flex flex-col justify-between overflow-hidden shadow-2xl border border-indigo-950/60">
          {/* Subtle Guilloche pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:10px_10px]" />

          {/* Top Header */}
          <div className="relative z-10 flex items-start justify-between border-b border-indigo-500/20 pb-1.5">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-300">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[9px] tracking-widest font-mono uppercase font-bold">
                  PASSPORT / PASSEPORT
                </span>
              </div>
              <h2 className="text-sm font-bold tracking-wide text-white uppercase font-sans">
                {pass.issuingCountry || 'UNITED STATES OF AMERICA'}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Expiring Soon Card Stamp */}
              <ExpiringSoonBadge status={expiryStatus} variant="card-stamp" showDays={false} />

              <span className="text-[10px] font-mono text-indigo-200">
                TYPE: <strong className="text-white">P</strong> • CODE: <strong className="text-white">{pass.countryCode || 'USA'}</strong>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-indigo-200 transition"
                title="View Passport Cover"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bio Data Content with Photo */}
          <div className="relative z-10 grid grid-cols-12 gap-3 items-center my-0.5">
            {/* Passport Photo */}
            <div className="col-span-4 flex flex-col items-center">
              <div className="relative w-20 h-24 rounded-lg bg-slate-800 border-2 border-indigo-400/40 overflow-hidden shadow-inner">
                {pass.photoUrl ? (
                  <img
                    src={pass.photoUrl}
                    alt={pass.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-t from-slate-900 to-indigo-950 text-indigo-300">
                    <div className="w-9 h-9 rounded-full bg-indigo-900/80 border border-indigo-600/40 flex items-center justify-center mb-1 text-indigo-200 font-bold text-xs">
                      {pass.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[8px] font-mono text-indigo-400">BIOMETRIC</span>
                  </div>
                )}
                {/* Micro biometric chip hologram icon on photo */}
                <div className="absolute bottom-1 right-1 w-4 h-3 rounded bg-amber-400/90 flex items-center justify-center shadow-xs">
                  <div className="w-2 h-1 bg-amber-900 rounded-xs" />
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="col-span-8 flex flex-col justify-center space-y-0.5 text-xs">
              <div>
                <span className="text-[8px] font-mono text-indigo-300 uppercase">PASSPORT NO.</span>
                <span className="font-mono font-bold text-amber-300 text-sm tracking-wider ml-1.5">
                  {maskValue(pass.passportNumber)}
                </span>
              </div>

              <div>
                <span className="text-[8px] font-mono text-slate-400 uppercase block">SURNAME / GIVEN NAMES</span>
                <span className="font-bold text-white text-xs tracking-wide truncate block">
                  {pass.fullName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <div>
                  <span className="text-[8px] font-mono text-slate-400 block uppercase">NATIONALITY</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {pass.nationality || 'USA'}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-slate-400 block uppercase">DATE OF BIRTH</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {maskValue(pass.dob)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <div>
                  <span className="text-[8px] font-mono text-slate-400 block uppercase">ISSUE DATE</span>
                  <span className="font-mono text-slate-300">{pass.issueDate}</span>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-amber-300/90 uppercase flex items-center gap-1">
                    EXPIRATION
                    {expiryStatus.isExpiringSoon && (
                      <span className="text-[7px] bg-amber-400 text-black px-1 rounded font-extrabold">SOON</span>
                    )}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      expiryStatus.isExpiringSoon
                        ? 'text-amber-200 underline decoration-amber-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {pass.expiryDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Machine Readable Zone (MRZ) bottom band */}
          <div className="relative z-10 bg-black/60 rounded-lg p-1.5 border border-indigo-500/20 font-mono text-[9px] tracking-widest text-emerald-300 leading-tight select-all">
            <div className="truncate">{pass.mrzLine1 || `P<${pass.countryCode || 'USA'}${pass.fullName.replace(/\s+/g, '<')}<<<<<<<<<<<<<<<<<<`}</div>
            <div className="truncate">{pass.mrzLine2 || `${pass.passportNumber}<0${pass.countryCode || 'USA'}<<<<<<<<<<<<<<<<<<<<01`}</div>
          </div>
        </div>

        {/* BACK: OFFICIAL EMBOSSED COVER */}
        <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#0B1528] via-[#08101E] to-[#040810] p-5 text-white rotate-y-180 backface-hidden flex flex-col items-center justify-between shadow-2xl border-2 border-amber-500/30">
          {/* Top Gold Foil Text */}
          <div className="text-center space-y-1 mt-1">
            <p className="text-[10px] tracking-[0.25em] font-serif text-amber-300 uppercase font-semibold">
              PASSPORT
            </p>
            <p className="text-xs tracking-[0.2em] font-serif text-amber-200/90 uppercase font-bold">
              {pass.issuingCountry || 'UNITED STATES OF AMERICA'}
            </p>
          </div>

          {/* Great Seal / Emblem in Gold Foil */}
          <div className="w-20 h-20 rounded-full border-2 border-amber-400/50 p-2 flex items-center justify-center bg-amber-400/5 shadow-[0_0_20px_rgba(245,158,11,0.15)] my-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-300 opacity-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/>
              <path d="M50 20 L58 36 L76 38 L62 50 L66 68 L50 58 L34 68 L38 50 L24 38 L42 36 Z" />
              <circle cx="50" cy="50" r="8" fill="#0B1528" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          {/* Biometric E-Passport Emblem */}
          <div className="flex flex-col items-center gap-1 mb-1">
            {/* Standard ICAO biometric contactless logo */}
            <div className="w-8 h-5 rounded-xs border-2 border-amber-300 flex items-center justify-center relative">
              <div className="w-full h-0.5 bg-amber-300" />
              <div className="absolute w-2.5 h-2.5 rounded-full bg-[#08101E] border-2 border-amber-300" />
            </div>
            <span className="text-[8px] font-mono tracking-widest text-amber-300/80 uppercase">
              BIOMETRIC ePASSPORT
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar underneath the Card */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-indigo-300 border border-[#323945] transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy No.'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMrz}
            title="Copy MRZ Machine Readable Lines"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-emerald-300 border border-[#323945] transition active:scale-95"
          >
            {copiedMrz ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMrz ? 'Copied MRZ' : 'Copy MRZ'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRevealSensitive(!revealSensitive)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-gray-300 border border-[#323945] transition"
          >
            {revealSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{revealSensitive ? 'Hide' : 'Show All'}</span>
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
