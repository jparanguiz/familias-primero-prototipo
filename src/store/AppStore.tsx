import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AttendanceRecord,
  AttendanceStatus,
  Consent,
  EnrollmentChannel,
  Guardian,
  License,
  LicenseStatus,
  Organization,
  OrgType,
  ProgramVersion,
  Season,
  StaffAssignment,
  StaffRole,
  Student,
  StudentEnrollmentView,
  User,
  Zone,
  ZoneAssignment,
  ZoneContact,
  ZoneKind,
} from '@/domain/types';
import {
  SEED_ATTENDANCE,
  SEED_CONSENTS,
  SEED_ORGS,
  SEED_STAFF_ASSIGNMENTS,
  SEED_STUDENTS,
  SEED_USERS,
  SEED_VERSIONS,
  SEED_ZONES,
  SEED_ZONE_ASSIGNMENTS,
} from '@/domain/seed';
import { isPhotoRetained, photoRetentionDeadline } from '@/domain/retention';

const STORAGE_KEY = 'familias-primero/state/v4';

interface PersistedState {
  orgs: Organization[];
  users: User[];
  zones: Zone[];
  versions: ProgramVersion[];
  zoneAssignments: ZoneAssignment[];
  staffAssignments: StaffAssignment[];
  students: Student[];
  consents: Consent[];
  attendance: AttendanceRecord[];
}

interface AppStoreValue {
  ready: boolean;
  orgs: Organization[];
  users: User[];
  zones: Zone[];
  versions: ProgramVersion[];
  zoneAssignments: ZoneAssignment[];
  staffAssignments: StaffAssignment[];
  students: Student[];
  consents: Consent[];
  attendance: AttendanceRecord[];

  // Lecturas
  getOrg: (id: string) => Organization | undefined;
  getUser: (id: string) => User | undefined;
  getZone: (id: string) => Zone | undefined;
  getVersion: (id: string) => ProgramVersion | undefined;
  getStudent: (id: string) => Student | undefined;
  getStudentByQr: (qrToken: string) => Student | undefined;
  getActiveConsent: (studentId: string) => Consent | undefined;
  getZoneAssignment: (versionId: string, zoneId: string) => ZoneAssignment | undefined;

  /** Versiones de una organización. */
  versionsInOrg: (orgId: string) => ProgramVersion[];
  /** Zonas (catálogo) de una organización. */
  zonesInOrg: (orgId: string) => Zone[];
  /** Usuarios de una organización. */
  usersInOrg: (orgId: string) => User[];

  zonesInVersion: (versionId: string) => Zone[];
  visibleZonesInVersion: (userId: string | null, role: string | null, versionId: string) => Zone[];
  listStudents: (filter: { versionId?: string; zoneIds?: string[] }) => StudentEnrollmentView[];
  getEnrollmentView: (studentId: string) => StudentEnrollmentView | undefined;

  // Organizaciones (superusuario)
  createOrganization: (name: string, type: OrgType, license: License) => Organization;
  setLicenseStatus: (orgId: string, status: LicenseStatus) => void;

  // Administración (admin / superusuario)
  createVersion: (orgId: string, season: Season, year: number) => ProgramVersion;
  createZone: (orgId: string, data: { name: string; address: string; kind: ZoneKind; contact: ZoneContact }) => Zone;
  createUser: (orgId: string | null, name: string, role: StaffRole, email?: string) => User;
  attachZoneToVersion: (versionId: string, zoneId: string, startDate: string, endDate: string) => ZoneAssignment;
  detachZoneFromVersion: (versionId: string, zoneId: string) => void;
  assignStaff: (versionId: string, userId: string, zoneId: string) => void;
  unassignStaff: (versionId: string, userId: string, zoneId: string) => void;
  logZoneContact: (zoneId: string, reason: string, byUserId?: string) => void;

  // Onboarding
  enrollStudent: (args: {
    orgId: string;
    name: string;
    birthDate: string;
    grade: string;
    run: string;
    versionId: string;
    zoneId: string;
    referencePhotoId: string;
    enrollmentChannel: EnrollmentChannel;
    enrolledByUserId?: string;
  }) => Student;

  signConsent: (args: { studentId: string; guardian: Guardian; signaturePng: string }) => Consent;
  revokeConsent: (studentId: string) => void;

  // Asistencia
  confirmAttendance: (args: {
    versionId: string;
    zoneId: string;
    entries: { studentId: string; status: AttendanceStatus }[];
    confirmedBy: string;
    groupPhotoId?: string;
  }) => AttendanceRecord;
  listAttendance: (filter: { versionId?: string; zoneIds?: string[] }) => AttendanceRecord[];
  purgeExpiredPhotos: () => number;

  resetDemo: () => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

const initialState: PersistedState = {
  orgs: SEED_ORGS,
  users: SEED_USERS,
  zones: SEED_ZONES,
  versions: SEED_VERSIONS,
  zoneAssignments: SEED_ZONE_ASSIGNMENTS,
  staffAssignments: SEED_STAFF_ASSIGNMENTS,
  students: SEED_STUDENTS,
  consents: SEED_CONSENTS,
  attendance: SEED_ATTENDANCE,
};

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PersistedState>(initialState);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && raw) {
          const parsed = JSON.parse(raw) as PersistedState;
          setState({
            orgs: parsed.orgs?.length ? parsed.orgs : SEED_ORGS,
            users: parsed.users?.length ? parsed.users : SEED_USERS,
            zones: parsed.zones?.length ? parsed.zones : SEED_ZONES,
            versions: parsed.versions?.length ? parsed.versions : SEED_VERSIONS,
            zoneAssignments: parsed.zoneAssignments ?? SEED_ZONE_ASSIGNMENTS,
            staffAssignments: parsed.staffAssignments ?? SEED_STAFF_ASSIGNMENTS,
            students: parsed.students ?? SEED_STUDENTS,
            consents: parsed.consents ?? SEED_CONSENTS,
            attendance: parsed.attendance ?? SEED_ATTENDANCE,
          });
        }
      } catch {
        // mantener inicial
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    setState((prev) => {
      const now = new Date();
      let changed = false;
      const attendance = prev.attendance.map((r) => {
        if (r.groupPhotoId && r.photoRetainedUntil && !isPhotoRetained(r.photoRetainedUntil, now)) {
          changed = true;
          return { ...r, groupPhotoId: undefined };
        }
        return r;
      });
      return changed ? { ...prev, attendance } : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ---- Lecturas ----
  const getOrg = useCallback((id: string) => state.orgs.find((o) => o.id === id), [state.orgs]);
  const getUser = useCallback((id: string) => state.users.find((u) => u.id === id), [state.users]);
  const getZone = useCallback((id: string) => state.zones.find((z) => z.id === id), [state.zones]);
  const getVersion = useCallback((id: string) => state.versions.find((v) => v.id === id), [state.versions]);
  const getStudent = useCallback((id: string) => state.students.find((s) => s.id === id), [state.students]);
  const getStudentByQr = useCallback(
    (qrToken: string) => state.students.find((s) => s.qrToken.toUpperCase() === qrToken.trim().toUpperCase()),
    [state.students]
  );
  const getActiveConsent = useCallback(
    (studentId: string) => state.consents.find((c) => c.studentId === studentId && !c.revokedAt),
    [state.consents]
  );
  const getZoneAssignment = useCallback(
    (versionId: string, zoneId: string) =>
      state.zoneAssignments.find((a) => a.versionId === versionId && a.zoneId === zoneId),
    [state.zoneAssignments]
  );

  const versionsInOrg = useCallback(
    (orgId: string) => state.versions.filter((v) => v.orgId === orgId),
    [state.versions]
  );
  const zonesInOrg = useCallback((orgId: string) => state.zones.filter((z) => z.orgId === orgId), [state.zones]);
  const usersInOrg = useCallback((orgId: string) => state.users.filter((u) => u.orgId === orgId), [state.users]);

  const zonesInVersion = useCallback(
    (versionId: string) => {
      const ids = state.zoneAssignments.filter((a) => a.versionId === versionId).map((a) => a.zoneId);
      return state.zones.filter((z) => ids.includes(z.id));
    },
    [state.zoneAssignments, state.zones]
  );

  const visibleZonesInVersion = useCallback(
    (userId: string | null, role: string | null, versionId: string): Zone[] => {
      const participating = zonesInVersion(versionId);
      if (role === 'admin' || role === 'superusuario') return participating;
      if (!userId) return [];
      const myZoneIds = state.staffAssignments
        .filter((a) => a.versionId === versionId && a.userId === userId)
        .map((a) => a.zoneId);
      return participating.filter((z) => myZoneIds.includes(z.id));
    },
    [zonesInVersion, state.staffAssignments]
  );

  const buildView = useCallback(
    (student: Student): StudentEnrollmentView => {
      const consent = state.consents.find((c) => c.studentId === student.id && !c.revokedAt);
      return {
        student,
        zone: state.zones.find((z) => z.id === student.zoneId),
        consent,
        hasActiveConsent: Boolean(consent),
        isEnrolled: Boolean(student.referencePhotoId),
      };
    },
    [state.consents, state.zones]
  );

  const listStudents = useCallback(
    ({ versionId, zoneIds }: { versionId?: string; zoneIds?: string[] }) =>
      state.students
        .filter((s) => (versionId ? s.versionId === versionId : true))
        .filter((s) => (zoneIds ? zoneIds.includes(s.zoneId) : true))
        .map(buildView),
    [state.students, buildView]
  );

  const getEnrollmentView = useCallback(
    (studentId: string) => {
      const s = state.students.find((x) => x.id === studentId);
      return s ? buildView(s) : undefined;
    },
    [state.students, buildView]
  );

  // ---- Organizaciones ----
  const createOrganization: AppStoreValue['createOrganization'] = useCallback((name, type, license) => {
    const org: Organization = { id: uid('org'), name, type, license };
    setState((prev) => ({ ...prev, orgs: [...prev.orgs, org] }));
    return org;
  }, []);

  const setLicenseStatus = useCallback((orgId: string, status: LicenseStatus) => {
    setState((prev) => ({
      ...prev,
      orgs: prev.orgs.map((o) => (o.id === orgId ? { ...o, license: { ...o.license, status } } : o)),
    }));
  }, []);

  // ---- Administración ----
  const createVersion: AppStoreValue['createVersion'] = useCallback((orgId, season, year) => {
    const version: ProgramVersion = { id: uid('v'), orgId, season, year };
    setState((prev) => ({ ...prev, versions: [...prev.versions, version] }));
    return version;
  }, []);

  const createZone: AppStoreValue['createZone'] = useCallback((orgId, { name, address, kind, contact }) => {
    const zone: Zone = { id: uid('z'), orgId, name, address, kind, contact, contactLog: [] };
    setState((prev) => ({ ...prev, zones: [...prev.zones, zone] }));
    return zone;
  }, []);

  const createUser: AppStoreValue['createUser'] = useCallback((orgId, name, role, email) => {
    const user: User = { id: uid('u'), orgId, name, role, email };
    setState((prev) => ({ ...prev, users: [...prev.users, user] }));
    return user;
  }, []);

  const attachZoneToVersion: AppStoreValue['attachZoneToVersion'] = useCallback(
    (versionId, zoneId, startDate, endDate) => {
      const existing = state.zoneAssignments.find((a) => a.versionId === versionId && a.zoneId === zoneId);
      if (existing) {
        const updated = { ...existing, startDate, endDate };
        setState((prev) => ({
          ...prev,
          zoneAssignments: prev.zoneAssignments.map((a) => (a.id === existing.id ? updated : a)),
        }));
        return updated;
      }
      const assignment: ZoneAssignment = { id: uid('za'), versionId, zoneId, startDate, endDate };
      setState((prev) => ({ ...prev, zoneAssignments: [...prev.zoneAssignments, assignment] }));
      return assignment;
    },
    [state.zoneAssignments]
  );

  const detachZoneFromVersion = useCallback((versionId: string, zoneId: string) => {
    setState((prev) => ({
      ...prev,
      zoneAssignments: prev.zoneAssignments.filter((a) => !(a.versionId === versionId && a.zoneId === zoneId)),
      staffAssignments: prev.staffAssignments.filter((a) => !(a.versionId === versionId && a.zoneId === zoneId)),
    }));
  }, []);

  const assignStaff = useCallback((versionId: string, userId: string, zoneId: string) => {
    setState((prev) => {
      if (prev.staffAssignments.some((a) => a.versionId === versionId && a.userId === userId && a.zoneId === zoneId)) return prev;
      return { ...prev, staffAssignments: [...prev.staffAssignments, { id: uid('sa'), versionId, userId, zoneId }] };
    });
  }, []);

  const unassignStaff = useCallback((versionId: string, userId: string, zoneId: string) => {
    setState((prev) => ({
      ...prev,
      staffAssignments: prev.staffAssignments.filter(
        (a) => !(a.versionId === versionId && a.userId === userId && a.zoneId === zoneId)
      ),
    }));
  }, []);

  const logZoneContact = useCallback((zoneId: string, reason: string, byUserId?: string) => {
    setState((prev) => ({
      ...prev,
      zones: prev.zones.map((z) =>
        z.id === zoneId
          ? { ...z, contactLog: [{ id: uid('log'), at: new Date().toISOString(), reason, byUserId }, ...z.contactLog] }
          : z
      ),
    }));
  }, []);

  // ---- Onboarding ----
  const enrollStudent: AppStoreValue['enrollStudent'] = useCallback((args) => {
    const student: Student = {
      id: uid('s'),
      orgId: args.orgId,
      name: args.name,
      birthDate: args.birthDate,
      grade: args.grade,
      run: args.run,
      versionId: args.versionId,
      zoneId: args.zoneId,
      qrToken: `FP-${args.versionId}-${uid('S')}`,
      referencePhotoId: args.referencePhotoId,
      enrollmentChannel: args.enrollmentChannel,
      enrolledByUserId: args.enrolledByUserId,
      enrolledAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, students: [...prev.students, student] }));
    return student;
  }, []);

  const signConsent: AppStoreValue['signConsent'] = useCallback(({ studentId, guardian, signaturePng }) => {
    const consent: Consent = {
      id: uid('consent'),
      studentId,
      guardian: { ...guardian, verified: true },
      signaturePng,
      documentHash: uid('hash'),
      signedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      consents: [
        ...prev.consents.map((c) =>
          c.studentId === studentId && !c.revokedAt ? { ...c, revokedAt: new Date().toISOString() } : c
        ),
        consent,
      ],
    }));
    return consent;
  }, []);

  const revokeConsent = useCallback((studentId: string) => {
    setState((prev) => ({
      ...prev,
      consents: prev.consents.map((c) =>
        c.studentId === studentId && !c.revokedAt ? { ...c, revokedAt: new Date().toISOString() } : c
      ),
      students: prev.students.map((s) => (s.id === studentId ? { ...s, referencePhotoId: undefined } : s)),
    }));
  }, []);

  // ---- Asistencia ----
  const confirmAttendance: AppStoreValue['confirmAttendance'] = useCallback(
    ({ versionId, zoneId, entries, confirmedBy, groupPhotoId }) => {
      const now = new Date().toISOString();
      const assignment = state.zoneAssignments.find((a) => a.versionId === versionId && a.zoneId === zoneId);
      const record: AttendanceRecord = {
        id: uid('att'),
        date: now,
        versionId,
        zoneId,
        entries,
        confirmedBy,
        confirmedAt: now,
        groupPhotoId: groupPhotoId ?? uid('groupphoto'),
        photoRetainedUntil: photoRetentionDeadline(now, assignment),
      };
      setState((prev) => ({ ...prev, attendance: [record, ...prev.attendance] }));
      return record;
    },
    [state.zoneAssignments]
  );

  const listAttendance = useCallback(
    ({ versionId, zoneIds }: { versionId?: string; zoneIds?: string[] }) =>
      state.attendance
        .filter((r) => (versionId ? r.versionId === versionId : true))
        .filter((r) => (zoneIds ? zoneIds.includes(r.zoneId) : true)),
    [state.attendance]
  );

  const purgeExpiredPhotos: AppStoreValue['purgeExpiredPhotos'] = useCallback(() => {
    const now = new Date();
    let purged = 0;
    setState((prev) => {
      const attendance = prev.attendance.map((r) => {
        if (r.groupPhotoId && r.photoRetainedUntil && !isPhotoRetained(r.photoRetainedUntil, now)) {
          purged += 1;
          return { ...r, groupPhotoId: undefined };
        }
        return r;
      });
      return purged > 0 ? { ...prev, attendance } : prev;
    });
    return purged;
  }, []);

  const resetDemo = useCallback(() => setState(initialState), []);

  const value = useMemo<AppStoreValue>(
    () => ({
      ready,
      orgs: state.orgs,
      users: state.users,
      zones: state.zones,
      versions: state.versions,
      zoneAssignments: state.zoneAssignments,
      staffAssignments: state.staffAssignments,
      students: state.students,
      consents: state.consents,
      attendance: state.attendance,
      getOrg,
      getUser,
      getZone,
      getVersion,
      getStudent,
      getStudentByQr,
      getActiveConsent,
      getZoneAssignment,
      versionsInOrg,
      zonesInOrg,
      usersInOrg,
      zonesInVersion,
      visibleZonesInVersion,
      listStudents,
      getEnrollmentView,
      createOrganization,
      setLicenseStatus,
      createVersion,
      createZone,
      createUser,
      attachZoneToVersion,
      detachZoneFromVersion,
      assignStaff,
      unassignStaff,
      logZoneContact,
      enrollStudent,
      signConsent,
      revokeConsent,
      confirmAttendance,
      listAttendance,
      purgeExpiredPhotos,
      resetDemo,
    }),
    [
      ready,
      state,
      getOrg,
      getUser,
      getZone,
      getVersion,
      getStudent,
      getStudentByQr,
      getActiveConsent,
      getZoneAssignment,
      versionsInOrg,
      zonesInOrg,
      usersInOrg,
      zonesInVersion,
      visibleZonesInVersion,
      listStudents,
      getEnrollmentView,
      createOrganization,
      setLicenseStatus,
      createVersion,
      createZone,
      createUser,
      attachZoneToVersion,
      detachZoneFromVersion,
      assignStaff,
      unassignStaff,
      logZoneContact,
      enrollStudent,
      signConsent,
      revokeConsent,
      confirmAttendance,
      listAttendance,
      purgeExpiredPhotos,
      resetDemo,
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore debe usarse dentro de <AppStoreProvider>');
  return ctx;
}
