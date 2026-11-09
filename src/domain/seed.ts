import {
  AttendanceRecord,
  AttendanceStatus,
  Consent,
  Organization,
  ProgramVersion,
  StaffAssignment,
  Student,
  User,
  Zone,
  ZoneAssignment,
} from './types';
import { hashPassword } from './auth';

/** Clave de demo para los usuarios de ejemplo ya activos. */
const DEMO_PWD = hashPassword('demo123');

// --- Organizaciones (tenants) ---
export const ORG_FUNDACION = 'org-fundacion';
export const ORG_MUNI = 'org-muni-lapintana';

export const SEED_ORGS: Organization[] = [
  {
    id: ORG_FUNDACION,
    name: 'Fundación Familias Primero',
    type: 'fundacion',
    license: { status: 'activa', startDate: '2025-01-01' },
  },
  {
    id: ORG_MUNI,
    name: 'Municipalidad de La Pintana',
    type: 'municipalidad',
    license: { status: 'activa', startDate: '2026-06-01', endDate: '2027-12-31' },
  },
];

// --- Zonas (institución) por organización ---
export const SEED_ZONES: Zone[] = [
  {
    id: 'z1', orgId: ORG_FUNDACION, name: 'Colegio Lo Espejo', address: 'Av. Central 123, Lo Espejo', kind: 'Colegio', regionId: '13', comuna: 'Lo Espejo',
    contact: { name: 'Rosa Fernández', phone: '+56 9 1111 1111', email: 'rosa@loespejo.cl', role: 'Directora' }, contactLog: [],
  },
  {
    id: 'z2', orgId: ORG_FUNDACION, name: 'Biblioteca La Pintana', address: 'Calle del Libro 45, La Pintana', kind: 'Biblioteca', regionId: '13', comuna: 'La Pintana',
    contact: { name: 'Jorge Peña', phone: '+56 9 2222 2222', email: 'jorge@biblapintana.cl', role: 'Encargado' }, contactLog: [],
  },
  {
    id: 'z3', orgId: ORG_FUNDACION, name: 'Municipalidad de El Bosque', address: 'Plaza Mayor 7, El Bosque', kind: 'Municipalidad', regionId: '13', comuna: 'El Bosque',
    contact: { name: 'Marta Ruiz', phone: '+56 9 3333 3333', email: 'marta@elbosque.cl', role: 'Coord. social' }, contactLog: [],
  },
  // Zona de la municipalidad licenciataria
  {
    id: 'z4', orgId: ORG_MUNI, name: 'Escuela Municipal Las Rosas', address: 'Los Rosales 500, La Pintana', kind: 'Colegio', regionId: '13', comuna: 'La Pintana',
    contact: { name: 'Pamela Soto', phone: '+56 9 4444 4444', email: 'pamela@lapintana.cl', role: 'Jefa DAEM' }, contactLog: [],
  },
];

// --- Usuarios del staff ---
// Usuarios ya activos con clave de demo: demo123
export const SEED_USERS: User[] = [
  { id: 'u-super', name: 'Super Fundación', role: 'superusuario', orgId: null, email: 'super@familiasprimero.cl', status: 'activo', passwordHash: DEMO_PWD },
  { id: 'u-admin', name: 'Admin Fundación', role: 'admin', orgId: ORG_FUNDACION, email: 'admin@familiasprimero.cl', status: 'activo', passwordHash: DEMO_PWD },
  { id: 'u-coord', name: 'Carla Coordinadora', role: 'coordinador', orgId: ORG_FUNDACION, email: 'carla@familiasprimero.cl', status: 'activo', passwordHash: DEMO_PWD },
  { id: 'u-tutor1', name: 'Pedro Tutor', role: 'tutor', orgId: ORG_FUNDACION, email: 'pedro@familiasprimero.cl', status: 'activo', passwordHash: DEMO_PWD },
  { id: 'u-tutor2', name: 'Lucía Tutora', role: 'tutor', orgId: ORG_FUNDACION, email: 'lucia@familiasprimero.cl', status: 'activo', passwordHash: DEMO_PWD },
  { id: 'u-tutor3', name: 'Diego Tutor', role: 'tutor', orgId: ORG_FUNDACION, email: 'diego@familiasprimero.cl', status: 'activo', passwordHash: DEMO_PWD },
  // Staff de la municipalidad
  { id: 'u-admin-muni', name: 'Admin La Pintana', role: 'admin', orgId: ORG_MUNI, email: 'admin@lapintana.cl', status: 'activo', passwordHash: DEMO_PWD },
  { id: 'u-tutor-muni', name: 'Rodrigo Tutor', role: 'tutor', orgId: ORG_MUNI, email: 'rodrigo@lapintana.cl', status: 'activo', passwordHash: DEMO_PWD },
  // Usuario INVITADO para demostrar el primer ingreso (enrolamiento): nuevo@familiasprimero.cl
  { id: 'u-invitado', name: '', role: 'tutor', orgId: ORG_FUNDACION, email: 'nuevo@familiasprimero.cl', status: 'invitado' },
];

// --- Versiones por organización (sin fechas propias) ---
export const SEED_VERSION: ProgramVersion = { id: 'v-verano-2027', orgId: ORG_FUNDACION, season: 'Verano', year: 2027 };
export const SEED_VERSION_MUNI: ProgramVersion = { id: 'v-muni-invierno-2027', orgId: ORG_MUNI, season: 'Invierno', year: 2027 };

export const SEED_VERSIONS: ProgramVersion[] = [SEED_VERSION, SEED_VERSION_MUNI];

// --- Zonas que participan en cada versión ---
export const SEED_ZONE_ASSIGNMENTS: ZoneAssignment[] = [
  { id: 'za1', versionId: SEED_VERSION.id, zoneId: 'z1', startDate: '2027-01-11', endDate: '2027-01-22' },
  { id: 'za2', versionId: SEED_VERSION.id, zoneId: 'z2', startDate: '2027-01-18', endDate: '2027-01-29' },
  { id: 'za3', versionId: SEED_VERSION_MUNI.id, zoneId: 'z4', startDate: '2027-07-05', endDate: '2027-07-16' },
];

// --- Asignación de staff a zonas por versión ---
export const SEED_STAFF_ASSIGNMENTS: StaffAssignment[] = [
  { id: 'sa1', versionId: SEED_VERSION.id, userId: 'u-coord', zoneId: 'z1' },
  { id: 'sa2', versionId: SEED_VERSION.id, userId: 'u-coord', zoneId: 'z2' },
  { id: 'sa3', versionId: SEED_VERSION.id, userId: 'u-tutor1', zoneId: 'z1' },
  { id: 'sa4', versionId: SEED_VERSION.id, userId: 'u-tutor2', zoneId: 'z1' },
  { id: 'sa5', versionId: SEED_VERSION.id, userId: 'u-tutor2', zoneId: 'z2' },
  { id: 'sa6', versionId: SEED_VERSION_MUNI.id, userId: 'u-tutor-muni', zoneId: 'z4' },
];

const NAMES = [
  'Martina Soto', 'Benjamín Rojas', 'Josefa Muñoz', 'Tomás Vega',
  'Valentina Díaz', 'Matías Fuentes', 'Florencia Castro', 'Agustín Herrera',
  'Isidora Pizarro', 'Vicente Araya', 'Antonella Reyes', 'Joaquín Morales',
  'Catalina Núñez', 'Lucas Espinoza', 'Emilia Carrasco', 'Benjamín Tapia',
  'Amanda Flores', 'Maximiliano Vera', 'Trinidad Gómez', 'Gaspar Riquelme',
  'Renata Sepúlveda', 'Dante Figueroa',
];

const GRADES = ['1° básico', '2° básico', '3° básico A', '4° básico'];
function fakeRun(i: number): string {
  const body = 10000000 + i * 111111;
  return `${body}-K`;
}

/** 22 alumnos de ejemplo en Verano 2027 (Fundación), Colegio Lo Espejo. */
const STUDENTS_Z1: Student[] = NAMES.map((name, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    id: `s${n}`,
    orgId: ORG_FUNDACION,
    name,
    birthDate: `201${7 - (i % 4)}-0${(i % 9) + 1}-15`,
    grade: GRADES[i % GRADES.length],
    run: fakeRun(i + 1),
    versionId: SEED_VERSION.id,
    zoneId: 'z1',
    qrToken: `FP-${SEED_VERSION.id}-S${n}`,
    referencePhotoId: `ref_s${n}`,
    enrollmentChannel: i % 3 === 0 ? 'tutor' : 'apoderado',
    enrolledByUserId: i % 3 === 0 ? 'u-tutor1' : undefined,
    enrolledAt: '2027-01-11',
  };
});

/** 10 alumnos de ejemplo en Verano 2027 (Fundación), Biblioteca La Pintana. */
const NAMES_Z2 = [
  'Sofía Lagos', 'Ignacio Bravo', 'Camila Ortiz', 'Felipe Salas', 'Javiera Mora',
  'Cristóbal Pino', 'Daniela Ríos', 'Nicolás Parra', 'Constanza Leiva', 'Sebastián Arce',
];

const STUDENTS_Z2: Student[] = NAMES_Z2.map((name, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    id: `t${n}`,
    orgId: ORG_FUNDACION,
    name,
    birthDate: `201${6 + (i % 3)}-0${(i % 9) + 1}-20`,
    grade: GRADES[i % GRADES.length],
    run: fakeRun(40 + i),
    versionId: SEED_VERSION.id,
    zoneId: 'z2',
    qrToken: `FP-${SEED_VERSION.id}-T${n}`,
    referencePhotoId: `ref_t${n}`,
    enrollmentChannel: 'apoderado',
    enrolledAt: '2027-01-18',
  };
});

export const SEED_STUDENTS: Student[] = [...STUDENTS_Z1, ...STUDENTS_Z2];

export const SEED_CONSENTS: Consent[] = [...STUDENTS_Z1.slice(0, 20), ...STUDENTS_Z2].map((s, i) => ({
  id: `c_${s.id}`,
  studentId: s.id,
  guardian: {
    run: '12.345.678-5',
    fullName: `Apoderado/a de ${s.name.split(' ')[0]}`,
    relationship: i % 2 === 0 ? 'Madre' : 'Padre',
    verified: true,
  },
  signaturePng: 'seed-signature',
  documentHash: `hash_${s.id}`,
  signedAt: s.enrolledAt,
}));

/**
 * Asistencia de ejemplo: varios días ya confirmados en cada zona, para poder
 * ver el seguimiento (visual y detalle) desde el primer ingreso a la demo.
 * Los ausentes se reparten de forma determinista.
 */
function seedDay(
  zoneId: string,
  zoneStudents: Student[],
  day: string,
  absentCount: number,
  shift: number,
  confirmedBy: string,
  retainedUntil: string
): AttendanceRecord {
  const n = zoneStudents.length;
  const entries = zoneStudents.map((s, i) => ({
    studentId: s.id,
    status: (((i + shift) % n) < absentCount ? 'ausente' : 'presente') as AttendanceStatus,
  }));
  const at = `${day}T10:00:00`;
  return {
    id: `att_seed_${zoneId}_${day}`,
    date: at,
    versionId: SEED_VERSION.id,
    zoneId,
    entries,
    confirmedBy,
    confirmedAt: at,
    groupPhotoId: `seed_photo_${zoneId}_${day}`,
    photoRetainedUntil: retainedUntil,
  };
}

const Z1_DAYS = ['2027-01-11', '2027-01-12', '2027-01-13', '2027-01-14', '2027-01-15'];
const Z1_ABSENT = [3, 4, 2, 5, 3];
const Z1_SHIFT = [0, 5, 9, 13, 17];
const Z2_DAYS = ['2027-01-18', '2027-01-19', '2027-01-20'];
const Z2_ABSENT = [2, 1, 3];
const Z2_SHIFT = [0, 4, 7];

export const SEED_ATTENDANCE: AttendanceRecord[] = [
  ...Z1_DAYS.map((d, i) =>
    seedDay('z1', STUDENTS_Z1, d, Z1_ABSENT[i], Z1_SHIFT[i], 'Pedro Tutor', '2027-02-22T00:00:00.000Z')
  ),
  ...Z2_DAYS.map((d, i) =>
    seedDay('z2', STUDENTS_Z2, d, Z2_ABSENT[i], Z2_SHIFT[i], 'Lucía Tutora', '2027-02-28T00:00:00.000Z')
  ),
];
