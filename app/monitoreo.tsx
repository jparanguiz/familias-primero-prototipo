import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { VersionPicker, useActiveVersion } from '@/components/VersionPicker';
import { Card } from '@/components/Card';
import { Donut, HBarRow } from '@/components/charts';
import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';
import { buildZoneStat, computeTotals } from '@/domain/attendanceStats';
import { useVisibleZoneIds } from '@/store/useScope';
import { buildMonitorMatrix, DayCellStatus, MonitorMatrix } from '@/domain/monitor';
import { buildCsv, exportCsv } from '@/domain/csv';
import { versionLabel } from '@/domain/retention';
import { formatDate } from '@/domain/format';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const CELL: Record<DayCellStatus, { short: string; color: string; bg: string }> = {
  presente: { short: 'P', color: colors.green, bg: colors.greenBg },
  ausente: { short: 'A', color: colors.red, bg: colors.redBg },
  'no-enrolado': { short: '–', color: colors.textMuted, bg: colors.surface },
  'sin-registro': { short: '·', color: colors.textMuted, bg: colors.surface },
};

export default function Monitoreo() {
  const { listStudents, listAttendance, getZone } = useAppStore();
  const { session } = useSession();
  const isAdmin = session?.role === 'admin' || session?.role === 'superusuario';
  // Admin: abre en Resumen (agrupado). Resto: directo al detalle por niño.
  const [view, setView] = useState<'resumen' | 'ninos'>(isAdmin ? 'resumen' : 'ninos');
  const { active } = useActiveVersion();
  const scope = useVisibleZoneIds(active?.id ?? null);

  // Zonas seleccionadas para ver (por defecto, todas las del alcance).
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    setSelected(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.join(','), active?.id]);

  const zonesToShow = selected.length ? selected : scope;

  // Una matriz por zona (vista agrupada) + una matriz combinada para totales.
  const perZone = useMemo(() => {
    if (!active) return [] as { zoneId: string; matrix: MonitorMatrix }[];
    return zonesToShow.map((zoneId) => {
      const students = listStudents({ versionId: active.id, zoneIds: [zoneId] }).map((v) => v.student);
      const records = listAttendance({ versionId: active.id, zoneIds: [zoneId] });
      return { zoneId, matrix: buildMonitorMatrix(students, records) };
    });
  }, [active, zonesToShow, listStudents, listAttendance]);

  // Zonas abiertas (detalle por niño). Con varias zonas parten colapsadas: solo resumen por zona.
  const [open, setOpen] = useState<string[]>([]);
  useEffect(() => {
    setOpen(scope.length === 1 ? scope : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.join(','), active?.id]);
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const allOpen = perZone.length > 0 && perZone.every((p) => open.includes(p.zoneId));

  const zoneStats = useMemo(() => {
    if (!active) return [];
    return scope.map((zoneId) => {
      const list = listStudents({ versionId: active.id, zoneIds: [zoneId] });
      const records = listAttendance({ versionId: active.id, zoneIds: [zoneId] });
      return buildZoneStat(zoneId, list.length, records, list.map((v) => v.student.run));
    });
  }, [active, scope.join(','), listStudents, listAttendance]); // eslint-disable-line react-hooks/exhaustive-deps
  const totals = useMemo(() => computeTotals(zoneStats), [zoneStats]);

  const hasData = perZone.some((p) => p.matrix.rows.length > 0);

  const handleExport = async () => {
    if (!active) return;
    const headerDays = Array.from(
      new Set(perZone.flatMap((p) => p.matrix.days.map((d) => d.label)))
    );
    const headers = ['Zona', 'Niño', 'Canal', 'Inscrito', ...headerDays, 'Presentes', 'Sesiones', '% Asistencia'];
    const rows: (string | number)[][] = [];
    perZone.forEach(({ zoneId, matrix }) => {
      const zoneName = getZone(zoneId)?.name ?? zoneId;
      matrix.rows.forEach((r) => {
        const pct = r.totalSessions > 0 ? Math.round((r.presentCount / r.totalSessions) * 100) : 0;
        const dayCells = headerDays.map((label) => {
          const day = matrix.days.find((d) => d.label === label);
          if (!day) return '';
          const c = r.cells[day.dateIso];
          return c === 'presente' ? 'Presente' : c === 'ausente' ? 'Ausente' : c === 'no-enrolado' ? 'No enrolado' : 'Sin registro';
        });
        rows.push([
          zoneName,
          r.student.name,
          r.student.enrollmentChannel === 'tutor' ? 'Tutor' : 'Apoderado',
          formatDate(r.student.enrolledAt),
          ...dayCells,
          r.presentCount,
          r.totalSessions,
          `${pct}%`,
        ]);
      });
    });
    const csv = buildCsv(headers, rows);
    await exportCsv(`asistencia_${active ? versionLabel(active).replace(' ', '_') : 'programa'}.csv`, csv);
  };

  return (
    <Screen scroll={false} footer={<Button label="Exportar asistencia (CSV)" onPress={handleExport} disabled={!hasData} />}>
      <ScreenHeader showBack backLabel="Inicio" title="Monitoreo de asistencia" subtitle={active ? versionLabel(active) : ''} />
      <View style={{ paddingHorizontal: spacing.xl }}>
        <VersionPicker />
        {isAdmin ? (
          <View style={styles.segment}>
            {([['resumen', 'Resumen'], ['ninos', 'Por niño']] as const).map(([k, label]) => (
              <Pressable key={k} onPress={() => setView(k)} style={[styles.segBtn, view === k && styles.segBtnActive]} accessibilityRole="button" accessibilityState={{ selected: view === k }}>
                <Text style={[styles.segText, view === k && styles.segTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {!isAdmin && scope.length > 1 ? (
          <View style={{ marginTop: spacing.md }}>
            <Select
              label="Zonas a monitorear"
              multiple
              value={selected}
              onChange={setSelected}
              options={scope.map((z) => ({ value: z, label: getZone(z)?.name ?? z }))}
            />
          </View>
        ) : null}
      </View>

      {scope.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Banner tone="warning" text="No tienes zonas asignadas en esta versión." />
        </View>
      ) : isAdmin && view === 'resumen' ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg }}>
          <Card style={styles.hero}>
            <Donut value={totals.pct} />
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <Text style={styles.heroBig}>{totals.uniqueStudents}</Text>
              <Text style={styles.heroLine}>niños inscritos (RUN único)</Text>
              <Text style={styles.heroLine}>
                {scope.length} {scope.length === 1 ? 'zona' : 'zonas'} · {totals.sessions} {totals.sessions === 1 ? 'día' : 'días'}
              </Text>
            </View>
          </Card>
          <Text style={styles.summaryTitle}>% de asistencia por zona</Text>
          {zoneStats.map((z) => (
            <HBarRow key={z.zoneId} name={getZone(z.zoneId)?.name ?? z.zoneId} sub={`${z.students} niños · ${z.days.length} ${z.days.length === 1 ? 'día' : 'días'}`} pct={z.pct} />
          ))}
          <View style={styles.totalBox}>
            <HBarRow name="Total todas las zonas" sub={`${totals.uniqueStudents} niños únicos · ${totals.sessions} ${totals.sessions === 1 ? 'día' : 'días'}`} pct={totals.pct} />
          </View>
          <Text style={styles.legend}>Verde ≥ 80% · ámbar 60–79% · rojo &lt; 60%. Para el detalle de cada niño, usa “Por niño”.</Text>
        </ScrollView>
      ) : !hasData ? (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Banner tone="neutral" text="Aún no se ha registrado asistencia en las zonas seleccionadas." />
        </View>
      ) : (
        <ScrollView style={{ marginTop: spacing.sm }} contentContainerStyle={{ paddingBottom: spacing.lg }}>
          {perZone.length > 1 ? (
            <Pressable
              onPress={() => setOpen(allOpen ? [] : perZone.map((p) => p.zoneId))}
              style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}
              accessibilityRole="button"
            >
              <Text style={styles.toggleAll}>{allOpen ? 'Colapsar todo' : 'Expandir todo'}</Text>
            </Pressable>
          ) : null}
          {perZone.map(({ zoneId, matrix }) => (
            <ZoneBlock
              key={zoneId}
              title={getZone(zoneId)?.name ?? zoneId}
              matrix={matrix}
              open={open.includes(zoneId)}
              onToggle={() => toggle(zoneId)}
            />
          ))}
          <View style={{ paddingHorizontal: spacing.xl }}>
            <Text style={styles.legend}>P presente · A ausente · – no enrolado aún · · sin registro</Text>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function ZoneBlock({ title, matrix, open, onToggle }: { title: string; matrix: MonitorMatrix; open: boolean; onToggle: () => void }) {
  const totalPresent = matrix.rows.reduce((a, r) => a + r.presentCount, 0);
  const totalSessions = matrix.rows.reduce((a, r) => a + r.totalSessions, 0);
  const groupPct = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

  return (
    <View style={styles.zoneBlock}>
      <Pressable onPress={onToggle} style={styles.zoneHeader} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.zoneTitle}>{title}</Text>
          <Text style={styles.zoneAgg}>{matrix.rows.length} niños · {groupPct}% asistencia</Text>
        </View>
        <Text style={styles.chev}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {!open ? null : matrix.days.length === 0 ? (
        <Text style={styles.noSessions}>Sin sesiones registradas.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
          <View>
            <View style={styles.headerRow}>
              <Text style={[styles.nameCell, styles.headerText]}>Niño</Text>
              {matrix.days.map((d) => (
                <Text key={d.dateIso} style={[styles.dayCell, styles.headerText]}>{d.label.replace(/ \d{4}$/, '')}</Text>
              ))}
              <Text style={[styles.totalCell, styles.headerText]}>%</Text>
            </View>
            {matrix.rows.map((r) => {
              const pct = r.totalSessions > 0 ? Math.round((r.presentCount / r.totalSessions) * 100) : 0;
              return (
                <View key={r.student.id} style={styles.row}>
                  <Text style={styles.nameCell} numberOfLines={1}>{r.student.name}</Text>
                  {matrix.days.map((d) => {
                    const c = CELL[r.cells[d.dateIso]];
                    return (
                      <View key={d.dateIso} style={[styles.dayCell, styles.cellBox, { backgroundColor: c.bg }]}>
                        <Text style={[styles.cellText, { color: c.color }]}>{c.short}</Text>
                      </View>
                    );
                  })}
                  <Text style={styles.totalCell}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const COL_NAME = 120;
const COL_DAY = 42;
const COL_TOTAL = 48;

const styles = StyleSheet.create({
  zoneBlock: { marginBottom: spacing.lg },
  zoneHeader: { paddingHorizontal: spacing.xl, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 3, marginTop: spacing.md },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md - 2 },
  segBtnActive: { backgroundColor: colors.primary },
  segText: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textSecondary },
  segTextActive: { color: '#FFFFFF' },
  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  heroBig: { fontFamily: fonts.semibold, fontSize: 32, color: colors.textPrimary },
  heroLine: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  summaryTitle: { fontFamily: fonts.semibold, fontSize: fontSize.body, color: colors.primaryDark, marginBottom: spacing.md },
  totalBox: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  chev: { fontSize: 16, color: colors.textSecondary },
  toggleAll: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.primaryDark },
  zoneTitle: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  zoneAgg: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  noSessions: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted, paddingHorizontal: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerText: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 11 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  nameCell: { width: COL_NAME, fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textPrimary, paddingRight: spacing.sm },
  dayCell: { width: COL_DAY, textAlign: 'center' },
  cellBox: { height: 26, borderRadius: radius.sm / 2, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 },
  cellText: { fontFamily: fonts.semibold, fontSize: 12 },
  totalCell: { width: COL_TOTAL, textAlign: 'center', fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.textPrimary },
  legend: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: spacing.md },
});
