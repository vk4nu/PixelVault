/**
 * Document Expiry & Startup Background Check Utility
 * Compares document expiry dates with the current date to detect
 * documents that are expired or expiring soon (within 30 days).
 */

import { VaultDocument } from '../types';

export interface DocumentExpiryStatus {
  hasExpiry: boolean;
  expiryDate: Date | null;
  expiryDateFormatted: string;
  daysRemaining: number | null;
  isExpiringSoon: boolean; // True if within 30 days: 0 <= daysRemaining <= 30
  isExpired: boolean;      // True if daysRemaining < 0
  statusText: string;
  badgeText: string;
}

export interface StartupExpiryCheckReport {
  checkedAt: number;
  totalChecked: number;
  expiringSoonCount: number;
  expiredCount: number;
  expiringSoonDocs: Array<{
    document: VaultDocument;
    status: DocumentExpiryStatus;
  }>;
  expiredDocs: Array<{
    document: VaultDocument;
    status: DocumentExpiryStatus;
  }>;
}

const STORAGE_KEY_LAST_CHECK = 'pixel_vault_last_expiry_check';

/**
 * Parses various document date formats safely into a Date object:
 * - YYYY-MM-DD (e.g. 2026-10-05)
 * - MM/YYYY (e.g. Australian Medicare 10/2026 -> valid until last second of that month)
 * - DD/MM/YYYY (e.g. 05/10/2026)
 */
export function parseExpiryDate(rawDate?: string): Date | null {
  if (!rawDate || typeof rawDate !== 'string') return null;
  const trimmed = rawDate.trim();
  if (!trimmed) return null;

  // Pattern 1: MM/YYYY (Standard Australian Medicare Card)
  // e.g. "10/2026" -> expires on October 31, 2026 at 23:59:59
  if (/^\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [monthStr, yearStr] = trimmed.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    if (month >= 1 && month <= 12 && year > 1900 && year < 2200) {
      // Month in Date constructor is 0-indexed; passing next month and day 0 gives last day of current month
      return new Date(year, month, 0, 23, 59, 59, 999);
    }
  }

  // Pattern 2: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yearStr, monthStr, dayStr] = trimmed.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    return new Date(year, month, day, 23, 59, 59, 999);
  }

  // Pattern 3: DD/MM/YYYY (Australian display format)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [dayStr, monthStr, yearStr] = trimmed.split('/');
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const year = parseInt(yearStr, 10);
    return new Date(year, month, day, 23, 59, 59, 999);
  }

  // Fallback native parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

/**
 * Formats a Date object to Australian DD/MM/YYYY display format
 */
export function formatAusDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculates calendar days remaining between reference date (default: today) and target expiry date
 */
export function calculateDaysRemaining(expiryDate: Date, referenceDate: Date = new Date()): number {
  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  const expMidnight = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate()
  ).getTime();

  const diffMs = expMidnight - refMidnight;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Extracts and calculates the expiry status for any VaultDocument
 */
export function getDocumentExpiryStatus(
  doc: VaultDocument,
  referenceDate: Date = new Date()
): DocumentExpiryStatus {
  let rawDate: string | undefined = undefined;

  if (doc.type === 'drivers_license' && doc.driversLicense?.expiryDate) {
    rawDate = doc.driversLicense.expiryDate;
  } else if ((doc.type === 'medicare' || doc.medicare) && doc.medicare?.validTo) {
    rawDate = doc.medicare.validTo;
  } else if (doc.type === 'insurance' && doc.insurance?.expiryDate) {
    rawDate = doc.insurance.expiryDate;
  } else if (doc.type === 'passport' && doc.passport?.expiryDate) {
    rawDate = doc.passport.expiryDate;
  }

  if (!rawDate) {
    return {
      hasExpiry: false,
      expiryDate: null,
      expiryDateFormatted: '',
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
      statusText: 'No expiry date',
      badgeText: '',
    };
  }

  const expiryDate = parseExpiryDate(rawDate);
  if (!expiryDate) {
    return {
      hasExpiry: false,
      expiryDate: null,
      expiryDateFormatted: rawDate,
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
      statusText: 'Invalid date format',
      badgeText: '',
    };
  }

  const daysRemaining = calculateDaysRemaining(expiryDate, referenceDate);
  const isExpired = daysRemaining < 0;
  // Expiring soon if within 30 days (0 to 30 days inclusive)
  const isExpiringSoon = !isExpired && daysRemaining <= 30;

  let statusText = '';
  let badgeText = '';

  if (isExpired) {
    const overdue = Math.abs(daysRemaining);
    statusText = overdue === 1 ? 'Expired yesterday' : `Expired ${overdue} days ago`;
    badgeText = 'Expired';
  } else if (isExpiringSoon) {
    if (daysRemaining === 0) {
      statusText = 'Expires today';
      badgeText = 'Expiring Soon (Today)';
    } else if (daysRemaining === 1) {
      statusText = 'Expires tomorrow';
      badgeText = 'Expiring Soon (1 day)';
    } else {
      statusText = `Expires in ${daysRemaining} days`;
      badgeText = `Expiring Soon (${daysRemaining}d)`;
    }
  } else {
    statusText = `Valid (${daysRemaining} days left)`;
    badgeText = 'Valid';
  }

  return {
    hasExpiry: true,
    expiryDate,
    expiryDateFormatted: formatAusDate(expiryDate),
    daysRemaining,
    isExpiringSoon,
    isExpired,
    statusText,
    badgeText: isExpiringSoon ? 'Expiring Soon' : isExpired ? 'Expired' : '',
  };
}

/**
 * Runs a background check on application startup that compares document
 * expiry dates with the current date.
 */
export function runStartupExpiryCheck(
  documents: VaultDocument[],
  referenceDate: Date = new Date()
): StartupExpiryCheckReport {
  const expiringSoonDocs: Array<{ document: VaultDocument; status: DocumentExpiryStatus }> = [];
  const expiredDocs: Array<{ document: VaultDocument; status: DocumentExpiryStatus }> = [];

  for (const doc of documents) {
    const status = getDocumentExpiryStatus(doc, referenceDate);
    if (status.hasExpiry) {
      if (status.isExpiringSoon) {
        expiringSoonDocs.push({ document: doc, status });
      } else if (status.isExpired) {
        expiredDocs.push({ document: doc, status });
      }
    }
  }

  const report: StartupExpiryCheckReport = {
    checkedAt: Date.now(),
    totalChecked: documents.length,
    expiringSoonCount: expiringSoonDocs.length,
    expiredCount: expiredDocs.length,
    expiringSoonDocs,
    expiredDocs,
  };

  try {
    localStorage.setItem(
      STORAGE_KEY_LAST_CHECK,
      JSON.stringify({
        checkedAt: report.checkedAt,
        expiringSoonCount: report.expiringSoonCount,
        expiredCount: report.expiredCount,
      })
    );
  } catch {
    // ignore
  }

  return report;
}
