import { AttendanceRecord, AttendanceStatus } from './types';
import { cleanRun } from './run';

/**
 * Estadísticas de asistencia para la pantalla de seguimiento.
 *
 * Definiciones:
 *  - Un "día" es una fecha con al menos un registro de asistencia confirmado en la zona.
 *    Si hay varios registros el mismo día, el último estado de cada niño prevalece.
 *  - % del día = presentes / niños evaluados ese día.
 *  - % de la zona (acumulado) = presentes de todos los días / evaluados de todos los días.
 *  - Total niños = niños inscritos en la zona para la versión.
 */

/** Umbrales para colorear el % de asistencia (ajustables). */
export const ATTENDANCE_GOOD = 80;
export const ATTENDANCE_WARN = 60;

export interface DayStat {
  dayKey: string; // AAAA-MM-DD
  dateIso: string;
  present: number;
  total: number;
  pct: number | null;
}

export interface ZoneStat {
  zoneId: string;
  /** Niños inscritos en la zona (versión activa). */
  students: number;
  /** RUN normalizados de los niños inscritos (para contar únicos entre zonas). */
  runs: string[];
  days: DayStat[];
  present: number;
  total: number;
  pct: number | null;
}

export interface Totals {
  /** Suma de inscritos por zona (un niño en 2 zonas cuenta 2). */
  students: number;
  /** Niños distintos según RUN. */
  uniqueStudents: number;
  sessions: number;
  present: number;
  total: number;
  pct: number | null;
  lastDayPct: number | null;
}

export type PctTone = 'good' | 'warn' | 'bad' | 'none';

export function dayKeyOf(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function pctOf(present: number, total: number): number | null {
  return total > 0 ? Math.round((present / total) * 100) : null;
}

export function pctTone(pct: number | null): PctTone {
  if (pct == null) return 'none';
  if (pct >= ATTENDANCE_GOOD) return 'good';
  if (pct >= ATTENDANCE_WARN) return 'warn';
  return 'bad';
}

/** Agrupa los registros por día y calcula presentes / evaluados. */
export function buildDayStats(records: AttendanceRecord[]): DayStat[] {
  const byDay = new Map<string, { dateIso: string; statuses: Map<string, AttendanceStatus> }>();

  [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((r) => {
      const key = dayKeyOf(r.date);
      const current = byDay.get(key) ?? { dateIso: r.date, statuses: new Map() };
      r.entries.forEach((e) => current.statuses.set(e.studentId, e.status));
      byDay.set(key, current);
    });

  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => {
      let present = 0;
      value.statuses.forEach((s) => {
        if (s === 'presente') present += 1;
      });
      const total = value.statuses.size;
      return { dayKey: key, dateIso: value.dateIso, present, total, pct: pctOf(present, total) };
    });
}

export function buildZoneStat(zoneId: string, students: number, records: AttendanceRecord[], runs: string[] = []): ZoneStat {
  const days = buildDayStats(records);
  const present = days.reduce((acc, d) => acc + d.present, 0);
  const total = days.reduce((acc, d) => acc + d.total, 0);
  return { zoneId, students, runs: runs.map(cleanRun), days, present, total, pct: pctOf(present, total) };
}

/** Suma los días de varias zonas (misma fecha = una sola barra). */
export function aggregateDays(zones: ZoneStat[]): DayStat[] {
  const merged = new Map<string, DayStat>();
  zones.forEach((z) =>
    z.days.forEach((d) => {
      const current = merged.get(d.dayKey);
      if (current) {
        current.present += d.present;
        current.total += d.total;
        current.pct = pctOf(current.present, current.total);
      } else {
        merged.set(d.dayKey, { ...d });
      }
    })
  );
  return [...merged.values()].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

export function computeTotals(zones: ZoneStat[]): Totals {
  const days = aggregateDays(zones);
  const present = zones.reduce((acc, z) => acc + z.present, 0);
  const total = zones.reduce((acc, z) => acc + z.total, 0);
  return {
    students: zones.reduce((acc, z) => acc + z.students, 0),
    uniqueStudents: new Set(zones.flatMap((z) => z.runs)).size,
    sessions: days.length,
    present,
    total,
    pct: pctOf(present, total),
    lastDayPct: days.length > 0 ? days[days.length - 1].pct : null,
  };
}
