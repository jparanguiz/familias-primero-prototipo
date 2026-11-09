import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { PctTone, pctTone } from '@/domain/attendanceStats';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/** Colores del % de asistencia según el umbral (ver attendanceStats). */
export const TONE_STYLE: Record<PctTone, { fg: string; bg: string }> = {
  good: { fg: colors.green, bg: colors.greenBg },
  warn: { fg: colors.amber, bg: colors.amberBg },
  bad: { fg: colors.red, bg: colors.redBg },
  none: { fg: colors.textMuted, bg: colors.surface },
};

/** Etiqueta con el % de asistencia coloreada por umbral. */
export function PctBadge({ pct }: { pct: number | null }) {
  const t = TONE_STYLE[pctTone(pct)];
  return (
    <Text style={[styles.badge, { color: t.fg, backgroundColor: t.bg }]}>
      {pct == null ? '—' : `${pct}%`}
    </Text>
  );
}

/** Aro de progreso con el % al centro. Arranca a las 12 en punto. */
export function Donut({ value, size = 116, stroke = 12 }: { value: number | null; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value ?? 0));
  const len = (c * pct) / 100;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.borderSoft} strokeWidth={stroke} fill="none" />
        {len > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={c / 4}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.donutCenter]} pointerEvents="none">
        <Text style={styles.donutValue}>{value == null ? '—' : `${value}%`}</Text>
        <Text style={styles.donutCaption}>asistencia</Text>
      </View>
    </View>
  );
}

export interface DayBar {
  key: string;
  label: string;
  pct: number | null;
}

/** Barras verticales: una por día, con el % arriba y la fecha abajo. */
export function DayBars({ data, height = 150 }: { data: DayBar[]; height?: number }) {
  const many = data.length > 8;
  const colStyle = many ? { width: 44 } : { flex: 1 };
  const barWidth = many ? 20 : 24;

  const chart = (
    <View style={many ? undefined : { width: '100%' }}>
      <View style={{ height: height + 20 }}>
        {[0, 50, 100].map((g) => (
          <View key={g} style={[styles.grid, { bottom: (height * g) / 100 }]} />
        ))}
        <View style={styles.barsRow}>
          {data.map((d) => (
            <View key={d.key} style={[styles.col, colStyle]}>
              <Text style={styles.barValue}>{d.pct == null ? '—' : `${d.pct}%`}</Text>
              <View style={[styles.bar, { width: barWidth, height: Math.max(3, ((d.pct ?? 0) * height) / 100) }]} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.labelsRow}>
        {data.map((d) => (
          <Text key={d.key} style={[styles.barLabel, colStyle]} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );

  return many ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {chart}
    </ScrollView>
  ) : (
    chart
  );
}

/** Fila con nombre, detalle y una barra horizontal proporcional al %. */
export function HBarRow({ name, sub, pct }: { name: string; sub?: string; pct: number | null }) {
  return (
    <View style={styles.hRow}>
      <View style={styles.hHead}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={styles.hName} numberOfLines={1}>
            {name}
          </Text>
          {sub ? <Text style={styles.hSub}>{sub}</Text> : null}
        </View>
        <PctBadge pct={pct} />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, pct ?? 0)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    minWidth: 48,
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  donutCenter: { alignItems: 'center', justifyContent: 'center' },
  donutValue: { fontFamily: fonts.semibold, fontSize: 24, color: colors.textPrimary },
  donutCaption: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.borderSoft },
  barsRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  col: { alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { fontFamily: fonts.medium, fontSize: 10, color: colors.textSecondary, marginBottom: 3 },
  bar: { backgroundColor: colors.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  labelsRow: { flexDirection: 'row', marginTop: spacing.xs },
  barLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  hRow: { marginBottom: spacing.lg },
  hHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  hName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  hSub: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 1 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
