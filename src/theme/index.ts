/**
 * Sistema de diseño de la app Familias Primero.
 * Colores y tipografía extraídos de los diseños Figma entregados (SVG 360x720).
 */

export const colors = {
  // Superficies
  background: '#FFFFFF',
  surface: '#F4F4F2',
  borderSoft: '#D9D8D2',
  border: '#B4B2A9',

  // Texto
  textPrimary: '#1F1F1E',
  textSecondary: '#6B6A66',
  textMuted: '#9A9892',
  textOnDark: '#FFFFFF',

  // Primario (botón de acción)
  primary: '#1F1F1E',

  // Acento azul (links, info)
  blue: '#185FA5',
  blueBg: '#E6F1FB',

  // Éxito (verde)
  green: '#3B6D11',
  greenBg: '#EAF3DE',

  // Error (rojo)
  red: '#A32D2D',
  redBg: '#F7E7E7',

  // Advertencia (ámbar)
  amber: '#854F0B',
  amberBg: '#FAEEDA',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  caption: 12,
  small: 13,
  body: 14,
  subtitle: 16,
  title: 22,
} as const;

/**
 * Familias tipográficas. Si las fuentes Inter cargaron (expo-font),
 * usamos los pesos reales; si no, el sistema cae a la fuente por defecto.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export type AppColor = keyof typeof colors;
