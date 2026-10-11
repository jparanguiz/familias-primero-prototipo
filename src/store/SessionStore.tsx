import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Role } from '@/domain/types';

const SESSION_KEY = 'familias-primero/session/v2';

/**
 * Sesión simulada. No hay usuario/clave: se elige un rol y, para el staff
 * (admin/coordinador/tutor), un usuario concreto. El superusuario no tiene
 * organización fija; elige la organización activa sobre la que opera.
 */
export interface Session {
  role: Role;
  userId: string | null;
  /** Organización activa (para superusuario, elegida; para staff, su propia org). */
  activeOrgId: string | null;
}

interface SessionValue {
  ready: boolean;
  session: Session | null;
  activeVersionId: string | null;
  setActiveVersionId: (id: string | null) => void;
  setActiveOrgId: (id: string | null) => void;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (mounted && raw) setSession(JSON.parse(raw) as Session);
      } catch {
        // sin sesión
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = (s: Session | null) => {
    if (s) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s)).catch(() => {});
    else AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  };

  const signIn = useCallback((s: Session) => {
    setSession(s);
    setActiveVersionId(null);
    persist(s);
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setActiveVersionId(null);
    persist(null);
  }, []);

  const setActiveOrgId = useCallback((id: string | null) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, activeOrgId: id };
      persist(next);
      return next;
    });
    // Cambiar de organización reinicia la versión activa.
    setActiveVersionId(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ ready, session, activeVersionId, setActiveVersionId, setActiveOrgId, signIn, signOut }),
    [ready, session, activeVersionId, setActiveOrgId, signIn, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}

export const ROLE_LABELS: Record<Role, string> = {
  superusuario: 'Superusuario (Fundación)',
  admin: 'Administrador',
  coordinador: 'Coordinador',
  tutor: 'Tutor del programa',
  apoderado: 'Apoderado / Tutor legal',
};
