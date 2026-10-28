/**
 * Pixel Vault - Personal Biometric Document Storage for Google Pixel
 * Driver's License • Medical Insurance Cards • Passport
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  VaultDocument,
  DocumentType,
  VaultSecurityConfig,
} from './types';
import {
  getSecurityConfig,
  saveSecurityConfig,
  setupVaultSecurity,
  saveEncryptedDocuments,
  loadDecryptedDocuments,
  DEFAULT_DOCUMENTS,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { BottomNav, NavFilter } from './components/BottomNav';
import { LockScreen } from './components/LockScreen';
import { DriversLicenseCard } from './components/cards/DriversLicenseCard';
import { MedicareCard } from './components/cards/MedicareCard';
import { InsuranceCard } from './components/cards/InsuranceCard';
import { PassportCard } from './components/cards/PassportCard';
import { DocumentModal } from './components/DocumentModal';
import { SettingsModal } from './components/SettingsModal';
import { BarcodeModal } from './components/BarcodeModal';
import { PixelPhoneFrame } from './components/PixelPhoneFrame';
import { StartupExpiryBanner } from './components/StartupExpiryBanner';
import {
  runStartupExpiryCheck,
  getDocumentExpiryStatus,
  StartupExpiryCheckReport,
} from './utils/expiry';
import {
  Shield,
  Plus,
  Search,
  CreditCard,
  HeartPulse,
  Globe,
  Lock,
  WifiOff,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default function App() {
  // Security & Authentication State
  const [securityConfig, setSecurityConfig] = useState<VaultSecurityConfig>(getSecurityConfig);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [currentPin, setCurrentPin] = useState<string>('1234');
  const [documents, setDocuments] = useState<VaultDocument[]>(DEFAULT_DOCUMENTS);

  // Background startup check for documents expiring within 30 days
  const [startupExpiryReport, setStartupExpiryReport] = useState<StartupExpiryCheckReport | null>(null);

  useEffect(() => {
    // Background check on application startup that compares document expiry dates with the current date
    const report = runStartupExpiryCheck(documents);
    setStartupExpiryReport(report);
  }, [documents]);

  // UI State
  const [currentFilter, setCurrentFilter] = useState<NavFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideSensitive, setHideSensitive] = useState<boolean>(true);
  const [isPixelFrameActive, setIsPixelFrameActive] = useState<boolean>(true);

  // Modals
  const [documentModalOpen, setDocumentModalOpen] = useState<boolean>(false);
  const [editingDocument, setEditingDocument] = useState<VaultDocument | null>(null);
  const [defaultAddType, setDefaultAddType] = useState<DocumentType>('drivers_license');
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // Barcode Modal
  const [barcodeModalState, setBarcodeModalState] = useState<{
    isOpen: boolean;
    code: string;
    title: string;
    type: 'pdf417' | 'code128';
  }>({
    isOpen: false,
    code: '',
    title: '',
    type: 'pdf417',
  });

  // Offline status tracking
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Lock vault helper
  const lockVault = useCallback(() => {
    setIsLocked(true);
    setCurrentPin('');
    // Clear any sensitive modal states
    setBarcodeModalState({ isOpen: false, code: '', title: '', type: 'pdf417' });
    setDocumentModalOpen(false);
    setEditingDocument(null);
  }, []);

  // Auto-lock inactivity timer
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('pointerdown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const interval = setInterval(() => {
      if (!isLocked && securityConfig.autoLockSeconds > 0) {
        const elapsed = (Date.now() - lastActivityRef.current) / 1000;
        if (elapsed >= securityConfig.autoLockSeconds) {
          lockVault();
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('pointerdown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(interval);
    };
  }, [isLocked, securityConfig.autoLockSeconds, lockVault]);

  // Lock automatically when browser tab or screen turns off / backgrounded
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !isLocked) {
        lockVault();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isLocked, lockVault]);

  // Unlock handler
  const handleUnlockSuccess = async (pin: string) => {
    setCurrentPin(pin);
    try {
      const decrypted = await loadDecryptedDocuments(pin, securityConfig.salt);
      setDocuments(decrypted);
    } catch {
      // If decryption fails, keep fallback docs
      setDocuments(DEFAULT_DOCUMENTS);
    }
    setIsLocked(false);
  };

  // Initial Vault Setup handler
  const handleInitialSetup = async (
    pin: string,
    enableBio: boolean,
    credentialId?: string
  ) => {
    const config = await setupVaultSecurity(pin, enableBio, credentialId);
    setSecurityConfig(config);
    setCurrentPin(pin);
    setDocuments(DEFAULT_DOCUMENTS);
    setIsLocked(false);
  };

  // Save Document
  const handleSaveDocument = async (doc: VaultDocument) => {
    const existingIndex = documents.findIndex((d) => d.id === doc.id);
    let updatedDocs: VaultDocument[];

    if (existingIndex >= 0) {
      updatedDocs = [...documents];
      updatedDocs[existingIndex] = doc;
    } else {
      updatedDocs = [doc, ...documents];
    }

    setDocuments(updatedDocs);
    await saveEncryptedDocuments(updatedDocs, currentPin, securityConfig.salt);
  };

  // Delete Document
  const handleDeleteDocument = async (id: string) => {
    const updatedDocs = documents.filter((d) => d.id !== id);
    setDocuments(updatedDocs);
    await saveEncryptedDocuments(updatedDocs, currentPin, securityConfig.salt);
  };

  // Open add document
  const handleAddNew = (type: DocumentType = 'drivers_license') => {
    setDefaultAddType(type);
    setEditingDocument(null);
    setDocumentModalOpen(true);
  };

  // Open edit document
  const handleEditDocument = (doc: VaultDocument) => {
    setEditingDocument(doc);
    setDefaultAddType(doc.type);
    setDocumentModalOpen(true);
  };

  // Open barcode scanner modal
  const handleShowBarcode = (code: string, title: string, type: 'pdf417' | 'code128' = 'pdf417') => {
    setBarcodeModalState({
      isOpen: true,
      code,
      title,
      type,
    });
  };

  // Counts for tabs & expiring status
  const expiringSoonCount = documents.filter((d) => {
    const st = getDocumentExpiryStatus(d);
    return st.isExpiringSoon || st.isExpired;
  }).length;

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const isDocExpiring = () => {
      const st = getDocumentExpiryStatus(doc);
      return st.isExpiringSoon || st.isExpired;
    };

    const matchesFilter =
      currentFilter === 'all' ||
      (currentFilter === 'expiring_soon' && isDocExpiring()) ||
      doc.type === currentFilter ||
      (currentFilter === 'medicare' && doc.type === 'insurance') ||
      (currentFilter === 'insurance' && doc.type === 'medicare');
    if (!matchesFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.driversLicense?.fullName.toLowerCase().includes(q) ||
      doc.driversLicense?.licenseNumber.toLowerCase().includes(q) ||
      doc.driversLicense?.cardNumber?.toLowerCase().includes(q) ||
      doc.medicare?.cardholderName.toLowerCase().includes(q) ||
      doc.medicare?.cardNumber.toLowerCase().includes(q) ||
      doc.insurance?.providerName.toLowerCase().includes(q) ||
      doc.insurance?.memberId.toLowerCase().includes(q) ||
      doc.passport?.fullName.toLowerCase().includes(q) ||
      doc.passport?.passportNumber.toLowerCase().includes(q)
    );
  });

  const counts = {
    all: documents.length,
    drivers_license: documents.filter((d) => d.type === 'drivers_license').length,
    medicare: documents.filter((d) => d.type === 'medicare' || d.type === 'insurance').length,
    passport: documents.filter((d) => d.type === 'passport').length,
    expiringSoon: expiringSoonCount,
  };

  return (
    <PixelPhoneFrame isFrameActive={isPixelFrameActive}>
      {/* Offline Mode Toast Indicator */}
      {!isOnline && (
        <div className="bg-amber-600 text-black px-3 py-1 text-[11px] font-semibold flex items-center justify-center gap-1.5 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode • Vault encrypted locally on Pixel</span>
        </div>
      )}

      {/* Lock Screen if locked */}
      {isLocked ? (
        <LockScreen
          securityConfig={securityConfig}
          onUnlockSuccess={handleUnlockSuccess}
          onInitialSetup={handleInitialSetup}
        />
      ) : (
        <div className="flex flex-col min-h-full bg-[#0E1116] text-[#E2E2E6]">
          {/* Top Navbar */}
          <Navbar
            onLock={lockVault}
            hideSensitive={hideSensitive}
            onToggleHideSensitive={() => setHideSensitive(!hideSensitive)}
            onOpenSettings={() => setSettingsModalOpen(true)}
            onAddNew={() => handleAddNew('drivers_license')}
            isPixelFrameMode={isPixelFrameActive}
            onTogglePixelFrame={() => setIsPixelFrameActive(!isPixelFrameActive)}
            expiringSoonCount={counts.expiringSoon}
            onOpenExpiringAlert={() =>
              setCurrentFilter(currentFilter === 'expiring_soon' ? 'all' : 'expiring_soon')
            }
          />

          {/* Main Vault Content */}
          <main className="flex-1 px-4 py-4 space-y-4">
            {/* Startup Expiry Alert Banner (runs comparison check against 30-day window) */}
            <StartupExpiryBanner
              report={startupExpiryReport}
              onFilterExpiring={() => setCurrentFilter('expiring_soon')}
            />

            {/* Filter Pill if currently showing expiring soon documents */}
            {currentFilter === 'expiring_soon' && (
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Filtered: Showing {filteredDocs.length} document(s) expiring within 30 days</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentFilter('all')}
                  className="font-mono underline text-[11px] text-amber-200 hover:text-white ml-2"
                >
                  Show all
                </button>
              </div>
            )}
            {/* Search and Quick Filter Bar */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Australian licence, Medicare, passport..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#181C23] border border-[#2B3340] text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-400 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Summary Pill Bar when in 'All' View */}
            {currentFilter === 'all' && (
              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => setCurrentFilter('drivers_license')}
                  className="bg-[#151921] p-2.5 rounded-2xl border border-[#262E3B] cursor-pointer hover:border-blue-400/40 transition group"
                >
                  <div className="flex items-center justify-between text-blue-400 mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold">{counts.drivers_license}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-300 block">Licence</span>
                  <span className="text-[9px] text-gray-500 font-mono">Front & Back (AUS)</span>
                </div>

                <div
                  onClick={() => setCurrentFilter('medicare')}
                  className="bg-[#151921] p-2.5 rounded-2xl border border-[#262E3B] cursor-pointer hover:border-emerald-400/40 transition group"
                >
                  <div className="flex items-center justify-between text-emerald-400 mb-1">
                    <HeartPulse className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold">{counts.medicare}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-300 block">Medicare</span>
                  <span className="text-[9px] text-gray-500 font-mono">Front Scan & IRN</span>
                </div>

                <div
                  onClick={() => setCurrentFilter('passport')}
                  className="bg-[#151921] p-2.5 rounded-2xl border border-[#262E3B] cursor-pointer hover:border-indigo-400/40 transition group"
                >
                  <div className="flex items-center justify-between text-indigo-400 mb-1">
                    <Globe className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold">{counts.passport}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-300 block">Passport</span>
                  <span className="text-[9px] text-gray-500 font-mono">Biometric MRZ</span>
                </div>
              </div>
            )}

            {/* Document Cards Container */}
            <div className="space-y-4">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => {
                  if (doc.type === 'drivers_license') {
                    return (
                      <DriversLicenseCard
                        key={doc.id}
                        document={doc}
                        hideSensitive={hideSensitive}
                        onEdit={() => handleEditDocument(doc)}
                        onShowBarcode={(code, title) => handleShowBarcode(code, title, 'pdf417')}
                      />
                    );
                  }
                  if (doc.type === 'medicare' || doc.medicare) {
                    return (
                      <MedicareCard
                        key={doc.id}
                        document={doc}
                        hideSensitive={hideSensitive}
                        onEdit={() => handleEditDocument(doc)}
                        onShowBarcode={(code, title) => handleShowBarcode(code, title, 'code128')}
                      />
                    );
                  }
                  if (doc.type === 'insurance') {
                    return (
                      <InsuranceCard
                        key={doc.id}
                        document={doc}
                        hideSensitive={hideSensitive}
                        onEdit={() => handleEditDocument(doc)}
                        onShowBarcode={(code, title) => handleShowBarcode(code, title, 'code128')}
                      />
                    );
                  }
                  if (doc.type === 'passport') {
                    return (
                      <PassportCard
                        key={doc.id}
                        document={doc}
                        hideSensitive={hideSensitive}
                        onEdit={() => handleEditDocument(doc)}
                      />
                    );
                  }
                  return null;
                })
              ) : (
                /* Empty state */
                <div className="py-12 flex flex-col items-center justify-center text-center px-4 bg-[#141820] rounded-3xl border border-[#262D39]">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-white">No documents found</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    {searchQuery
                      ? 'No items matched your search query.'
                      : 'Store your Australian driver licence, Medicare card, and passport securely in this vault with biometric authentication.'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddNew(
                        currentFilter !== 'all' ? currentFilter : 'drivers_license'
                      )
                    }
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add {currentFilter !== 'all' ? currentFilter.replace('_', ' ') : 'Document'}</span>
                  </button>
                </div>
              )}
            </div>
          </main>

          {/* Bottom Navigation */}
          <BottomNav
            currentFilter={currentFilter}
            onSelectFilter={(f) => setCurrentFilter(f)}
            onAddNew={() =>
              handleAddNew(
                currentFilter !== 'all' ? currentFilter : 'drivers_license'
              )
            }
            counts={counts}
          />
        </div>
      )}

      {/* Edit / Add Document Modal */}
      <DocumentModal
        isOpen={documentModalOpen}
        onClose={() => {
          setDocumentModalOpen(false);
          setEditingDocument(null);
        }}
        onSave={handleSaveDocument}
        onDelete={handleDeleteDocument}
        initialDocument={editingDocument}
        defaultType={defaultAddType}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        securityConfig={securityConfig}
        onUpdateSecurity={(newConfig) => {
          setSecurityConfig(newConfig);
          saveSecurityConfig(newConfig);
        }}
        documents={documents}
        currentPin={currentPin}
        onRestoreDocuments={(restored) => {
          setDocuments(restored);
          saveEncryptedDocuments(restored, currentPin, securityConfig.salt);
        }}
        onWipeVault={() => {
          setDocuments([]);
          setSecurityConfig(getSecurityConfig());
          setIsLocked(true);
        }}
      />

      {/* Fullscreen Barcode Modal */}
      <BarcodeModal
        isOpen={barcodeModalState.isOpen}
        onClose={() => setBarcodeModalState((prev) => ({ ...prev, isOpen: false }))}
        codeValue={barcodeModalState.code}
        title={barcodeModalState.title}
        barcodeType={barcodeModalState.type}
      />
    </PixelPhoneFrame>
  );
}
