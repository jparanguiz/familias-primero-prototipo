/**
 * Codificación simple del QR que el tutor del programa comparte para iniciar
 * el onboarding de un niño. Precarga versión y zona, y registra qué tutor lo
 * generó (queda como enrolledByUserId del niño).
 *
 * Formato: FP1|<versionId>|<zoneId>|<userId>
 * En producción esto sería un enlace firmado o un token server-side.
 */

export interface OnboardingQr {
  versionId: string;
  zoneId: string;
  userId?: string;
}

const PREFIX = 'FP1';

export function encodeOnboardingQr(data: OnboardingQr): string {
  return [PREFIX, data.versionId, data.zoneId, data.userId ?? ''].join('|');
}

export function decodeOnboardingQr(raw: string): OnboardingQr | null {
  const parts = raw.split('|');
  if (parts.length < 3 || parts[0] !== PREFIX) return null;
  const [, versionId, zoneId, userId] = parts;
  if (!versionId || !zoneId) return null;
  return { versionId, zoneId, userId: userId || undefined };
}
