import { Platform, Share } from 'react-native';

/** Escapa un valor para CSV (comillas y separadores). */
function esc(value: string | number): string {
  const s = String(value ?? '');
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Construye el texto CSV a partir de encabezados y filas. */
export function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))];
  return lines.join('\n');
}

/**
 * Entrega el CSV al usuario.
 * - Web: descarga un archivo .csv.
 * - Nativo: abre el diálogo de compartir con el contenido.
 */
export async function exportCsv(filename: string, csv: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Descarga en el navegador.
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  // Nativo: compartir el texto (el usuario elige dónde guardarlo/enviarlo).
  await Share.share({ title: filename, message: csv });
}
