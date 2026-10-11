import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { RoleHeader } from '@/components/RoleHeader';
import { VersionPicker, useActiveVersion } from '@/components/VersionPicker';
import { Tile } from '@/components/Tile';
import { Card } from '@/components/Card';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { useVisibleZoneIds } from '@/store/useScope';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function CoordinadorHome() {
  const router = useRouter();
  const { getZone, listStudents } = useAppStore();
  const { activeVersionId } = useActiveVersion();
  const myZones = useVisibleZoneIds(activeVersionId);

  const students =
    activeVersionId && myZones.length
      ? listStudents({ versionId: activeVersionId, zoneIds: myZones })
      : [];
  const enrolled = students.filter((s) => s.isEnrolled).length;

  return (
    <Screen>
      <RoleHeader />
      <VersionPicker />

      <Card style={styles.summary}>
        <Text style={styles.zonesTitle}>Zonas a cargo</Text>
        <Text style={styles.zonesList}>
          {myZones.length ? myZones.map((z) => getZone(z)?.name).filter(Boolean).join(', ') : 'Sin zonas asignadas'}
        </Text>
        <View style={styles.summaryRow}>
          <Summary value={myZones.length} label="Zonas" />
          <Summary value={students.length} label="Niños" />
          <Summary value={enrolled} label="Con foto" />
        </View>
      </Card>

      {myZones.length === 0 ? (
        <Banner tone="warning" text="No tienes zonas a cargo. Pídele al administrador que te asigne." />
      ) : null}

      <Text style={styles.sectionLabel}>Seguimiento</Text>
      <Tile title="Inscritos de mis zonas" onPress={() => router.push('/inscritos')} />
      <Tile title="Monitoreo de asistencia" description="Acumulada + exportar CSV" onPress={() => router.push('/monitoreo')} />
    </Screen>
  );
}

function Summary({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryItemLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: spacing.md, marginBottom: spacing.lg },
  zonesTitle: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary },
  zonesList: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, marginTop: 2, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontFamily: fonts.semibold, fontSize: 22, color: colors.textPrimary },
  summaryItemLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
});
