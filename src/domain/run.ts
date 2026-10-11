/**
 * Utilidades para el RUN chileno: formateo y validación del dígito
 * verificador por módulo 11 (sección 4 del markdown).
 */

/** Deja solo el cuerpo numérico y el dígito verificador (0-9 o K). */
export function cleanRun(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9K]/g, '')
    .slice(0, 9); // 8 dígitos de cuerpo + 1 verificador como máximo razonable
}

/**
 * Calcula el dígito verificador de un cuerpo numérico (string de dígitos).
 * Multiplica de derecha a izquierda por la serie 2..7 repetida, suma,
 * y calcula 11 menos (suma mod 11). 11 => '0', 10 => 'K'.
 */
export function computeDv(body: string): string {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += parseInt(body[i], 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

/** Separa un RUN limpio en cuerpo y dígito verificador. */
export function splitRun(clean: string): { body: string; dv: string } | null {
  if (clean.length < 2) return null;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return null;
  return { body, dv };
}

/** Valida el dígito verificador del RUN. */
export function isValidRun(input: string): boolean {
  const clean = cleanRun(input);
  const parts = splitRun(clean);
  if (!parts) return false;
  if (parts.body.length < 7) return false; // RUN chileno típico: 7-8 dígitos de cuerpo
  return computeDv(parts.body) === parts.dv;
}

/** Formatea con puntos y guion mientras se escribe: 12.345.678-5 */
export function formatRun(input: string): string {
  const clean = cleanRun(input);
  const parts = splitRun(clean);
  if (!parts) {
    // Aún no hay suficiente para separar DV: solo agrupa en miles si son dígitos.
    if (/^\d+$/.test(clean)) {
      return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return clean;
  }
  const bodyWithDots = parts.body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${bodyWithDots}-${parts.dv}`;
}
