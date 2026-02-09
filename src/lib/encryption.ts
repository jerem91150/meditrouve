import CryptoJS from "crypto-js";
import { getEncryptionKey } from "./jwt-secret";

// Get encryption key from environment - no fallback allowed
const ENCRYPTION_KEY = getEncryptionKey();

// AES-256 encryption for sensitive data at rest
export function encryptData(data: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

export function decryptData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error("Decryption resulted in empty string");
    }
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

// Hash sensitive data for storage (one-way, for comparison)
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

// Encrypt object to JSON string
export function encryptObject(obj: object): string {
  return encryptData(JSON.stringify(obj));
}

// Decrypt JSON string to object
export function decryptObject<T>(encryptedData: string): T {
  const decrypted = decryptData(encryptedData);
  return JSON.parse(decrypted) as T;
}

// Mask sensitive data for logging/display
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const maskedLocal = local.substring(0, 2) + "***";
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return "****";
  return phone.substring(0, 2) + "****" + phone.substring(phone.length - 2);
}

export function maskName(name: string): string {
  if (name.length < 2) return "**";
  return name.charAt(0) + "*".repeat(name.length - 1);
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = CryptoJS.lib.WordArray.random(length);
  const bytes = randomValues.toString();

  let token = "";
  for (let i = 0; i < length; i++) {
    const index = parseInt(bytes.substring(i * 2, i * 2 + 2), 16) % chars.length;
    token += chars.charAt(index);
  }
  return token;
}

// Encrypt prescription/medical data (extra protection for health data)
export function encryptHealthData(data: object): { encrypted: string; iv: string } {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY.substring(0, 32).padEnd(32, "0")),
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return {
    encrypted: encrypted.toString(),
    iv: iv.toString(),
  };
}

export function decryptHealthData<T>(encrypted: string, iv: string): T {
  const decrypted = CryptoJS.AES.decrypt(
    encrypted,
    CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY.substring(0, 32).padEnd(32, "0")),
    {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8)) as T;
}
