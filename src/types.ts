/**
 * Pixel Vault Type Definitions
 */

export type DocumentType = 'drivers_license' | 'insurance' | 'medicare' | 'passport';

export type AustralianState =
  | 'New South Wales'
  | 'Victoria'
  | 'Queensland'
  | 'Western Australia'
  | 'South Australia'
  | 'Tasmania'
  | 'Australian Capital Territory'
  | 'Northern Territory';

export interface DriversLicenseData {
  country?: 'Australia' | 'United States' | string;
  state: string; // e.g. "New South Wales", "Victoria", "Queensland"
  stateCode?: 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT' | string;
  licenseNumber: string;
  cardNumber?: string; // Modern Australian Card Number (for DVS identity verification on back/front)
  fullName: string;
  dob: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  issueDate: string; // YYYY-MM-DD
  address: string;
  licenseClass: string; // "C", "R", "LR", "MR", "HR", "HC", "MC"
  licenceType?: 'Full / Unrestricted' | 'Provisional P1' | 'Provisional P2' | 'Learner';
  endorsements?: string;
  conditions?: string; // e.g. "None", "S - Corrective Lenses", "A - Automatic Vehicle"
  organDonor: boolean; // "Donor: A"
  isRealId?: boolean;
  sex?: 'M' | 'F' | 'X';
  height?: string;
  eyes?: string;
  photoUrl?: string; // Front of card or portrait photo
  backPhotoUrl?: string; // Back of Australian driver licence (explicitly required)
  barcodeData?: string;
}

export interface MedicareCardData {
  cardNumber: string; // 10 digits formatted as "2954 81920 1"
  irn: string; // Individual Reference Number (1 to 9)
  cardColor: 'green' | 'blue' | 'yellow'; // Green = Standard/Citizen, Blue = Interim, Yellow = Reciprocal
  cardholderName: string; // Primary cardholder name
  beneficiaries?: Array<{ irn: string; name: string }>; // Dependants / family on card
  validTo: string; // MM/YYYY e.g. "11/2028"
  frontPhotoUrl?: string; // Front of physical Medicare card (explicitly required)
  medicareType?: string; // "Australian Resident", "Interim Recipient", "Reciprocal"
}

export interface InsuranceCopays {
  primaryCare?: string; // e.g. "$20"
  specialist?: string; // e.g. "$40"
  urgentCare?: string; // e.g. "$50"
  emergencyRoom?: string; // e.g. "$250"
}

export interface InsuranceCardData {
  providerName: string; // e.g. "Medibank", "Bupa", "Anthem Blue Cross"
  planName: string; // e.g. "Gold Comprehensive Hospital & Extras"
  memberName: string;
  memberId: string;
  groupNumber?: string;
  expiryDate?: string; // Optional expiry date for private health insurance
  rxBin?: string;
  rxPcn?: string;
  rxGroup?: string;
  copays?: InsuranceCopays;
  deductible?: string;
  customerServicePhone?: string;
  nurseLinePhone?: string;
  claimsAddress?: string;
  frontPhotoUrl?: string;
  backPhotoUrl?: string;
}

export interface PassportData {
  issuingCountry: string; // e.g. "Australia", "United States of America"
  countryCode: string; // e.g. "AUS", "USA"
  passportNumber: string;
  fullName: string;
  nationality: string;
  dob: string; // YYYY-MM-DD
  sex: 'M' | 'F' | 'X';
  placeOfBirth: string;
  issueDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  authority: string; // e.g. "Australian Passport Office / DFAT"
  mrzLine1?: string;
  mrzLine2?: string;
  photoUrl?: string;
}

export interface VaultDocument {
  id: string;
  type: DocumentType;
  title: string;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  notes?: string;
  driversLicense?: DriversLicenseData;
  medicare?: MedicareCardData;
  insurance?: InsuranceCardData;
  passport?: PassportData;
}

export interface VaultSecurityConfig {
  isSetupComplete: boolean;
  pinHash: string; // SHA-256 hash of PIN + salt
  salt: string;
  biometricEnabled: boolean;
  biometricCredentialId?: string;
  biometricUserName?: string;
  biometricSessionKey?: string; // Encrypted master key unlocked by biometric confirmation
  autoLockSeconds: number; // 60, 120, 300, 0 (immediate)
  hideSensitiveInPreview: boolean;
  failedAttempts: number;
  lockedUntil?: number; // timestamp if locked out
}

export interface EncryptedVaultPayload {
  version: number;
  salt: string;
  iv: string;
  ciphertext: string;
  timestamp: number;
}
