/**
 * Client-Side Zero-Knowledge Encryption Utilities using Web Crypto API
 * Uses PBKDF2 (SHA-256, 100,000 iterations) and AES-256-GCM.
 */

// Convert ArrayBuffer / Uint8Array to base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate cryptographically secure random bytes
export function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return array;
}

// Generate random salt as base64 string
export function generateSalt(): string {
  return bufferToBase64(generateRandomBytes(16));
}

// Compute SHA-256 hash of (value + salt)
export async function hashWithSalt(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value + ':' + salt);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

// Derive AES-GCM 256-bit encryption key from a passcode and salt
export async function deriveKey(passcode: string, saltBase64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = base64ToBuffer(saltBase64);

  // Import raw passcode as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM 256-bit key using PBKDF2
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext string with AES-GCM
export async function encryptText(
  plainText: string,
  passcode: string,
  saltBase64: string
): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKey(passcode, saltBase64);
  const iv = generateRandomBytes(12); // 96-bit standard IV for AES-GCM
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plainText);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as ArrayBuffer,
    },
    key,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

// Decrypt ciphertext string with AES-GCM
export async function decryptText(
  ciphertextBase64: string,
  ivBase64: string,
  passcode: string,
  saltBase64: string
): Promise<string> {
  const key = await deriveKey(passcode, saltBase64);
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as ArrayBuffer,
    },
    key,
    ciphertext as unknown as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
