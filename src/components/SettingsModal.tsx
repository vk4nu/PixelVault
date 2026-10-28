import React, { useState, useRef } from 'react';
import { VaultSecurityConfig, VaultDocument } from '../types';
import {
  X,
  Fingerprint,
  KeyRound,
  Clock,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Check,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import { registerBiometrics } from '../utils/webauthn';
import { exportVaultBackup, wipeVaultData } from '../utils/storage';
import { encryptText, generateSalt, hashWithSalt } from '../utils/crypto';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityConfig: VaultSecurityConfig;
  onUpdateSecurity: (newConfig: VaultSecurityConfig) => void;
  documents: VaultDocument[];
  currentPin: string;
  onRestoreDocuments: (docs: VaultDocument[]) => void;
  onWipeVault: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  securityConfig,
  onUpdateSecurity,
  documents,
  currentPin,
  onRestoreDocuments,
  onWipeVault,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'backup' | 'device'>('security');
  const [autoLock, setAutoLock] = useState(securityConfig.autoLockSeconds);
  const [hideSensitive, setHideSensitive] = useState(securityConfig.hideSensitiveInPreview);
  const [bioEnabled, setBioEnabled] = useState(securityConfig.biometricEnabled);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [bioStatusMsg, setBioStatusMsg] = useState<string | null>(null);

  // Change PIN state
  const [showPinChange, setShowPinChange] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleToggleBiometrics = async () => {
    if (!bioEnabled) {
      setIsEnrolling(true);
      setBioStatusMsg(null);
      try {
        const res = await registerBiometrics('Pixel Owner');
        if (res.success) {
          setBioEnabled(true);
          onUpdateSecurity({
            ...securityConfig,
            biometricEnabled: true,
            biometricCredentialId: res.credentialId,
          });
          setBioStatusMsg('Pixel Biometrics successfully enrolled!');
        }
      } catch {
        setBioStatusMsg('Failed to register biometric device.');
      } finally {
        setIsEnrolling(false);
      }
    } else {
      setBioEnabled(false);
      onUpdateSecurity({
        ...securityConfig,
        biometricEnabled: false,
      });
      setBioStatusMsg('Biometric authentication disabled.');
    }
  };

  const handleAutoLockChange = (seconds: number) => {
    setAutoLock(seconds);
    onUpdateSecurity({
      ...securityConfig,
      autoLockSeconds: seconds,
    });
  };

  const handleToggleHideSensitive = (val: boolean) => {
    setHideSensitive(val);
    onUpdateSecurity({
      ...securityConfig,
      hideSensitiveInPreview: val,
    });
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    const oldHash = await hashWithSalt(oldPin, securityConfig.salt);
    if (oldHash !== securityConfig.pinHash) {
      setPinChangeMsg('Current PIN is incorrect.');
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      setPinChangeMsg('New PIN must be 4 to 6 digits.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinChangeMsg('New PIN confirmation does not match.');
      return;
    }

    const newSalt = generateSalt();
    const newHash = await hashWithSalt(newPin, newSalt);

    onUpdateSecurity({
      ...securityConfig,
      pinHash: newHash,
      salt: newSalt,
    });

    setPinChangeMsg('PIN changed successfully!');
    setOldPin('');
    setNewPin('');
    setConfirmNewPin('');
    setTimeout(() => setShowPinChange(false), 1500);
  };

  const handleExportBackup = async () => {
    const raw = JSON.stringify(documents);
    const { ciphertext, iv } = await encryptText(raw, currentPin, securityConfig.salt);
    const backupPayload = JSON.stringify({
      version: 1,
      salt: securityConfig.salt,
      iv,
      ciphertext,
      timestamp: Date.now(),
      app: 'Pixel Vault',
    }, null, 2);

    exportVaultBackup(backupPayload);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const payload = JSON.parse(text);
        if (payload.ciphertext && payload.iv) {
          // Attempt decrypt using current PIN or prompt
          const { decryptText } = await import('../utils/crypto');
          const json = await decryptText(payload.ciphertext, payload.iv, currentPin, payload.salt || securityConfig.salt);
          const restoredDocs: VaultDocument[] = JSON.parse(json);
          onRestoreDocuments(restoredDocs);
          alert(`Successfully restored ${restoredDocs.length} documents into your Pixel Vault!`);
          onClose();
        }
      } catch {
        alert('Failed to restore backup. Incorrect PIN or invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-[#171B22] border border-[#2F3642] shadow-2xl text-white overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#29303C] bg-[#12151B]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Vault Settings & Security</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#20252F] hover:bg-[#2C3442] flex items-center justify-center text-gray-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-[#29303C] bg-[#14171E] text-xs font-medium">
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'security'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Biometrics</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'backup'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>
          <button
            onClick={() => setActiveTab('device')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'device'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pixel Info</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Biometrics Toggle */}
              <div className="bg-[#12161D] p-4 rounded-2xl border border-[#252C38] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Biometric Unlock</h4>
                    <p className="text-xs text-gray-400">
                      Pixel Fingerprint & Face Unlock
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleBiometrics}
                  disabled={isEnrolling}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    bioEnabled ? 'bg-blue-600 justify-end' : 'bg-gray-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform" />
                </button>
              </div>

              {bioStatusMsg && (
                <p className="text-xs text-blue-400 bg-blue-950/40 p-2.5 rounded-xl border border-blue-800/40">
                  {bioStatusMsg}
                </p>
              )}

              {/* Auto-Lock Duration */}
              <div className="bg-[#12161D] p-4 rounded-2xl border border-[#252C38] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Auto-Lock Inactivity Timer</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { label: '30s', val: 30 },
                    { label: '1 min', val: 60 },
                    { label: '2 min', val: 120 },
                    { label: '5 min', val: 300 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => handleAutoLockChange(item.val)}
                      className={`py-1.5 rounded-xl text-xs font-medium border transition ${
                        autoLock === item.val
                          ? 'bg-blue-600/20 border-blue-400 text-blue-300'
                          : 'bg-[#1C212A] border-[#2E3644] text-gray-400 hover:bg-[#252C38]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Masking by default */}
              <div className="bg-[#12161D] p-4 rounded-2xl border border-[#252C38] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Privacy Shielding</h4>
                    <p className="text-xs text-gray-400">
                      Mask card numbers in card preview
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleHideSensitive(!hideSensitive)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    hideSensitive ? 'bg-amber-500 justify-end' : 'bg-gray-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Change Master PIN section */}
              <div className="bg-[#12161D] p-4 rounded-2xl border border-[#252C38]">
                {!showPinChange ? (
                  <button
                    onClick={() => setShowPinChange(true)}
                    className="w-full flex items-center justify-between text-xs font-medium text-gray-300 hover:text-white transition"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-blue-400" />
                      <span>Change Master PIN</span>
                    </div>
                    <span className="text-blue-400">Update</span>
                  </button>
                ) : (
                  <form onSubmit={handleChangePinSubmit} className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between border-b border-[#252C38] pb-1.5">
                      <span className="text-xs font-bold text-white">Change Master PIN</span>
                      <button
                        type="button"
                        onClick={() => setShowPinChange(false)}
                        className="text-[11px] text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <input
                      type="password"
                      maxLength={6}
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value)}
                      placeholder="Current PIN"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1C212A] border border-[#303846] text-xs text-white"
                    />
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="New PIN (4-6 digits)"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1C212A] border border-[#303846] text-xs text-white"
                    />
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value)}
                      placeholder="Confirm New PIN"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1C212A] border border-[#303846] text-xs text-white"
                    />

                    {pinChangeMsg && (
                      <p className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded">
                        {pinChangeMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition active:scale-98"
                    >
                      Save New PIN
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-[#12161D] p-4 rounded-2xl border border-[#252C38] space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export Encrypted Backup</span>
                </div>
                <p className="text-xs text-gray-400">
                  Downloads an encrypted <code className="text-emerald-300">.pixelvault</code> file protected with AES-256-GCM. Keep this safe to restore your cards if you switch phones or clear browser data.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Encrypted Backup</span>
                </button>
              </div>

              <div className="bg-[#12161D] p-4 rounded-2xl border border-[#252C38] space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Restore from Backup</span>
                </div>
                <p className="text-xs text-gray-400">
                  Import documents from a previous <code className="text-blue-300">.pixelvault</code> file using your Master PIN.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pixelvault,.json"
                  className="hidden"
                  onChange={handleFileRestore}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl bg-[#222832] hover:bg-[#2E3644] text-xs font-semibold text-gray-200 border border-[#353D4B] transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Select Backup File to Restore</span>
                </button>
              </div>

              {/* Danger Zone: Wipe Vault */}
              <div className="bg-rose-950/20 p-4 rounded-2xl border border-rose-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </div>
                <p className="text-xs text-gray-400">
                  Permanently delete all encrypted credentials and biometric enrollments from this browser.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure? This will wipe all stored driver licenses, insurance cards, and passports.')) {
                      wipeVaultData();
                      onWipeVault();
                      onClose();
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-rose-900/50 hover:bg-rose-800 text-xs font-semibold text-rose-200 transition"
                >
                  Wipe Vault Completely
                </button>
              </div>
            </div>
          )}

          {activeTab === 'device' && (
            <div className="space-y-3 text-xs">
              <div className="bg-[#12161D] p-4 rounded-2xl border border-[#252C38] space-y-2">
                <h4 className="font-semibold text-white">Google Pixel Hardware Security</h4>
                <p className="text-gray-400 leading-relaxed">
                  Pixel Vault utilizes your phone's Titan M2 security coprocessor and Web Authentication standards (FIDO2 / WebAuthn) to verify your biometric identity without ever sending credentials off the device.
                </p>
              </div>

              <div className="bg-[#12161D] p-4 rounded-2xl border border-[#252C38] space-y-2 font-mono text-[11px] text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-500">Encryption:</span>
                  <span className="text-blue-400">AES-256-GCM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Key Derivation:</span>
                  <span className="text-blue-400">PBKDF2 (100k iter)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Storage Architecture:</span>
                  <span className="text-emerald-400">Zero-Knowledge Local</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Target Device:</span>
                  <span className="text-gray-300">Google Pixel Phone</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#29303C] bg-[#12151B] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
