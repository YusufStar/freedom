import * as argon2 from 'argon2';
import { config } from '../config/config';

// For AES-256 encryption/decryption of mail passwords
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Generate a crypto key from the encryption key
async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = encoder.encode(config.encryption.key.padEnd(32, '0').slice(0, 32));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Password hashing for user authentication
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

// Verify password against hash
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

// Encrypt mail account passwords
export async function encryptPassword(password: string): Promise<string> {
  try {
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const passwordData = encoder.encode(password);
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      passwordData
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Return base64 encoded
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    throw new Error('Failed to encrypt password');
  }
}

// Decrypt mail account passwords
export async function decryptPassword(encryptedPassword: string): Promise<string> {
  try {
    const key = await getCryptoKey();
    const combined = Uint8Array.from(atob(encryptedPassword), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );
    
    return decoder.decode(decryptedData);
  } catch (error) {
    throw new Error('Failed to decrypt password');
  }
}

// Generate secure random IDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Hash tokens for secure storage
export async function hashToken(token: string): Promise<string> {
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
} 