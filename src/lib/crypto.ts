/**
 * AES-256-GCM encryption for API key storage.
 * Per-organization keys are derived from ENCRYPTION_MASTER_SECRET.
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const MASTER_SECRET_PATTERN = /^[a-fA-F0-9]{64}$/;

function getMasterSecret(): Buffer {
  const value = process.env.ENCRYPTION_MASTER_SECRET;

  if (!value) {
    throw new Error('ENCRYPTION_MASTER_SECRET is required');
  }

  if (!MASTER_SECRET_PATTERN.test(value)) {
    throw new Error('ENCRYPTION_MASTER_SECRET must be exactly 64 hexadecimal characters');
  }

  return Buffer.from(value, 'hex');
}

function deriveOrgKey(orgId: string): Buffer {
  if (!orgId.trim()) {
    throw new Error('Organization ID is required for key derivation');
  }

  return createHmac('sha256', getMasterSecret())
    .update(`meridian-org-key:${orgId}`)
    .digest();
}

export function encryptKey(plaintext: string, orgId: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt an empty credential');
  }

  const key = deriveOrgKey(orgId);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: iv(12):tag(16):ciphertext, all hexadecimal.
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptKey(ciphertext: string, orgId: string): string {
  const key = deriveOrgKey(orgId);
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }

  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');

  if (iv.length !== 12 || tag.length !== 16 || data.length === 0) {
    throw new Error('Invalid encrypted credential payload');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
