import {
  AttendanceRecord,
  Consent,
  Organization,
  ProgramVersion,
  StaffAssignment,
  Student,
  User,
  Zone,
  ZoneAssignment,
} from './types';

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
    id: 'z1', orgId: ORG_FUNDACION, name: 'Colegio Lo Espejo', address: 'Av. Central 123, Lo Espejo', kind: 'Colegio',
    contact: { name: 'Rosa Fernández', phone: '+56 9 1111 1111', email: 'rosa@loespejo.cl', role: 'Directora' }, contactLog: [],
  },
  {
    id: 'z2', orgId: ORG_FUNDACION, name: 'Biblioteca La Pintana', address: 'Calle del Libro 45, La Pintana', kind: 'Biblioteca',
    contact: { name: 'Jorge Peña', phone: '+56 9 2222 2222', email: 'jorge@biblapintana.cl', role: 'Encargado' }, contactLog: [],
  },
  {
    id: 'z3', orgId: ORG_FUNDACION, name: 'Municipalidad de El Bosque', address: 'Plaza Mayor 7, El Bosque', kind: 'Municipalidad',
    contact: { name: 'Marta Ruiz', phone: '+56 9 3333 3333', email: 'marta@elbosque.cl', role: 'Coord. social' }, contactLog: [],
  },
  // Zona de la municipalidad licenciataria
  {
    id: 'z4', orgId: ORG_MUNI, name: 'Escuela Municipal Las Rosas', address: 'Los Rosales 500, La Pintana', kind: 'Colegio',
    contact: { name: 'Pamela Soto', phone: '+56 9 4444 4444', email: 'pamela@lapintana.cl', role: 'Jefa DAEM' }, contactLog: [],
  },
];

// --- Usuarios del staff ---
export const SEED_USERS: User[] = [
  { id: 'u-super', name: 'Super Fundación', role: 'superusuario', orgId: null, email: 'super@familiasprimero.cl' },
  { id: 'u-admin', name: 'Admin Fundación', role: 'admin', orgId: ORG_FUNDACION, email: 'admin@familiasprimero.cl' },
  { id: 'u-coord', name: 'Carla Coordinadora', role: 'coordinador', orgId: ORG_FUNDACION, email: 'carla@familiasprimero.cl' },
  { id: 'u-tutor1', name: 'Pedro Tutor', role: 'tutor', orgId: ORG_FUNDACION, email: 'pedro@familiasprimero.cl' },
  { id: 'u-tutor2', name: 'Lucía Tutora', role: 'tutor', orgId: ORG_FUNDACION, email: 'lucia@familiasprimero.cl' },
  { id: 'u-tutor3', name: 'Diego Tutor', role: 'tutor', orgId: ORG_FUNDACION, email: 'diego@familiasprimero.cl' },
  // Staff de la municipalidad
  { id: 'u-admin-muni', name: 'Admin La Pintana', role: 'admin', orgId: ORG_MUNI, email: 'admin@lapintana.cl' },
  { id: 'u-tutor-muni', name: 'Rodrigo Tutor', role: 'tutor', orgId: ORG_MUNI, email: 'rodrigo@lapintana.cl' },
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
export const SEED_STUDENTS: Student[] = NAMES.map((name, i) => {
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

export const SEED_CONSENTS: Consent[] = SEED_STUDENTS.slice(0, 20).map((s, i) => ({
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
  signedAt: '2027-01-11',
}));

export const SEED_ATTENDANCE: AttendanceRecord[] = [];
