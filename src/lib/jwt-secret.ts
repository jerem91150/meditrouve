// Centralized JWT secret validation - no fallbacks allowed

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

export function getJwtSecret(): string {
  return getRequiredEnv("JWT_SECRET");
}

export function getJwtSecretBytes(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

export function getEncryptionKey(): string {
  return process.env.ENCRYPTION_KEY || getRequiredEnv("JWT_SECRET");
}
