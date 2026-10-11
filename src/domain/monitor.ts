import {
  AttendanceRecord,
  Student,
} from './types';
import { formatDate } from './format';

export type DayCellStatus = 'presente' | 'ausente' | 'no-enrolado' | 'sin-registro';

export interface MonitorDay {
  dateIso: string;
  label: string;
}

export interface MonitorRow {
  student: Student;
  cells: Record<string, DayCellStatus>; // dateIso -> estado
  presentCount: number;
  totalSessions: number; // sesiones (días con registro) desde que se enroló
}

export interface MonitorMatrix {
  days: MonitorDay[];
  rows: MonitorRow[];
}

/** Normaliza una fecha ISO a su día (YYYY-MM-DD) para agrupar sesiones. */
function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/**
 * Construye la matriz de asistencia acumulada para un conjunto de alumnos y
 * los registros de asistencia (de una versión/zona). Considera enrolamiento
 * tardío: un alumno aparece "no-enrolado" en los días anteriores a su
 * inscripción.
 */
export function buildMonitorMatrix(
  students: Student[],
  records: AttendanceRecord[]
): MonitorMatrix {
  // Días únicos con registro, ordenados.
  const dayMap = new Map<string, string>(); // dayKey -> primer iso visto
  records.forEach((r) => {
    const k = dayKey(r.date);
    if (!dayMap.has(k)) dayMap.set(k, r.date);
  });
  const days: MonitorDay[] = [...dayMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, iso]) => ({ dateIso: iso, label: formatDate(iso) }));

  // Índice rápido: dayKey -> (studentId -> status registrado)
  const byDay = new Map<string, Map<string, 'presente' | 'ausente'>>();
  records.forEach((r) => {
    const k = dayKey(r.date);
    const m = byDay.get(k) ?? new Map();
    r.entries.forEach((e) => m.set(e.studentId, e.status));
    byDay.set(k, m);
  });

  const rows: MonitorRow[] = students.map((student) => {
    const cells: Record<string, DayCellStatus> = {};
    let present = 0;
    let sessions = 0;
    const enrolledKey = dayKey(student.enrolledAt);

    days.forEach((d) => {
      const k = dayKey(d.dateIso);
      if (k < enrolledKey) {
        cells[d.dateIso] = 'no-enrolado';
        return;
      }
      const status = byDay.get(k)?.get(student.id);
      if (status === 'presente') {
        cells[d.dateIso] = 'presente';
        present += 1;
        sessions += 1;
      } else if (status === 'ausente') {
        cells[d.dateIso] = 'ausente';
        sessions += 1;
      } else {
        // Hubo sesión ese día pero este alumno no figura (sin registro individual).
        cells[d.dateIso] = 'sin-registro';
        sessions += 1;
      }
    });

    return { student, cells, presentCount: present, totalSessions: sessions };
  });

  return { days, rows };
}
