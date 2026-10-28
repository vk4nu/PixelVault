import React, { useState } from 'react';
import { VaultDocument, DriversLicenseData } from '../../types';
import { getDocumentExpiryStatus } from '../../utils/expiry';
import { ExpiringSoonBadge } from '../ExpiringSoonBadge';
import {
  QrCode,
  Copy,
  Check,
  Eye,
  EyeOff,
  RotateCw,
  Heart,
  Image as ImageIcon,
  Layers,
  MapPin,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface DriversLicenseCardProps {
  document: VaultDocument;
  hideSensitive?: boolean;
  onEdit: () => void;
  onShowBarcode: (code: string, title: string) => void;
}

// State color schemes & transport authority mapping
const AUS_STATE_META: Record<
  string,
  {
    name: string;
    authority: string;
    code: string;
    gradient: string;
    badgeBg: string;
    accent: string;
    url: string;
  }
> = {
  NSW: {
    name: 'NEW SOUTH WALES',
    authority: 'Transport for NSW',
    code: 'NSW',
    gradient: 'from-[#0E2A47] via-[#0A1A2E] to-[#121B2A]',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
    accent: 'text-sky-400',
    url: 'service.nsw.gov.au',
  },
  'New South Wales': {
    name: 'NEW SOUTH WALES',
    authority: 'Transport for NSW',
    code: 'NSW',
    gradient: 'from-[#0E2A47] via-[#0A1A2E] to-[#121B2A]',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
    accent: 'text-sky-400',
    url: 'service.nsw.gov.au',
  },
  VIC: {
    name: 'VICTORIA',
    authority: 'VicRoads',
    code: 'VIC',
    gradient: 'from-[#0D1F38] via-[#081526] to-[#111A29]',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    accent: 'text-blue-400',
    url: 'vicroads.vic.gov.au',
  },
  Victoria: {
    name: 'VICTORIA',
    authority: 'VicRoads',
    code: 'VIC',
    gradient: 'from-[#0D1F38] via-[#081526] to-[#111A29]',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    accent: 'text-blue-400',
    url: 'vicroads.vic.gov.au',
  },
  QLD: {
    name: 'QUEENSLAND',
    authority: 'Dept of Transport & Main Roads',
    code: 'QLD',
    gradient: 'from-[#3B111A] via-[#220B11] to-[#150D12]',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    accent: 'text-amber-400',
    url: 'qld.gov.au/transport',
  },
  Queensland: {
    name: 'QUEENSLAND',
    authority: 'Dept of Transport & Main Roads',
    code: 'QLD',
    gradient: 'from-[#3B111A] via-[#220B11] to-[#150D12]',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    accent: 'text-amber-400',
    url: 'qld.gov.au/transport',
  },
  WA: {
    name: 'WESTERN AUSTRALIA',
    authority: 'Department of Transport (DoT)',
    code: 'WA',
    gradient: 'from-[#2B230C] via-[#1A1507] to-[#121316]',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    accent: 'text-yellow-400',
    url: 'transport.wa.gov.au',
  },
  'Western Australia': {
    name: 'WESTERN AUSTRALIA',
    authority: 'Department of Transport (DoT)',
    code: 'WA',
    gradient: 'from-[#2B230C] via-[#1A1507] to-[#121316]',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    accent: 'text-yellow-400',
    url: 'transport.wa.gov.au',
  },
  SA: {
    name: 'SOUTH AUSTRALIA',
    authority: 'Service SA / DIT',
    code: 'SA',
    gradient: 'from-[#2B0E14] via-[#1A0B10] to-[#131219]',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    accent: 'text-rose-400',
    url: 'service.sa.gov.au',
  },
  'South Australia': {
    name: 'SOUTH AUSTRALIA',
    authority: 'Service SA / DIT',
    code: 'SA',
    gradient: 'from-[#2B0E14] via-[#1A0B10] to-[#131219]',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    accent: 'text-rose-400',
    url: 'service.sa.gov.au',
  },
  TAS: {
    name: 'TASMANIA',
    authority: 'Transport Services TAS',
    code: 'TAS',
    gradient: 'from-[#0C2920] via-[#071913] to-[#111617]',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    accent: 'text-emerald-400',
    url: 'transport.tas.gov.au',
  },
  Tasmania: {
    name: 'TASMANIA',
    authority: 'Transport Services TAS',
    code: 'TAS',
    gradient: 'from-[#0C2920] via-[#071913] to-[#111617]',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    accent: 'text-emerald-400',
    url: 'transport.tas.gov.au',
  },
  ACT: {
    name: 'AUSTRALIAN CAPITAL TERRITORY',
    authority: 'Access Canberra',
    code: 'ACT',
    gradient: 'from-[#1B1D38] via-[#0E1022] to-[#13151D]',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    accent: 'text-indigo-400',
    url: 'accesscanberra.act.gov.au',
  },
  'Australian Capital Territory': {
    name: 'AUSTRALIAN CAPITAL TERRITORY',
    authority: 'Access Canberra',
    code: 'ACT',
    gradient: 'from-[#1B1D38] via-[#0E1022] to-[#13151D]',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    accent: 'text-indigo-400',
    url: 'accesscanberra.act.gov.au',
  },
  NT: {
    name: 'NORTHERN TERRITORY',
    authority: 'MVR Northern Territory',
    code: 'NT',
    gradient: 'from-[#33180F] via-[#1E0D08] to-[#151214]',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    accent: 'text-orange-400',
    url: 'nt.gov.au/driving',
  },
  'Northern Territory': {
    name: 'NORTHERN TERRITORY',
    authority: 'MVR Northern Territory',
    code: 'NT',
    gradient: 'from-[#33180F] via-[#1E0D08] to-[#151214]',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    accent: 'text-orange-400',
    url: 'nt.gov.au/driving',
  },
};

export const DriversLicenseCard: React.FC<DriversLicenseCardProps> = ({
  document,
  hideSensitive = false,
  onEdit,
  onShowBarcode,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewPhotoScan, setViewPhotoScan] = useState(false);
  const [copiedLicence, setCopiedLicence] = useState(false);
  const [copiedCardNo, setCopiedCardNo] = useState(false);
  const [revealSensitive, setRevealSensitive] = useState(false);

  const dl = document.driversLicense as DriversLicenseData;
  if (!dl) return null;

  const isMasked = hideSensitive && !revealSensitive;

  const maskValue = (val?: string) => {
    if (!val) return '';
    if (!isMasked) return val;
    if (val.length <= 4) return '••••';
    return '•••• ' + val.slice(-4);
  };

  const handleCopyLicence = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(dl.licenseNumber);
    setCopiedLicence(true);
    setTimeout(() => setCopiedLicence(false), 2000);
  };

  const handleCopyCardNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dl.cardNumber) {
      navigator.clipboard.writeText(dl.cardNumber);
      setCopiedCardNo(true);
      setTimeout(() => setCopiedCardNo(false), 2000);
    }
  };

  const stateMeta =
    AUS_STATE_META[dl.stateCode || ''] ||
    AUS_STATE_META[dl.state || ''] ||
    AUS_STATE_META['NSW'];

  // Calculate comprehensive expiry status
  const expiryStatus = getDocumentExpiryStatus(document);

  // Format Australian date display (DD/MM/YYYY)
  const formatAusDate = (dStr: string) => {
    if (!dStr) return '';
    if (dStr.includes('/')) return dStr;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000 my-3">
      {/* Expiration Banner if within 30 days or expired */}
      <ExpiringSoonBadge
        status={expiryStatus}
        variant="banner"
        onActionClick={onEdit}
        actionText="Update Licence"
      />

      {/* Card Header Tab: Toggle Front/Back & Photo Scan view */}
      <div className="flex items-center justify-between px-1 mb-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 font-mono text-[10px] font-bold border border-blue-500/30">
            AUSTRALIA • {stateMeta.code}
          </span>
          <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
            {isFlipped ? 'Back' : 'Front'}
          </span>
          {/* Expiring Soon Badge in Header */}
          <ExpiringSoonBadge status={expiryStatus} variant="pill" showDays={true} />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle between Digital layout and Scanned physical photo */}
          {(dl.photoUrl || dl.backPhotoUrl) && (
            <button
              type="button"
              onClick={() => setViewPhotoScan(!viewPhotoScan)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border transition ${
                viewPhotoScan
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-[#181D25] text-gray-300 border-[#2D3544] hover:bg-[#232A35]'
              }`}
              title="Toggle scanned physical card photo"
            >
              <ImageIcon className="w-3 h-3" />
              <span>{viewPhotoScan ? 'Digital View' : 'Photo Scan'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181D25] hover:bg-[#232A35] text-gray-300 border border-[#2D3544] text-[10px] font-mono transition"
          >
            <RotateCw className="w-3 h-3 text-blue-400" />
            <span>Flip {isFlipped ? 'Front' : 'Back'}</span>
          </button>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className={`relative w-full aspect-[1.58/1] rounded-2xl transition-transform duration-500 transform-style-3d cursor-pointer shadow-2xl border border-slate-700/70 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* ================= FRONT SIDE ================= */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br ${stateMeta.gradient} p-4 text-white backface-hidden flex flex-col justify-between overflow-hidden shadow-2xl border border-sky-500/20`}
        >
          {/* Subtle Australian Southern Cross / Security Watermark Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:14px_14px]" />
          <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-8xl font-black">
            {stateMeta.code}
          </div>

          {/* Photo scan overlay if active */}
          {viewPhotoScan && dl.photoUrl ? (
            <div className="absolute inset-0 z-20 bg-black flex items-center justify-center p-2 rounded-2xl">
              <img
                src={dl.photoUrl}
                alt="Front of Australian Driver Licence"
                className="w-full h-full object-contain rounded-xl"
              />
              <span className="absolute bottom-2 right-3 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded text-sky-300">
                Front Photo Capture
              </span>
            </div>
          ) : null}

          {/* Top Header */}
          <div className="relative z-10 flex items-start justify-between border-b border-white/15 pb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] tracking-widest font-mono text-sky-200/90 font-bold uppercase">
                  AUSTRALIA
                </span>
                <span className="text-[9px] font-mono text-gray-400">•</span>
                <span className="text-[10px] font-mono text-sky-300/80 uppercase">
                  {stateMeta.authority}
                </span>
              </div>
              <h2 className="text-base font-bold tracking-wider text-white uppercase font-sans leading-none mt-0.5">
                {stateMeta.name}
              </h2>
              <p className="text-[9px] tracking-widest text-sky-200/70 font-mono mt-0.5">
                DRIVER LICENCE • CLASS {dl.licenseClass || 'C'}
                {dl.licenceType && ` • ${dl.licenceType.toUpperCase()}`}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Expiring Soon Card Stamp */}
              <ExpiringSoonBadge status={expiryStatus} variant="card-stamp" showDays={false} />

              <div
                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${stateMeta.badgeBg}`}
              >
                <span>{stateMeta.code}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-sky-200 transition"
                title="Flip to back"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Details with Portrait Photo & Data */}
          <div className="relative z-10 grid grid-cols-12 gap-3 items-center my-auto">
            {/* ID Portrait Photo */}
            <div className="col-span-4 flex flex-col items-center">
              <div className="relative w-20 h-24 rounded-lg bg-slate-900 border border-sky-400/30 overflow-hidden shadow-inner group">
                {dl.photoUrl ? (
                  <img
                    src={dl.photoUrl}
                    alt={dl.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-t from-slate-950 to-slate-800 text-slate-400">
                    <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center mb-1 text-slate-200 font-bold text-xs">
                      {dl.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono">PHOTO</span>
                  </div>
                )}
                {/* Organ Donor Stamp (Australian "Donor: A") */}
                {dl.organDonor && (
                  <div
                    title="Australian Organ Donor Registered"
                    className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-rose-600/90 flex items-center gap-0.5 shadow-md text-white text-[8px] font-bold"
                  >
                    <Heart className="w-2.5 h-2.5 fill-current" />
                    <span>DONOR: A</span>
                  </div>
                )}
              </div>
            </div>

            {/* License Data Fields */}
            <div className="col-span-8 flex flex-col justify-center space-y-1 text-xs">
              {/* Licence Number */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-sky-300/80 uppercase block">
                    LICENCE NO.
                  </span>
                  <span className="font-mono font-bold text-white text-sm tracking-wider">
                    {maskValue(dl.licenseNumber)}
                  </span>
                </div>

                {/* Australian Card Number (for DVS identity checks) */}
                {dl.cardNumber && (
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-amber-300/90 uppercase block">
                      CARD NO. (DVS)
                    </span>
                    <span className="font-mono font-bold text-amber-300 text-xs tracking-wider">
                      {maskValue(dl.cardNumber)}
                    </span>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase block">NAME</span>
                <span className="font-bold text-slate-100 text-xs tracking-wide">
                  {dl.fullName}
                </span>
              </div>

              {/* DOB & Expiration */}
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div>
                  <span className="text-[8px] font-mono text-slate-400 block uppercase">DOB</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {maskValue(formatAusDate(dl.dob))}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-amber-300/90 uppercase flex items-center gap-1">
                    EXPIRY
                    {expiryStatus.isExpiringSoon && (
                      <span className="text-[7px] bg-amber-400 text-black px-1 rounded font-extrabold">SOON</span>
                    )}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      expiryStatus.isExpiringSoon
                        ? 'text-amber-300 underline decoration-amber-400 decoration-dotted'
                        : 'text-amber-300'
                    }`}
                  >
                    {formatAusDate(dl.expiryDate)}
                  </span>
                </div>
              </div>

              {/* Australian Class & Conditions */}
              <div className="flex items-center gap-3 text-[9px] font-mono text-slate-300">
                <span>
                  CLASS: <strong className="text-white">{dl.licenseClass || 'C'}</strong>
                </span>
                <span>
                  COND: <strong className="text-white">{dl.conditions || 'None'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Card Strip: Address */}
          <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/10 text-[9px] font-mono text-slate-300">
            <span className="truncate max-w-[220px]">
              {dl.address.replace('\n', ', ')}
            </span>
            <span className="text-sky-300">Tap to flip ➔</span>
          </div>
        </div>

        {/* ================= BACK SIDE (Australian Card Number, Barcode & Details) ================= */}
        <div className="absolute inset-0 w-full h-full rounded-2xl bg-[#0B1017] p-4 text-white rotate-y-180 backface-hidden flex flex-col justify-between overflow-hidden shadow-2xl border border-slate-700">
          {/* Photo scan overlay if active on back */}
          {viewPhotoScan && dl.backPhotoUrl ? (
            <div className="absolute inset-0 z-20 bg-black flex items-center justify-center p-2 rounded-2xl">
              <img
                src={dl.backPhotoUrl}
                alt="Back of Australian Driver Licence"
                className="w-full h-full object-contain rounded-xl"
              />
              <span className="absolute bottom-2 right-3 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded text-sky-300">
                Back Photo Capture
              </span>
            </div>
          ) : null}

          {/* Magnetic Stripe representation */}
          <div className="w-full h-7 bg-black -mx-4 -mt-1 shadow-inner border-y border-zinc-800 flex items-center px-4">
            <div className="w-full flex justify-between text-[7px] font-mono text-zinc-500 tracking-widest">
              <span>{dl.licenseNumber}</span>
              <span>COMMONWEALTH OF AUSTRALIA • {stateMeta.code}</span>
              <span>{dl.cardNumber || 'DVS VERIFIED'}</span>
            </div>
          </div>

          {/* Australian Card Number & Conditions Box */}
          <div className="grid grid-cols-2 gap-2 my-1">
            {/* Card Number highlight (Required on back of NSW/VIC/QLD licences) */}
            <div className="bg-[#141A23] p-2 rounded-xl border border-sky-500/20">
              <span className="text-[8px] font-mono text-amber-300 block font-bold uppercase">
                AUSTRALIAN CARD NUMBER (BACK)
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono text-xs font-bold text-white tracking-widest">
                  {maskValue(dl.cardNumber || 'PC' + dl.licenseNumber.slice(0, 8))}
                </span>
                {dl.cardNumber && (
                  <button
                    type="button"
                    onClick={handleCopyCardNumber}
                    className="text-[9px] font-mono text-sky-300 hover:text-white"
                  >
                    {copiedCardNo ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <span className="text-[7px] font-mono text-slate-400 block mt-0.5">
                Used for Document Verification Service (DVS)
              </span>
            </div>

            {/* Conditions & Class */}
            <div className="bg-[#141A23] p-2 rounded-xl border border-slate-700/60 text-[8px] font-mono space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Class:</span>
                <span className="font-bold text-white">{dl.licenseClass || 'C (Car)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Condition:</span>
                <span className="font-bold text-white">{dl.conditions || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Authority:</span>
                <span className="text-sky-300">{stateMeta.authority}</span>
              </div>
            </div>
          </div>

          {/* Scannable PDF417 / 2D Barcode Preview */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onShowBarcode(
                dl.barcodeData || `${stateMeta.code}-${dl.licenseNumber}-${dl.cardNumber || ''}`,
                `${stateMeta.name} Driver Licence Barcode`
              );
            }}
            className="my-auto p-2 rounded-xl bg-white text-black flex flex-col items-center hover:bg-slate-100 transition shadow-md"
            title="Tap to enlarge fullscreen scannable barcode"
          >
            <div className="w-full h-12 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                {Array.from({ length: 12 }).map((_, row) => {
                  return Array.from({ length: 45 }).map((_, col) => {
                    const hash =
                      (row * 73 + col * 31 + dl.licenseNumber.charCodeAt(col % dl.licenseNumber.length)) % 100;
                    return hash < 55 ? (
                      <rect
                        key={`${row}-${col}`}
                        x={col * 6.5}
                        y={row * 5}
                        width={6}
                        height={4.5}
                        fill="#000"
                      />
                    ) : null;
                  });
                })}
              </svg>
            </div>
            <div className="flex items-center justify-between w-full mt-0.5 px-1">
              <span className="font-mono text-[8px] text-zinc-700 font-bold">
                TAP TO OPEN FULLSCREEN SCANNABLE BARCODE
              </span>
              <QrCode className="w-3 h-3 text-zinc-700" />
            </div>
          </div>

          {/* Legal / Authority footer */}
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 border-t border-slate-800 pt-1">
            <span>{stateMeta.url}</span>
            <span className="text-sky-400">Back of Australian Licence • Tap to flip ➔</span>
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar underneath the Card */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-2">
          {/* Copy Licence Number */}
          <button
            type="button"
            onClick={handleCopyLicence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-sky-300 border border-[#323945] transition active:scale-95"
          >
            {copiedLicence ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedLicence ? 'Copied' : 'Licence No.'}</span>
          </button>

          {/* Copy Card Number if present */}
          {dl.cardNumber && (
            <button
              type="button"
              onClick={handleCopyCardNumber}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-amber-300 border border-[#323945] transition active:scale-95"
            >
              {copiedCardNo ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedCardNo ? 'Copied' : 'Card No.'}</span>
            </button>
          )}

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
          <button
            type="button"
            onClick={() =>
              onShowBarcode(
                dl.barcodeData || `${stateMeta.code}-${dl.licenseNumber}`,
                `${stateMeta.name} Driver Licence Barcode`
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E232B] hover:bg-[#282F3A] text-xs text-sky-300 border border-[#323945] transition"
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
