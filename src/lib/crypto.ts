/**
 * AES-256-GCM encryption for API key storage.
 * Per-org key is derived from ENCRYPTION_MASTER_SECRET via HKDF.
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from 'crypto';

const MASTER_SECRET = process.env.ENCRYPTION_MASTER_SECRET ?? '0'.repeat(64);
const ALGORITHM = 'aes-256-gcm';

function deriveOrgKey(orgId: string): Buffer {
  // HKDF-lite: HMAC-SHA256(master, orgId) → 32 bytes
  const key = Buffer.from(MASTER_SECRET, 'hex');
  return Buffer.from(
    createHmac('sha256', key).update(`meridian-org-key:${orgId}`).digest()
  );
}

export function encryptKey(plaintext: string, orgId: string): string {
  const key = deriveOrgKey(orgId);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12):tag(16):ciphertext — all hex
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptKey(ciphertext: string, orgId: string): string {
  const key = deriveOrgKey(orgId);
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
