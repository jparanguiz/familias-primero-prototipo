import { ProgramVersion, ZoneAssignment } from './types';

/**
 * Conservación de la foto grupal: hasta UN MES después de la fecha de fin de la
 * zona en esa versión.
 */
export const RETENTION_MONTHS_AFTER_PROGRAM = 1;

/** Días hábiles sugeridos de duración por zona (editable). */
export const SUGGESTED_BUSINESS_DAYS = 10;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Suma N días hábiles (lun-vie) a una fecha. */
export function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return d;
}

/** Fecha de fin sugerida a partir de un inicio (inicio + 10 días hábiles). */
export function suggestedEndDate(startIso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(startIso)) return '';
  return addBusinessDays(new Date(startIso), SUGGESTED_BUSINESS_DAYS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Fecha límite de conservación de una foto tomada en `takenAt`.
 * Es el fin de la zona-versión + el plazo de retención; nunca anterior a la toma.
 */
export function photoRetentionDeadline(
  takenAtIso: string,
  assignment?: ZoneAssignment
): string {
  const base = assignment
    ? addMonths(new Date(assignment.endDate), RETENTION_MONTHS_AFTER_PROGRAM)
    : addMonths(new Date(takenAtIso), 2);
  const takenAt = new Date(takenAtIso);
  const deadline = base.getTime() >= takenAt.getTime() ? base : takenAt;
  return deadline.toISOString();
}

export function isPhotoRetained(retainedUntilIso: string, now: Date = new Date()): boolean {
  return new Date(retainedUntilIso).getTime() >= now.getTime();
}

export function daysUntilPhotoExpiry(retainedUntilIso: string, now: Date = new Date()): number {
  const ms = new Date(retainedUntilIso).getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Etiqueta legible de una versión: "Verano 2027". */
export function versionLabel(v: ProgramVersion): string {
  return `${v.season} ${v.year}`;
}

/**
 * Versiones en las que se puede inscribir: en curso o por venir (no las pasadas).
 * Las fechas de una versión salen de las zonas que participan (mín. inicio, máx. término).
 * Una versión sin fechas aún se considera "por venir".
 * Orden: primero la que está en curso, luego la más próxima. La primera es la versión por defecto.
 */
export function enrollableVersions(
  versions: ProgramVersion[],
  assignments: ZoneAssignment[],
  now: Date = new Date()
): ProgramVersion[] {
  const today = now.toISOString().slice(0, 10);
  const info = versions.map((v) => {
    const mine = assignments.filter((a) => a.versionId === v.id);
    const start = mine.length ? mine.map((a) => a.startDate).sort()[0] : null;
    const end = mine.length ? mine.map((a) => a.endDate).sort().slice(-1)[0] : null;
    return { v, start, end };
  });
  return info
    .filter((i) => !i.end || i.end.slice(0, 10) >= today)
    .map((i) => ({ ...i, inProgress: Boolean(i.start && i.start.slice(0, 10) <= today) }))
    .sort((a, b) => {
      if (a.inProgress !== b.inProgress) return a.inProgress ? -1 : 1;
      const ka = a.start ?? `${a.v.year}-${a.v.season === 'Verano' ? '01' : '07'}`;
      const kb = b.start ?? `${b.v.year}-${b.v.season === 'Verano' ? '01' : '07'}`;
      return ka.localeCompare(kb);
    })
    .map((i) => i.v);
}
