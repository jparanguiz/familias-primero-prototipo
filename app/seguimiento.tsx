import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Banner } from '@/components/Banner';
import { Card } from '@/components/Card';
import { Select } from '@/components/Select';
import { VersionPicker, useActiveVersion } from '@/components/VersionPicker';
import { DayBars, Donut, HBarRow, PctBadge } from '@/components/charts';
import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';
import { useVisibleZoneIds } from '@/store/useScope';
import { aggregateDays, buildZoneStat, computeTotals, DayStat, ZoneStat } from '@/domain/attendanceStats';
import { formatDate } from '@/domain/format';
import { versionLabel } from '@/domain/retention';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

type Mode = 'visual' | 'detalle';
const ALL = '__all__';

const shortDate = (iso: string) => formatDate(iso).replace(/ \d{4}$/, '');

export default function Seguimiento() {
  const { listStudents, listAttendance, getZone } = useAppStore();
  const { session } = useSession();
  const { active } = useActiveVersion();
  const scope = useVisibleZoneIds(active?.id ?? null);

  const [mode, setMode] = useState<Mode>('visual');
  const [zoneFilter, setZoneFilter] = useState<string>(ALL);

  const zones: ZoneStat[] = useMemo(() => {
    if (!active) return [];
    return scope.map((zoneId) => {
      const students = listStudents({ versionId: active.id, zoneIds: [zoneId] }).length;
      const records = listAttendance({ versionId: active.id, zoneIds: [zoneId] });
      return buildZoneStat(zoneId, students, records);
    });
  }, [active, scope.join(','), listStudents, listAttendance]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => computeTotals(zones), [zones]);
  const zoneName = (id: string) => getZone(id)?.name ?? id;

  const role = session?.role;
  const scopeText =
    role === 'tutor'
      ? 'Mostrando tus zonas'
      : role === 'coordinador'
        ? 'Mostrando las zonas a tu cargo'
        : 'Mostrando todas las zonas';

  const filterValid = zoneFilter === ALL || scope.includes(zoneFilter);
  const barsDays: DayStat[] = useMemo(() => {
    if (zoneFilter !== ALL && filterValid) return zones.find((z) => z.zoneId === zoneFilter)?.days ?? [];
    return aggregateDays(zones);
  }, [zones, zoneFilter, filterValid]);

  return (
    <Screen scroll={false}>
      <ScreenHeader showBack backLabel="Inicio" title="Seguimiento de asistencia" subtitle={active ? versionLabel(active) : ''} />
      <View style={{ paddingHorizontal: spacing.xl }}>
        <VersionPicker />
        <View style={styles.segment}>
          {(['visual', 'detalle'] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.segBtn, mode === m && styles.segBtnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === m }}
            >
              <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m === 'visual' ? 'Visual' : 'Detalle'}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.scopeText}>{scopeText}</Text>
      </View>

      {scope.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Banner tone="warning" text="No tienes zonas asignadas en esta versión." />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {totals.sessions === 0 ? (
            <Banner tone="neutral" text="Aún no se ha registrado asistencia en estas zonas." />
          ) : null}

          {mode === 'visual' ? (
            <>
              <Card style={styles.hero}>
                <Donut value={totals.pct} />
                <View style={{ flex: 1, marginLeft: spacing.lg }}>
                  <Text style={styles.heroLabel}>Asistencia acumulada</Text>
                  <Text style={styles.heroLine}>{totals.students} niños inscritos</Text>
                  <Text style={styles.heroLine}>
                    {totals.sessions} {totals.sessions === 1 ? 'día registrado' : 'días registrados'}
                  </Text>
                  <Text style={styles.heroLine}>
                    Último día: {totals.lastDayPct == null ? '—' : `${totals.lastDayPct}%`}
                  </Text>
                </View>
              </Card>

              <Text style={styles.sectionTitle}>Asistencia por día</Text>
              {scope.length > 1 ? (
                <View style={{ marginBottom: spacing.md }}>
                  <Select
                    label="Zona"
                    value={filterValid ? zoneFilter : ALL}
                    onChange={setZoneFilter}
                    options={[{ value: ALL, label: 'Todas las zonas' }, ...scope.map((z) => ({ value: z, label: zoneName(z) }))]}
                  />
                </View>
              ) : null}
              {barsDays.length === 0 ? (
                <Text style={styles.muted}>Sin días registrados.</Text>
              ) : (
                <DayBars data={barsDays.map((d) => ({ key: d.dayKey, label: shortDate(d.dateIso), pct: d.pct }))} />
              )}

              <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Asistencia por zona</Text>
              {zones.map((z) => (
                <HBarRow
                  key={z.zoneId}
                  name={zoneName(z.zoneId)}
                  sub={`${z.students} niños · ${z.days.length} ${z.days.length === 1 ? 'día' : 'días'}`}
                  pct={z.pct}
                />
              ))}
              <Text style={styles.legend}>
                Verde ≥ 80% · ámbar 60–79% · rojo &lt; 60%. % = presentes sobre niños evaluados.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.table}>
                <View style={[styles.tr, styles.thRow]}>
                  <Text style={[styles.cellZone, styles.th]}>Zona</Text>
                  <Text style={[styles.cellNum, styles.th]}>Niños</Text>
                  <Text style={[styles.cellNum, styles.th]}>Días</Text>
                  <Text style={[styles.cellPct, styles.th]}>%</Text>
                </View>
                {zones.map((z) => (
                  <View key={z.zoneId} style={styles.tr}>
                    <Text style={styles.cellZone} numberOfLines={2}>{zoneName(z.zoneId)}</Text>
                    <Text style={styles.cellNum}>{z.students}</Text>
                    <Text style={styles.cellNum}>{z.days.length}</Text>
                    <View style={styles.cellPct}><PctBadge pct={z.pct} /></View>
                  </View>
                ))}
                <View style={[styles.tr, styles.totalRow]}>
                  <Text style={[styles.cellZone, styles.totalText]}>Total</Text>
                  <Text style={[styles.cellNum, styles.totalText]}>{totals.students}</Text>
                  <Text style={[styles.cellNum, styles.totalText]}>{totals.sessions}</Text>
                  <View style={styles.cellPct}><PctBadge pct={totals.pct} /></View>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Día a día</Text>
              {zones.map((z) => (
                <DaySection
                  key={z.zoneId}
                  title={zoneName(z.zoneId)}
                  students={z.students}
                  days={z.days}
                  pct={z.pct}
                  defaultOpen={zones.length === 1}
                />
              ))}
              {zones.length > 1 ? (
                <DaySection
                  title="Total (todas las zonas)"
                  students={totals.students}
                  days={aggregateDays(zones)}
                  pct={totals.pct}
                  defaultOpen={false}
                />
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function DaySection({
  title,
  students,
  days,
  pct,
  defaultOpen,
}: {
  title: string;
  students: number;
  days: DayStat[];
  pct: number | null;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.sectionHead} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionName}>{title}</Text>
          <Text style={styles.sectionSub}>{students} niños · {days.length} {days.length === 1 ? 'día' : 'días'}</Text>
        </View>
        <PctBadge pct={pct} />
        <Text style={styles.chev}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open ? (
        days.length === 0 ? (
          <Text style={[styles.muted, { padding: spacing.md }]}>Sin días registrados.</Text>
        ) : (
          <View>
            <View style={[styles.tr, styles.thRow]}>
              <Text style={[styles.cellZone, styles.th]}>Día</Text>
              <Text style={[styles.cellNum, styles.th]}>Pres.</Text>
              <Text style={[styles.cellNum, styles.th]}>Eval.</Text>
              <Text style={[styles.cellPct, styles.th]}>%</Text>
            </View>
            {days.map((d) => (
              <View key={d.dayKey} style={styles.tr}>
                <Text style={styles.cellZone}>{formatDate(d.dateIso)}</Text>
                <Text style={styles.cellNum}>{d.present}</Text>
                <Text style={styles.cellNum}>{d.total}</Text>
                <View style={styles.cellPct}><PctBadge pct={d.pct} /></View>
              </View>
            ))}
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    marginTop: spacing.md,
  },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md - 2 },
  segBtnActive: { backgroundColor: colors.primary },
  segText: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textSecondary },
  segTextActive: { color: '#FFFFFF' },
  scopeText: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: spacing.sm },
  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  heroLabel: { fontFamily: fonts.semibold, fontSize: fontSize.body, color: colors.textPrimary, marginBottom: spacing.xs },
  heroLine: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: fontSize.body, color: colors.primaryDark, marginBottom: spacing.md },
  muted: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted },
  legend: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },
  table: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  thRow: { backgroundColor: colors.surface },
  th: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary },
  cellZone: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textPrimary, paddingRight: spacing.sm },
  cellNum: { width: 46, textAlign: 'center', fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textPrimary },
  cellPct: { width: 64, alignItems: 'center' },
  totalRow: { backgroundColor: colors.primaryBg, borderBottomWidth: 0 },
  totalText: { fontFamily: fonts.semibold },
  section: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface },
  sectionName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  sectionSub: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 1 },
  chev: { fontSize: 16, color: colors.textSecondary, marginLeft: spacing.sm },
});
