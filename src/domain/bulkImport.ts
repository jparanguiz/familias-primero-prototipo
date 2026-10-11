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
  const csv = [
    'nombre,direccion,tipo,contacto_nombre,contacto_telefono,contacto_email,contacto_cargo',
    'Colegio Ejemplo,Av. Siempre Viva 100,Colegio,Ana Pérez,+56 9 0000 0000,ana@colegio.cl,Directora',
  ].join('\n');
  await exportCsv('plantilla_zonas.csv', csv);
}

export async function downloadUsersTemplate(): Promise<void> {
  const csv = ['nombre,rol,email', 'Pedro Tutor,tutor,pedro@fundacion.cl', 'Carla Coord,coordinador,carla@fundacion.cl'].join('\n');
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
