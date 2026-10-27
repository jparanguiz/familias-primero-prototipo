/**
 * Sistema de diseño de la app Familias Primero.
 * Colores y tipografía extraídos de los diseños Figma entregados (SVG 360x720).
 */

/**
 * Paleta de la Fundación Familias Primero, muestreada del sitio:
 *  - Teal #49A2AD (header) → principal (botones).
 *  - Violeta #8858E0 (logo) y vino #482860 (menú activo) → acentos.
 * Fondo blanco; acentos atenuados para no saturar.
 */
export const colors = {
  // Superficies
  background: '#FFFFFF',
  surface: '#F4F3F0',
  borderSoft: '#E4E3DF',
  border: '#B4B2A9',

  // Texto
  textPrimary: '#1F1F1E',
  textSecondary: '#6B6A66',
  textMuted: '#9A9892',
  textOnDark: '#FFFFFF',

  // Primario (botón de acción) = teal de la marca
  primary: '#2F8F99',          // teal un poco más profundo para contraste con texto blanco
  primaryBg: '#E7F4F5',        // teal muy claro para fondos suaves (banda del header, chips)
  primaryDark: '#1F6B73',      // teal oscuro para títulos de tarjetas
  primaryBorder: '#9ED0D2',    // borde teal claro (pastillas)

  // Acento teal (links, datos, info)
  blue: '#2F7F88',             // mantiene el nombre "blue" por compatibilidad; ahora es teal oscuro
  blueBg: '#E7F4F5',

  // Texto sobre la banda teal del header
  headerText: '#15343A',
  headerRole: '#2F8F99',
  headerOrg: '#3F7B80',

  // Acento violeta (acciones secundarias, destacados de marca)
  violet: '#7A4AC2',
  violetDark: '#6A3FB0',       // violeta para títulos de sección 'Programa'
  violetBg: '#EFE8FB',

  // Vino (destacados / activo), tomado del menú del sitio
  wine: '#482860',
  wineBg: '#EEE8F0',

  // Éxito (verde apagado)
  green: '#3B6D11',
  greenBg: '#E8F3E2',

  // Error (rojo apagado)
  red: '#A32D2D',
  redBg: '#F7E7E7',

  // Advertencia (ámbar apagado)
  amber: '#8A5A12',
  amberBg: '#FDEEDC',
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
