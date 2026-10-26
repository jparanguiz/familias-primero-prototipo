/**
 * Utilidades de autenticación SIMULADAS para el prototipo.
 *
 * ⚠️ IMPORTANTE: esto NO es seguro y es solo para la demo. Las claves se
 * "hashean" con una función trivial y se guardan en el dispositivo
 * (AsyncStorage / localStorage). En la versión con backend, las claves deben
 * guardarse hasheadas en el servidor (bcrypt/argon2) y nunca en el cliente.
 */

/** Hash trivial reversible-resistente a simple vista (NO criptográfico). */
export function hashPassword(password: string): string {
  let h = 2166136261;
  for (let i = 0; i < password.length; i += 1) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Prefijo para distinguir que es un hash de demo.
  return `demo$${(h >>> 0).toString(16)}`;
}

export function verifyPassword(password: string, hash?: string): boolean {
  if (!hash) return false;
  return hashPassword(password) === hash;
}

/** Normaliza un correo para comparar (minúsculas, sin espacios). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Validación simple de formato de correo. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Reglas mínimas de clave para la demo. */
export function passwordIssues(password: string): string | null {
  if (password.length < 6) return 'La clave debe tener al menos 6 caracteres.';
  return null;
}
