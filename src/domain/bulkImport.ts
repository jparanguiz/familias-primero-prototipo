import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { Platform } from 'react-native';
import { exportCsv } from './csv';
import { ZoneKind } from './types';

/**
 * Carga masiva de usuarios y zonas desde .xlsx / .csv / .txt.
 * Lee la primera hoja (o el CSV/TSV), toma la primera fila como encabezados y
 * mapea por nombre de columna (flexible, sin distinguir mayúsculas/acentos).
 */

export interface ParsedRow {
  [key: string]: string;
}

/** Normaliza encabezados: minúsculas, sin acentos ni espacios extra. */
function normKey(k: string): string {
  return k
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export interface PickedFile {
  name: string;
  rows: ParsedRow[];
}

/** Abre el selector de archivos y parsea el contenido a filas normalizadas. */
export async function pickAndParse(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'text/csv',
      'text/plain',
      'application/vnd.ms-excel',
      '*/*',
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];

  let workbook: XLSX.WorkBook;

  if (Platform.OS === 'web') {
    // En web, el asset trae un File/uri; leemos como ArrayBuffer.
    const file: any = (asset as any).file;
    const data = file
      ? await file.arrayBuffer()
      : await (await fetch(asset.uri)).arrayBuffer();
    workbook = XLSX.read(data, { type: 'array' });
  } else {
    // En nativo leemos el contenido del uri.
    const resp = await fetch(asset.uri);
    const buf = await resp.arrayBuffer();
    workbook = XLSX.read(buf, { type: 'array' });
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const rows: ParsedRow[] = raw.map((r) => {
    const out: ParsedRow = {};
    Object.keys(r).forEach((k) => {
      out[normKey(k)] = String(r[k] ?? '').trim();
    });
    return out;
  });

  return { name: asset.name ?? 'archivo', rows };
}

/** Toma el primer valor no vacío entre varias claves posibles. */
export function pick(row: ParsedRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[normKey(k)];
    if (v) return v;
  }
  return '';
}

// ---- Plantillas descargables ----

export async function downloadZonesTemplate(): Promise<void> {
  // 'version' es opcional: si se indica (ej. "Verano 2027") y existe en la
  // organización, la zona se suma además a esa versión. Si va vacía, solo
  // queda en el catálogo.
  const csv = [
    'nombre,direccion,tipo,contacto_nombre,contacto_telefono,contacto_email,contacto_cargo,version,inicio,fin',
    'Colegio Ejemplo,Av. Siempre Viva 100,Colegio,Ana Pérez,+56 9 0000 0000,ana@colegio.cl,Directora,Verano 2027,2027-01-11,2027-01-22',
    'Biblioteca Ejemplo,Calle 2,Biblioteca,Luis Díaz,+56 9 1111 1111,luis@bib.cl,Encargado,,,',
  ].join('\n');
  await exportCsv('plantilla_zonas.csv', csv);
}

/**
 * Interpreta un texto de versión tipo "Verano 2027" / "invierno-2027".
 * Devuelve { season, year } o null si no se reconoce.
 */
export function parseVersionText(
  value: string
): { season: 'Verano' | 'Invierno'; year: number } | null {
  const v = normKey(value);
  if (!v) return null;
  const yearMatch = v.match(/\d{4}/);
  if (!yearMatch) return null;
  const year = parseInt(yearMatch[0], 10);
  if (v.includes('verano')) return { season: 'Verano', year };
  if (v.includes('invierno')) return { season: 'Invierno', year };
  return null;
}

export async function downloadUsersTemplate(): Promise<void> {
  // El nombre lo completa la persona en su primer ingreso; aquí solo correo + rol.
  const csv = ['email,rol', 'pedro@fundacion.cl,tutor', 'carla@fundacion.cl,coordinador'].join('\n');
  await exportCsv('plantilla_usuarios.csv', csv);
}

/** Normaliza un tipo de zona textual a ZoneKind. */
export function normalizeZoneKind(value: string): ZoneKind {
  const v = normKey(value);
  if (v.startsWith('coleg')) return 'Colegio';
  if (v.startsWith('munic')) return 'Municipalidad';
  if (v.startsWith('bibliot')) return 'Biblioteca';
  return 'Otra';
}

/** Normaliza un rol textual a rol de staff. */
export function normalizeRole(value: string): 'tutor' | 'coordinador' | null {
  const v = normKey(value);
  if (v.startsWith('tutor')) return 'tutor';
  if (v.startsWith('coord')) return 'coordinador';
  return null;
}
