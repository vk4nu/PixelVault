import React, { useState, useEffect } from 'react';
import {
  VaultDocument,
  DocumentType,
  DriversLicenseData,
  MedicareCardData,
  PassportData,
  AustralianState,
} from '../types';
import {
  X,
  Camera,
  Trash2,
  Check,
  Shield,
  CreditCard,
  HeartPulse,
  Globe,
  Upload,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { CameraCapture } from './CameraCapture';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: VaultDocument) => void;
  onDelete?: (id: string) => void;
  initialDocument?: VaultDocument | null;
  defaultType?: DocumentType;
}

const AUS_STATES: { label: string; code: string }[] = [
  { label: 'New South Wales', code: 'NSW' },
  { label: 'Victoria', code: 'VIC' },
  { label: 'Queensland', code: 'QLD' },
  { label: 'Western Australia', code: 'WA' },
  { label: 'South Australia', code: 'SA' },
  { label: 'Tasmania', code: 'TAS' },
  { label: 'Australian Capital Territory', code: 'ACT' },
  { label: 'Northern Territory', code: 'NT' },
];

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDocument,
  defaultType = 'drivers_license',
}) => {
  const [docType, setDocType] = useState<DocumentType>(defaultType);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  // Australian Driver's License State
  const [dlState, setDlState] = useState<string>('New South Wales');
  const [dlStateCode, setDlStateCode] = useState<string>('NSW');
  const [dlNumber, setDlNumber] = useState('');
  const [dlCardNumber, setDlCardNumber] = useState(''); // Essential Australian Card Number (DVS)
  const [dlFullName, setDlFullName] = useState('');
  const [dlDob, setDlDob] = useState('');
  const [dlExpiry, setDlExpiry] = useState('');
  const [dlIssue, setDlIssue] = useState('');
  const [dlAddress, setDlAddress] = useState('');
  const [dlClass, setDlClass] = useState('C');
  const [dlLicenceType, setDlLicenceType] = useState<
    'Full / Unrestricted' | 'Provisional P1' | 'Provisional P2' | 'Learner'
  >('Full / Unrestricted');
  const [dlConditions, setDlConditions] = useState('None');
  const [dlOrganDonor, setDlOrganDonor] = useState(true);
  const [dlSex, setDlSex] = useState<'M' | 'F' | 'X'>('M');
  const [dlPhoto, setDlPhoto] = useState<string | undefined>(undefined);
  const [dlBackPhoto, setDlBackPhoto] = useState<string | undefined>(undefined);

  // Medicare State
  const [medCardNumber, setMedCardNumber] = useState('');
  const [medIrn, setMedIrn] = useState('1');
  const [medCardColor, setMedCardColor] = useState<'green' | 'blue' | 'yellow'>('green');
  const [medCardholder, setMedCardholder] = useState('');
  const [medBeneficiaries, setMedBeneficiaries] = useState<Array<{ irn: string; name: string }>>([
    { irn: '1', name: '' },
  ]);
  const [medValidTo, setMedValidTo] = useState('11/2028');
  const [medFrontPhoto, setMedFrontPhoto] = useState<string | undefined>(undefined);

  // Passport State
  const [passCountry, setPassCountry] = useState('Australia');
  const [passCode, setPassCode] = useState('AUS');
  const [passNumber, setPassNumber] = useState('');
  const [passFullName, setPassFullName] = useState('');
  const [passNationality, setPassNationality] = useState('AUSTRALIAN');
  const [passDob, setPassDob] = useState('');
  const [passSex, setPassSex] = useState<'M' | 'F' | 'X'>('M');
  const [passPlaceBirth, setPassPlaceBirth] = useState('');
  const [passIssue, setPassIssue] = useState('');
  const [passExpiry, setPassExpiry] = useState('');
  const [passAuthority, setPassAuthority] = useState('Australian Passport Office / DFAT');
  const [passPhoto, setPassPhoto] = useState<string | undefined>(undefined);

  // Camera capture modal state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraTargetField, setCameraTargetField] = useState<
    'dl_front' | 'dl_back' | 'med_front' | 'passport'
  >('dl_front');

  // Handle document type mapping on mount/edit
  useEffect(() => {
    if (initialDocument) {
      // Map legacy 'insurance' to 'medicare' if needed or keep existing
      const currentType =
        initialDocument.type === 'insurance' && !initialDocument.insurance
          ? 'medicare'
          : initialDocument.type;
      setDocType(currentType);
      setTitle(initialDocument.title || '');
      setNotes(initialDocument.notes || '');

      if (initialDocument.type === 'drivers_license' && initialDocument.driversLicense) {
        const dl = initialDocument.driversLicense;
        setDlState(dl.state || 'New South Wales');
        setDlStateCode(dl.stateCode || 'NSW');
        setDlNumber(dl.licenseNumber || '');
        setDlCardNumber(dl.cardNumber || '');
        setDlFullName(dl.fullName || '');
        setDlDob(dl.dob || '');
        setDlExpiry(dl.expiryDate || '');
        setDlIssue(dl.issueDate || '');
        setDlAddress(dl.address || '');
        setDlClass(dl.licenseClass || 'C');
        setDlLicenceType(dl.licenceType || 'Full / Unrestricted');
        setDlConditions(dl.conditions || 'None');
        setDlOrganDonor(dl.organDonor ?? true);
        setDlSex(dl.sex || 'M');
        setDlPhoto(dl.photoUrl);
        setDlBackPhoto(dl.backPhotoUrl);
      } else if (
        (initialDocument.type === 'medicare' || initialDocument.type === 'insurance') &&
        (initialDocument.medicare || initialDocument.insurance)
      ) {
        if (initialDocument.medicare) {
          const m = initialDocument.medicare;
          setMedCardNumber(m.cardNumber || '');
          setMedIrn(m.irn || '1');
          setMedCardColor(m.cardColor || 'green');
          setMedCardholder(m.cardholderName || '');
          setMedValidTo(m.validTo || '11/2028');
          setMedFrontPhoto(m.frontPhotoUrl);
          if (m.beneficiaries && m.beneficiaries.length > 0) {
            setMedBeneficiaries(m.beneficiaries);
          } else if (m.cardholderName) {
            setMedBeneficiaries([{ irn: m.irn || '1', name: m.cardholderName }]);
          }
        } else if (initialDocument.insurance) {
          // Fallback conversion from legacy insurance
          const ins = initialDocument.insurance;
          setMedCardNumber(ins.memberId || '2954 81920 1');
          setMedCardholder(ins.memberName || '');
          setMedBeneficiaries([{ irn: '1', name: ins.memberName || '' }]);
          setMedFrontPhoto(ins.frontPhotoUrl);
        }
      } else if (initialDocument.type === 'passport' && initialDocument.passport) {
        const pass = initialDocument.passport;
        setPassCountry(pass.issuingCountry || 'Australia');
        setPassCode(pass.countryCode || 'AUS');
        setPassNumber(pass.passportNumber || '');
        setPassFullName(pass.fullName || '');
        setPassNationality(pass.nationality || 'AUSTRALIAN');
        setPassDob(pass.dob || '');
        setPassSex(pass.sex || 'M');
        setPassPlaceBirth(pass.placeOfBirth || '');
        setPassIssue(pass.issueDate || '');
        setPassExpiry(pass.expiryDate || '');
        setPassAuthority(pass.authority || 'Australian Passport Office / DFAT');
        setPassPhoto(pass.photoUrl);
      }
    } else {
      // New doc defaults
      const resolvedType = defaultType === 'insurance' ? 'medicare' : defaultType;
      setDocType(resolvedType);
      setTitle('');
      setNotes('');
      setDlState('New South Wales');
      setDlStateCode('NSW');
      setDlNumber('');
      setDlCardNumber('');
      setDlFullName('');
      setDlDob('');
      setDlExpiry('');
      setDlAddress('');
      setDlPhoto(undefined);
      setDlBackPhoto(undefined);

      setMedCardNumber('');
      setMedIrn('1');
      setMedCardColor('green');
      setMedCardholder('');
      setMedBeneficiaries([{ irn: '1', name: '' }]);
      setMedValidTo('11/2028');
      setMedFrontPhoto(undefined);

      setPassCountry('Australia');
      setPassCode('AUS');
      setPassNumber('');
      setPassFullName('');
      setPassNationality('AUSTRALIAN');
      setPassDob('');
      setPassExpiry('');
      setPassPhoto(undefined);
    }
  }, [initialDocument, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleStateSelect = (stateName: string) => {
    setDlState(stateName);
    const found = AUS_STATES.find((s) => s.label === stateName);
    if (found) setDlStateCode(found.code);
  };

  const handleOpenScanner = (
    target: 'dl_front' | 'dl_back' | 'med_front' | 'passport'
  ) => {
    setCameraTargetField(target);
    setCameraOpen(true);
  };

  const handleCaptureResult = (dataUrl: string) => {
    if (cameraTargetField === 'dl_front') {
      setDlPhoto(dataUrl);
    } else if (cameraTargetField === 'dl_back') {
      setDlBackPhoto(dataUrl);
    } else if (cameraTargetField === 'med_front') {
      setMedFrontPhoto(dataUrl);
    } else if (cameraTargetField === 'passport') {
      setPassPhoto(dataUrl);
    }
  };

  const addBeneficiary = () => {
    const nextIrn = String(medBeneficiaries.length + 1);
    setMedBeneficiaries([...medBeneficiaries, { irn: nextIrn, name: '' }]);
  };

  const updateBeneficiaryName = (index: number, name: string) => {
    const updated = [...medBeneficiaries];
    updated[index].name = name;
    setMedBeneficiaries(updated);
    if (index === 0) setMedCardholder(name);
  };

  const removeBeneficiary = (index: number) => {
    if (medBeneficiaries.length <= 1) return;
    const updated = medBeneficiaries
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, irn: String(i + 1) }));
    setMedBeneficiaries(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const id = initialDocument?.id || `doc-${docType}-${Date.now()}`;
    const now = Date.now();

    let docTitle = title.trim();
    if (!docTitle) {
      if (docType === 'drivers_license') {
        docTitle = `Driver's Licence (${dlStateCode || dlState} Australia)`;
      } else if (docType === 'medicare' || docType === 'insurance') {
        docTitle = 'Medicare Card (Australia)';
      } else {
        docTitle = `${passCountry || 'Australia'} Passport`;
      }
    }

    const payload: VaultDocument = {
      id,
      type: docType === 'insurance' ? 'medicare' : docType,
      title: docTitle,
      createdAt: initialDocument?.createdAt || now,
      updatedAt: now,
      notes,
    };

    if (docType === 'drivers_license') {
      payload.driversLicense = {
        country: 'Australia',
        state: dlState,
        stateCode: dlStateCode,
        licenseNumber: dlNumber.toUpperCase().trim(),
        cardNumber: dlCardNumber.toUpperCase().trim(),
        fullName: dlFullName.toUpperCase().trim(),
        dob: dlDob,
        expiryDate: dlExpiry,
        issueDate: dlIssue,
        address: dlAddress,
        licenseClass: dlClass,
        licenceType: dlLicenceType,
        conditions: dlConditions,
        organDonor: dlOrganDonor,
        sex: dlSex,
        photoUrl: dlPhoto,
        backPhotoUrl: dlBackPhoto,
        barcodeData: `AUS-${dlStateCode}-DL-${dlNumber.toUpperCase().trim()}-CARD-${dlCardNumber.toUpperCase().trim()}`,
      };
    } else if (docType === 'medicare' || docType === 'insurance') {
      const cleanNum = medCardNumber.trim();
      payload.type = 'medicare';
      payload.medicare = {
        cardNumber: cleanNum,
        irn: medIrn || '1',
        cardColor: medCardColor,
        cardholderName: (medCardholder || medBeneficiaries[0]?.name || '').toUpperCase().trim(),
        beneficiaries: medBeneficiaries
          .filter((b) => b.name.trim().length > 0)
          .map((b) => ({ irn: b.irn, name: b.name.toUpperCase().trim() })),
        validTo: medValidTo.trim(),
        frontPhotoUrl: medFrontPhoto,
        medicareType:
          medCardColor === 'green'
            ? 'Australian Resident'
            : medCardColor === 'blue'
            ? 'Interim Recipient'
            : 'Reciprocal',
      };
    } else if (docType === 'passport') {
      const formattedName = passFullName.toUpperCase().trim();
      const code = passCode.toUpperCase().trim() || 'AUS';
      const pNum = passNumber.toUpperCase().trim();
      payload.passport = {
        issuingCountry: passCountry.trim(),
        countryCode: code,
        passportNumber: pNum,
        fullName: formattedName,
        nationality: passNationality.toUpperCase().trim(),
        dob: passDob,
        sex: passSex,
        placeOfBirth: passPlaceBirth.toUpperCase().trim(),
        issueDate: passIssue,
        expiryDate: passExpiry,
        authority: passAuthority.trim(),
        mrzLine1: `P<${code}${formattedName.replace(/\s+/g, '<')}<<<<<<<<<<<<<<<<<<`,
        mrzLine2: `${pNum}<0${code}${passDob.replace(/-/g, '').slice(2)}4${passSex}${passExpiry.replace(/-/g, '').slice(2)}8<<<<<<<<<<<<00`,
        photoUrl: passPhoto,
      };
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-[#171B22] border border-[#2F3642] shadow-2xl text-white overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A313C] bg-[#13161C]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              {initialDocument ? 'Edit Document' : 'Add Secure Document'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#222832] hover:bg-[#2E3644] flex items-center justify-center text-gray-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Document Type Selector (only on create) */}
          {!initialDocument && (
            <div>
              <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1.5">
                Select Australian Document Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDocType('drivers_license')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    docType === 'drivers_license'
                      ? 'bg-blue-600/20 border-blue-400 text-blue-300'
                      : 'bg-[#1D222A] border-[#2C3440] text-gray-300 hover:bg-[#252C36]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>Driver Licence (AUS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('medicare')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    docType === 'medicare' || docType === 'insurance'
                      ? 'bg-emerald-600/20 border-emerald-400 text-emerald-300'
                      : 'bg-[#1D222A] border-[#2C3440] text-gray-300 hover:bg-[#252C36]'
                  }`}
                >
                  <HeartPulse className="w-4 h-4 text-emerald-400" />
                  <span>Medicare Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('passport')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    docType === 'passport'
                      ? 'bg-indigo-600/20 border-indigo-400 text-indigo-300'
                      : 'bg-[#1D222A] border-[#2C3440] text-gray-300 hover:bg-[#252C36]'
                  }`}
                >
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Passport</span>
                </button>
              </div>
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="text-xs text-gray-300 font-medium block mb-1">
              Document Label / Nickname
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                docType === 'drivers_license'
                  ? `e.g. My ${dlStateCode || 'NSW'} Driver's Licence`
                  : docType === 'medicare' || docType === 'insurance'
                  ? 'e.g. Australian Medicare Card'
                  : 'e.g. Australian Adult Passport'
              }
              className="w-full px-3.5 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-sm text-white focus:outline-hidden focus:border-blue-400 transition"
            />
          </div>

          {/* ================= AUSTRALIAN DRIVER'S LICENCE FIELDS (FRONT & BACK) ================= */}
          {docType === 'drivers_license' && (
            <div className="space-y-4 bg-[#13161D] p-4 rounded-2xl border border-[#272E3A]">
              <div className="flex items-center justify-between border-b border-[#262E3B] pb-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Australian Driver Licence Details</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">Front & Back Supported</span>
              </div>

              {/* Australian State / Territory Selector */}
              <div>
                <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                  State / Territory Authority
                </label>
                <select
                  value={dlState}
                  onChange={(e) => handleStateSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs text-white focus:border-blue-400"
                >
                  {AUS_STATES.map((s) => (
                    <option key={s.code} value={s.label}>
                      {s.label} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Number and Australian Card Number (for DVS verification) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Licence Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={dlNumber}
                    onChange={(e) => setDlNumber(e.target.value)}
                    placeholder="e.g. 84920192"
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-amber-300 uppercase block mb-1">
                    Card Number (DVS Check)
                  </label>
                  <input
                    type="text"
                    value={dlCardNumber}
                    onChange={(e) => setDlCardNumber(e.target.value)}
                    placeholder="e.g. PC94821038"
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-amber-300 focus:border-amber-400"
                  />
                  <span className="text-[9px] text-gray-500 font-mono">Found on back/front</span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                  Full Name (as printed) *
                </label>
                <input
                  type="text"
                  required
                  value={dlFullName}
                  onChange={(e) => setDlFullName(e.target.value)}
                  placeholder="e.g. ALEX JORDAN MORGAN"
                  className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs text-white focus:border-blue-400"
                />
              </div>

              {/* DOB & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={dlDob}
                    onChange={(e) => setDlDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-amber-300 uppercase block mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dlExpiry}
                    onChange={(e) => setDlExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  value={dlAddress}
                  onChange={(e) => setDlAddress(e.target.value)}
                  placeholder="e.g. 42 GEORGE STREET&#10;SYDNEY NSW 2000"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white focus:border-blue-400"
                />
              </div>

              {/* Class, Type, Conditions */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                    Class
                  </label>
                  <input
                    type="text"
                    value={dlClass}
                    onChange={(e) => setDlClass(e.target.value)}
                    placeholder="C, R, MR..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#1C2129] border border-[#303845] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                    Licence Type
                  </label>
                  <select
                    value={dlLicenceType}
                    onChange={(e) =>
                      setDlLicenceType(
                        e.target.value as
                          | 'Full / Unrestricted'
                          | 'Provisional P1'
                          | 'Provisional P2'
                          | 'Learner'
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-[#1C2129] border border-[#303845] text-[11px] text-white"
                  >
                    <option value="Full / Unrestricted">Full</option>
                    <option value="Provisional P1">Provisional P1</option>
                    <option value="Provisional P2">Provisional P2</option>
                    <option value="Learner">Learner (L)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                    Conditions
                  </label>
                  <input
                    type="text"
                    value={dlConditions}
                    onChange={(e) => setDlConditions(e.target.value)}
                    placeholder="None, S..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#1C2129] border border-[#303845] text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Organ donor checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="organDonor"
                  checked={dlOrganDonor}
                  onChange={(e) => setDlOrganDonor(e.target.checked)}
                  className="rounded bg-[#1C2129] border-[#303845] text-blue-600 focus:ring-0"
                />
                <label htmlFor="organDonor" className="text-xs text-gray-300">
                  Registered Australian Organ Donor (<span className="text-rose-400">Donor: A</span>)
                </label>
              </div>

              {/* FRONT AND BACK PHOTO CAPTURE SECTION (Explicitly requested by user) */}
              <div className="pt-2 border-t border-[#262E3B] space-y-3">
                <span className="text-xs font-bold text-sky-300 block uppercase font-mono">
                  Physical Licence Scans (Front & Back)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* Front of Card Box */}
                  <div className="bg-[#191F29] p-2.5 rounded-xl border border-[#2D3645] flex flex-col justify-between">
                    <span className="text-[10px] font-mono text-gray-300 block font-semibold mb-1">
                      1. FRONT OF LICENCE
                    </span>
                    {dlPhoto ? (
                      <div className="relative w-full aspect-[1.58/1] rounded-lg overflow-hidden border border-sky-400/40 mb-2">
                        <img
                          src={dlPhoto}
                          alt="Front Scan"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setDlPhoto(undefined)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-rose-300 hover:text-rose-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-[1.58/1] rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 mb-2">
                        <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                        <span className="text-[9px] font-mono">No Front Scan</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenScanner('dl_front')}
                      className="w-full py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{dlPhoto ? 'Re-scan Front' : 'Scan Front'}</span>
                    </button>
                  </div>

                  {/* Back of Card Box */}
                  <div className="bg-[#191F29] p-2.5 rounded-xl border border-[#2D3645] flex flex-col justify-between">
                    <span className="text-[10px] font-mono text-gray-300 block font-semibold mb-1">
                      2. BACK OF LICENCE
                    </span>
                    {dlBackPhoto ? (
                      <div className="relative w-full aspect-[1.58/1] rounded-lg overflow-hidden border border-sky-400/40 mb-2">
                        <img
                          src={dlBackPhoto}
                          alt="Back Scan"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setDlBackPhoto(undefined)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-rose-300 hover:text-rose-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-[1.58/1] rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 mb-2">
                        <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                        <span className="text-[9px] font-mono">No Back Scan</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenScanner('dl_back')}
                      className="w-full py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{dlBackPhoto ? 'Re-scan Back' : 'Scan Back'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= MEDICARE CARD FIELDS (FRONT REQUIRED) ================= */}
          {(docType === 'medicare' || docType === 'insurance') && (
            <div className="space-y-4 bg-[#13161D] p-4 rounded-2xl border border-[#272E3A]">
              <div className="flex items-center justify-between border-b border-[#262E3B] pb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Australian Medicare Card Details</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-300">Front Scan Required</span>
              </div>

              {/* Card Color / Type */}
              <div>
                <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                  Card Tier / Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMedCardColor('green')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                      medCardColor === 'green'
                        ? 'bg-emerald-600/25 border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-[#1C2129] border-[#303845] text-gray-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Green (Standard)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedCardColor('blue')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                      medCardColor === 'blue'
                        ? 'bg-sky-600/25 border-sky-400 text-sky-300 font-bold'
                        : 'bg-[#1C2129] border-[#303845] text-gray-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>Blue (Interim)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedCardColor('yellow')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                      medCardColor === 'yellow'
                        ? 'bg-amber-600/25 border-amber-400 text-amber-300 font-bold'
                        : 'bg-[#1C2129] border-[#303845] text-gray-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Yellow (Reciprocal)</span>
                  </button>
                </div>
              </div>

              {/* Medicare Card Number (10 Digits) & IRN */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-mono text-emerald-300 uppercase block mb-1">
                    Medicare Number (10 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    value={medCardNumber}
                    onChange={(e) => setMedCardNumber(e.target.value)}
                    placeholder="e.g. 2954 81920 1"
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono font-bold text-white focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-amber-300 uppercase block mb-1">
                    Your IRN (1-9) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={medIrn}
                    onChange={(e) => setMedIrn(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono font-bold text-amber-300 focus:border-amber-400 text-center"
                  />
                  <span className="text-[8px] text-gray-500 font-mono block text-center">
                    Line on card
                  </span>
                </div>
              </div>

              {/* Valid To Date (MM/YYYY) */}
              <div>
                <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                  Valid To (MM/YYYY) *
                </label>
                <input
                  type="text"
                  required
                  value={medValidTo}
                  onChange={(e) => setMedValidTo(e.target.value)}
                  placeholder="e.g. 11/2028"
                  className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white focus:border-emerald-400"
                />
              </div>

              {/* Cardholders / Beneficiaries on Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-gray-400 uppercase">
                    Cardholders & Family Members (Lines)
                  </label>
                  <button
                    type="button"
                    onClick={addBeneficiary}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Member</span>
                  </button>
                </div>

                {medBeneficiaries.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-8 rounded-lg bg-[#202734] border border-[#303B4C] flex items-center justify-center font-mono text-xs text-amber-300 font-bold shrink-0">
                      {b.irn}
                    </span>
                    <input
                      type="text"
                      value={b.name}
                      onChange={(e) => updateBeneficiaryName(idx, e.target.value)}
                      placeholder={idx === 0 ? 'Primary Name (e.g. MORGAN, ALEX J)' : 'Family member name'}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white"
                    />
                    {medBeneficiaries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBeneficiary(idx)}
                        className="p-1.5 text-gray-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* MEDICARE FRONT CARD SCAN (Explicitly required by user) */}
              <div className="pt-2 border-t border-[#262E3B] space-y-2">
                <span className="text-xs font-bold text-emerald-300 block uppercase font-mono">
                  Medicare Card Scan (Front)
                </span>

                <div className="bg-[#191F29] p-3 rounded-xl border border-[#2D3645] flex items-center justify-between gap-4">
                  {medFrontPhoto ? (
                    <div className="relative w-28 aspect-[1.58/1] rounded-lg overflow-hidden border border-emerald-400/40 shrink-0">
                      <img
                        src={medFrontPhoto}
                        alt="Medicare Front Scan"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setMedFrontPhoto(undefined)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-rose-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 aspect-[1.58/1] rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 shrink-0">
                      <ImageIcon className="w-4 h-4 mb-0.5 opacity-50" />
                      <span className="text-[8px] font-mono">No Front Scan</span>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col items-start gap-1">
                    <p className="text-[11px] text-gray-300">
                      Capture or upload the physical front of your Medicare card.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenScanner('med_front')}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{medFrontPhoto ? 'Re-scan Front' : 'Scan Front of Medicare'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PASSPORT FIELDS ================= */}
          {docType === 'passport' && (
            <div className="space-y-4 bg-[#13161D] p-4 rounded-2xl border border-[#272E3A]">
              <div className="flex items-center justify-between border-b border-[#262E3B] pb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Passport Details</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenScanner('passport')}
                  className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 px-2.5 py-1 rounded-lg border border-indigo-400/30 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{passPhoto ? 'Re-scan Page' : 'Scan Photo Page'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Issuing Country
                  </label>
                  <input
                    type="text"
                    value={passCountry}
                    onChange={(e) => setPassCountry(e.target.value)}
                    placeholder="Australia"
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={passCode}
                    onChange={(e) => setPassCode(e.target.value)}
                    placeholder="AUS"
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Passport Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={passNumber}
                    onChange={(e) => setPassNumber(e.target.value)}
                    placeholder="e.g. N8492019"
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={passNationality}
                    onChange={(e) => setPassNationality(e.target.value)}
                    placeholder="AUSTRALIAN"
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                  Full Name (Surname, Given Names) *
                </label>
                <input
                  type="text"
                  required
                  value={passFullName}
                  onChange={(e) => setPassFullName(e.target.value)}
                  placeholder="MORGAN, ALEX JORDAN"
                  className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={passDob}
                    onChange={(e) => setPassDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-amber-300 uppercase block mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={passExpiry}
                    onChange={(e) => setPassExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Secure Notes */}
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">
              Encrypted Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Card verification dates, clinic references, renewal bookmarks..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#1C2129] border border-[#303845] text-xs text-white focus:outline-hidden focus:border-blue-400 transition"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#2A313C]">
            {initialDocument && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this document from your Pixel Vault?')) {
                    onDelete(initialDocument.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/15 transition text-xs font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#20252E] hover:bg-[#2C3340] text-xs text-gray-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Save to Vault</span>
              </button>
            </div>
          </div>
        </form>

        {/* Camera Capture Modal */}
        <CameraCapture
          isOpen={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCaptureResult}
          title={
            cameraTargetField === 'dl_front'
              ? 'Scan Front of Australian Licence'
              : cameraTargetField === 'dl_back'
              ? 'Scan Back of Australian Licence'
              : cameraTargetField === 'med_front'
              ? 'Scan Front of Medicare Card'
              : 'Scan Passport Photo Page'
          }
          aspectRatio={cameraTargetField === 'passport' ? 'passport' : 'card'}
        />
      </div>
    </div>
  );
};
