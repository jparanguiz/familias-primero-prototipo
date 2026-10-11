/**
 * Modelo de datos de Familias Primero.
 *
 * Jerarquía:
 *  - ProgramVersion (temporada + año). No tiene fechas propias.
 *  - Zone (institución: colegio / municipalidad / biblioteca) con contacto responsable.
 *  - ZoneAssignment: una zona participa en una versión, con fechas propias (inicio/fin).
 *  - StaffAssignment: un usuario (tutor/coordinador) atiende una zona en una versión.
 *  - Student: niño inscrito en una versión + zona, con datos completos y canal de ingreso.
 */

export type Relationship = 'Madre' | 'Padre' | 'Tutor legal';
export type AttendanceStatus = 'presente' | 'ausente';

// ---------------------------------------------------------------------------
// Organizaciones (multi-tenant con licencias)
// ---------------------------------------------------------------------------

export type OrgType = 'fundacion' | 'municipalidad' | 'institucion';
export type LicenseStatus = 'activa' | 'suspendida';

export interface License {
  status: LicenseStatus;
  startDate: string; // ISO (fecha)
  endDate?: string; // ISO (fecha), opcional
}

/**
 * Organización = tenant. La fundación es la organización raíz; además puede
 * licenciar el programa a municipalidades/instituciones. Cada organización tiene
 * sus propias versiones, zonas, usuarios y niños (aislamiento total).
 */
export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  license: License;
}

// ---------------------------------------------------------------------------
// Roles y usuarios
// ---------------------------------------------------------------------------

export type Role = 'superusuario' | 'admin' | 'coordinador' | 'tutor' | 'apoderado';

/** Roles del staff que viven en el store (tienen organización, salvo superusuario). */
export type StaffRole = 'superusuario' | 'admin' | 'coordinador' | 'tutor';

export interface User {
  id: string;
  name: string;
  role: StaffRole;
  /** Organización a la que pertenece. El superusuario no está atado a una (null). */
  orgId: string | null;
  /** Correo de contacto (para carga masiva / identificación). */
  email?: string;
}

// ---------------------------------------------------------------------------
// Zonas, contacto y versiones
// ---------------------------------------------------------------------------

export type ZoneKind = 'Colegio' | 'Municipalidad' | 'Biblioteca' | 'Otra';

/** Contacto responsable de una zona (institución). */
export interface ZoneContact {
  name: string;
  phone: string;
  email: string;
  role: string; // cargo
}

/** Registro de uso del dato de contacto (historial). */
export interface ContactLogEntry {
  id: string;
  at: string; // ISO
  reason: string;
  byUserId?: string;
}

export interface Zone {
  id: string;
  orgId: string;
  name: string;
  address: string;
  kind: ZoneKind;
  contact: ZoneContact;
  /** Historial de veces que se usó el dato de contacto. */
  contactLog: ContactLogEntry[];
}

export type Season = 'Verano' | 'Invierno';

export interface ProgramVersion {
  id: string;
  orgId: string;
  season: Season;
  year: number;
}

/** Participación de una zona en una versión, con sus fechas propias. */
export interface ZoneAssignment {
  id: string;
  versionId: string;
  zoneId: string;
  startDate: string; // ISO
  endDate: string; // ISO
}

/** Asignación de un usuario (tutor/coordinador) a una zona en una versión. */
export interface StaffAssignment {
  id: string;
  versionId: string;
  userId: string;
  zoneId: string;
}

// ---------------------------------------------------------------------------
// Niños, apoderados y consentimiento
// ---------------------------------------------------------------------------

export interface Guardian {
  run: string;
  fullName: string;
  relationship: Relationship;
  verified: boolean;
}

/** Canal por el que se inscribió al niño. */
export type EnrollmentChannel = 'apoderado' | 'tutor';

export interface Student {
  id: string;
  orgId: string;
  name: string;
  /** Datos completos del niño (todos obligatorios en el onboarding). */
  birthDate: string; // ISO (fecha de nacimiento)
  grade: string; // curso / nivel
  run: string; // RUN del niño
  versionId: string;
  zoneId: string;
  qrToken: string;
  /** Foto del niño subida en el onboarding (= foto de referencia, simulada). */
  referencePhotoId?: string;
  /** Canal de ingreso y usuario que lo registró (si lo ingresó el staff). */
  enrollmentChannel: EnrollmentChannel;
  enrolledByUserId?: string;
  enrolledAt: string;
}

export interface Consent {
  id: string;
  studentId: string;
  guardian: Guardian;
  signaturePng: string;
  documentHash: string;
  signedAt: string;
  revokedAt?: string;
}

// ---------------------------------------------------------------------------
// Asistencia
// ---------------------------------------------------------------------------

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  versionId: string;
  zoneId: string;
  entries: AttendanceEntry[];
  confirmedBy: string;
  confirmedAt: string;
  groupPhotoId?: string;
  photoRetainedUntil?: string;
}

// ---------------------------------------------------------------------------
// Vistas derivadas
// ---------------------------------------------------------------------------

export interface StudentEnrollmentView {
  student: Student;
  zone?: Zone;
  consent?: Consent;
  hasActiveConsent: boolean;
  isEnrolled: boolean;
}
