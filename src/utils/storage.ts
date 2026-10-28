/**
 * Vault Storage & Backup Utilities with Zero-Knowledge Encryption
 */

import { VaultDocument, VaultSecurityConfig, EncryptedVaultPayload } from '../types';
import { encryptText, decryptText, generateSalt, hashWithSalt } from './crypto';

const STORAGE_KEYS = {
  SECURITY_CONFIG: 'pixel_vault_security_config',
  ENCRYPTED_DATA: 'pixel_vault_encrypted_data',
  BIOMETRIC_VAULT_KEY: 'pixel_vault_bio_vault_key',
  UNENCRYPTED_CACHE: 'pixel_vault_session_cache',
};

// Initial realistic default Australian documents for Pixel Vault
export const DEFAULT_DOCUMENTS: VaultDocument[] = [
  {
    id: 'doc-dl-aus-1',
    type: 'drivers_license',
    title: "Driver's Licence (NSW Australia)",
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 15 * 86400000,
    isFavorite: true,
    driversLicense: {
      country: 'Australia',
      state: 'New South Wales',
      stateCode: 'NSW',
      licenseNumber: '84920192',
      cardNumber: 'PC94821038', // Crucial Australian Card Number for DVS
      fullName: 'ALEX JORDAN MORGAN',
      dob: '1992-08-14',
      expiryDate: '2026-10-05', // Expiring in 20 days (triggers 30-day startup alert & badge)
      issueDate: '2023-08-10',
      address: '42 GEORGE STREET\nSYDNEY NSW 2000',
      licenseClass: 'C',
      licenceType: 'Full / Unrestricted',
      endorsements: 'NONE',
      conditions: 'None',
      organDonor: true,
      sex: 'M',
      height: '180 cm',
      eyes: 'HAZ',
      barcodeData: 'AUS-NSW-DL-84920192-CARD-PC94821038-DVS-OK',
    },
    notes: 'Transport for NSW verified. Card Number PC94821038 on reverse side for Australian Document Verification Service (DVS). Renewal due: expires 05/10/2026.',
  },
  {
    id: 'doc-medicare-1',
    type: 'medicare',
    title: 'Medicare Card (Australia)',
    createdAt: Date.now() - 60 * 86400000,
    updatedAt: Date.now() - 20 * 86400000,
    isFavorite: true,
    medicare: {
      cardNumber: '2954 81920 1',
      irn: '1',
      cardColor: 'green',
      cardholderName: 'MORGAN, ALEX J',
      beneficiaries: [
        { irn: '1', name: 'MORGAN, ALEX J' },
        { irn: '2', name: 'MORGAN, EMILY R' },
      ],
      validTo: '11/2028',
      medicareType: 'Australian Resident',
    },
    notes: 'Services Australia Medicare. Primary cardholder IRN line 1 for doctor bulk-billing, hospital access, and PBS prescriptions.',
  },
  {
    id: 'doc-pass-aus-1',
    type: 'passport',
    title: 'Passport (Australia)',
    createdAt: Date.now() - 100 * 86400000,
    updatedAt: Date.now() - 45 * 86400000,
    isFavorite: true,
    passport: {
      issuingCountry: 'Australia',
      countryCode: 'AUS',
      passportNumber: 'N8492019',
      fullName: 'MORGAN, ALEX JORDAN',
      nationality: 'AUSTRALIAN',
      dob: '1992-08-14',
      sex: 'M',
      placeOfBirth: 'SYDNEY, AUSTRALIA',
      issueDate: '2022-09-15',
      expiryDate: '2032-09-14',
      authority: 'Australian Passport Office / DFAT',
      mrzLine1: 'PAUSMORGAN<<ALEX<JORDAN<<<<<<<<<<<<<<<<<<<<<<<',
      mrzLine2: 'N8492019<2AUS9208144M3209148<<<<<<<<<<<<<<00',
    },
    notes: '10-year R-Series biometric e-Passport issued by the Commonwealth of Australia.',
  },
];

// Biometric session key helpers for zero-friction biometric app unlock
export function saveBiometricVaultKey(pin: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY, btoa(pin));
  } catch {
    // ignore
  }
}

export function getBiometricVaultKey(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY);
    return raw ? atob(raw) : null;
  } catch {
    return null;
  }
}

export function clearBiometricVaultKey(): void {
  localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_VAULT_KEY);
}

// Load security config
export function getSecurityConfig(): VaultSecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load security config', err);
  }

  // Default initial configuration
  const defaultSalt = generateSalt();
  return {
    isSetupComplete: false,
    pinHash: '',
    salt: defaultSalt,
    biometricEnabled: true, // Enable biometric option by default for Pixel
    autoLockSeconds: 120, // 2 minutes auto-lock
    hideSensitiveInPreview: true,
    failedAttempts: 0,
  };
}

// Save security config
export function saveSecurityConfig(config: VaultSecurityConfig): void {
  localStorage.setItem(STORAGE_KEYS.SECURITY_CONFIG, JSON.stringify(config));
  if (!config.biometricEnabled) {
    clearBiometricVaultKey();
  }
}

// Initialize Vault with PIN
export async function setupVaultSecurity(
  pin: string,
  enableBiometrics = false,
  credentialId?: string
): Promise<VaultSecurityConfig> {
  const salt = generateSalt();
  const pinHash = await hashWithSalt(pin, salt);

  const config: VaultSecurityConfig = {
    isSetupComplete: true,
    pinHash,
    salt,
    biometricEnabled: enableBiometrics,
    biometricCredentialId: credentialId,
    autoLockSeconds: 120,
    hideSensitiveInPreview: true,
    failedAttempts: 0,
  };

  saveSecurityConfig(config);

  if (enableBiometrics) {
    saveBiometricVaultKey(pin);
  } else {
    clearBiometricVaultKey();
  }

  // Encrypt the initial default documents using the PIN
  await saveEncryptedDocuments(DEFAULT_DOCUMENTS, pin, salt);

  return config;
}

// Save encrypted documents
export async function saveEncryptedDocuments(
  docs: VaultDocument[],
  pin: string,
  salt: string
): Promise<void> {
  const json = JSON.stringify(docs);
  const { ciphertext, iv } = await encryptText(json, pin, salt);

  const payload: EncryptedVaultPayload = {
    version: 1,
    salt,
    iv,
    ciphertext,
    timestamp: Date.now(),
  };

  localStorage.setItem(STORAGE_KEYS.ENCRYPTED_DATA, JSON.stringify(payload));
}

// Load and decrypt documents
export async function loadDecryptedDocuments(
  pin: string,
  salt: string
): Promise<VaultDocument[]> {
  const raw = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_DATA);
  if (!raw) {
    return DEFAULT_DOCUMENTS;
  }

  try {
    const payload: EncryptedVaultPayload = JSON.parse(raw);
    const json = await decryptText(payload.ciphertext, payload.iv, pin, salt);
    return JSON.parse(json);
  } catch (err) {
    console.error('Failed to decrypt vault documents:', err);
    throw new Error('Decryption failed. Incorrect PIN or corrupted data.');
  }
}

// Export encrypted backup file
export function exportVaultBackup(encryptedJson: string): void {
  const blob = new Blob([encryptedJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `pixel-vault-backup-${dateStr}.pixelvault`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Full vault wipe
export function wipeVaultData(): void {
  localStorage.removeItem(STORAGE_KEYS.SECURITY_CONFIG);
  localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_DATA);
  sessionStorage.clear();
}
