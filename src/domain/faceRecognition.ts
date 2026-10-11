import { AttendanceStatus } from './types';

export interface RecognitionResult {
  /** Rostros detectados en la foto (incluye los sin identificar). */
  detectedCount: number;
  /** Propuesta de asistencia por alumno inscrito. */
  entries: { studentId: string; status: AttendanceStatus }[];
  /** Rostros detectados que no se pudieron asociar a un alumno. */
  unassigned: number;
}

/**
 * SIMULACIÓN de reconocimiento facial.
 * En producción, reemplazar por la llamada a un servicio real que reciba la
 * foto y devuelva los alumnos reconocidos. Aquí marcamos aleatoriamente a la
 * mayoría como presentes y dejamos 1 rostro "sin identificar", tal como el
 * diseño de la pantalla 4.
 *
 * @param enrolledIds ids de alumnos inscritos (con foto de referencia).
 */
export function simulateRecognition(enrolledIds: string[]): RecognitionResult {
  const total = enrolledIds.length;
  // Presentes: alrededor del 85% de los inscritos (mínimo 1 ausente si hay > 3).
  const absentTarget = total > 3 ? Math.max(1, Math.round(total * 0.14)) : 0;

  // Elegimos al azar qué alumnos quedan ausentes.
  const shuffled = [...enrolledIds].sort(() => Math.random() - 0.5);
  const absentSet = new Set(shuffled.slice(0, absentTarget));

  const entries = enrolledIds.map((id) => ({
    studentId: id,
    status: (absentSet.has(id) ? 'ausente' : 'presente') as AttendanceStatus,
  }));

  const present = entries.filter((e) => e.status === 'presente').length;
  // 1 rostro sin identificar cuando hay al menos un presente (como el mock).
  const unassigned = present > 0 ? 1 : 0;
  const detectedCount = present + unassigned;

  return { detectedCount, entries, unassigned };
}
