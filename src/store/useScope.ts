import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';

/**
 * Organización en la que opera el usuario actual.
 * - superusuario → la organización activa que eligió (session.activeOrgId)
 * - staff (admin/coordinador/tutor) → la organización de su usuario
 * - apoderado → la organización activa de la sesión (precargada por QR o selección)
 */
export function useActiveOrgId(): string | null {
  const { session } = useSession();
  const { getUser } = useAppStore();
  if (!session) return null;
  if (session.role === 'superusuario') return session.activeOrgId;
  if (session.userId) {
    const u = getUser(session.userId);
    if (u?.orgId) return u.orgId;
  }
  return session.activeOrgId;
}

/**
 * Ids de zonas visibles para el usuario actual en una versión dada.
 * - admin / superusuario → todas las zonas de la versión
 * - coordinador / tutor → sus zonas asignadas en esa versión
 * - apoderado / sin sesión → []
 */
export function useVisibleZoneIds(versionId: string | null): string[] {
  const { session } = useSession();
  const { visibleZonesInVersion } = useAppStore();
  if (!session || !versionId || session.role === 'apoderado') return [];
  return visibleZonesInVersion(session.userId, session.role, versionId).map((z) => z.id);
}

/** Solo el tutor puede pasar asistencia. */
export function useCanTakeAttendance(): boolean {
  const { session } = useSession();
  return session?.role === 'tutor';
}
