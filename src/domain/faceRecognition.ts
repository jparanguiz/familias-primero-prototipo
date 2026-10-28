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
 *
 * El número de rostros detectados en la foto MANDA: exactamente esa cantidad
 * de personas queda presente (rostros reconocidos + los "sin identificar" que
 * se asignan a mano). El resto de los inscritos queda ausente.
 *
 * En producción, reemplazar por un servicio real que reciba la foto y devuelva
 * los rostros detectados y los alumnos reconocidos.
 *
 * @param enrolledIds ids de alumnos inscritos (con foto de referencia).
 * @param detectedCount rostros detectados en la foto. Si no se entrega, se
 *        simula un valor plausible (~85% de los inscritos).
 */
export function simulateRecognition(
  enrolledIds: string[],
  detectedCount?: number
): RecognitionResult {
  const total = enrolledIds.length;

  // Rostros detectados: lo entregado por la cámara, acotado a [0, total].
  const detected =
    detectedCount != null
      ? Math.max(0, Math.min(detectedCount, total))
      : total > 0
        ? Math.max(1, Math.round(total * 0.85))
        : 0;

  // Elegimos al azar qué alumnos quedan presentes (tantos como rostros detectados).
  const shuffled = [...enrolledIds].sort(() => Math.random() - 0.5);
  const presentIds = new Set(shuffled.slice(0, detected));

  const entries = enrolledIds.map((id) => ({
    studentId: id,
    status: (presentIds.has(id) ? 'presente' : 'ausente') as AttendanceStatus,
  }));

  // De los detectados, dejamos 1 "sin identificar" (si hay al menos 1), que el
  // tutor asigna a mano. Ese rostro ya cuenta dentro de los detectados:
  // marcamos como ausente a uno de los "presentes" y lo dejamos como el cupo
  // sin identificar, de modo que present + unassigned === detected.
  let unassigned = 0;
  if (detected > 0) {
    unassigned = 1;
    const firstPresent = entries.find((e) => e.status === 'presente');
    if (firstPresent) firstPresent.status = 'ausente';
  }

  return { detectedCount: detected, entries, unassigned };
}
