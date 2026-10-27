import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { RoleHeader } from '@/components/RoleHeader';
import { VersionPicker, useActiveVersion } from '@/components/VersionPicker';
import { Tile } from '@/components/Tile';
import { Card } from '@/components/Card';
import { useAppStore } from '@/store/AppStore';
import { useActiveOrgId } from '@/store/useScope';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function AdminHome() {
  const router = useRouter();
  const { listStudents, versionsInOrg, zonesInOrg, usersInOrg } = useAppStore();
  const { activeVersionId } = useActiveVersion();
  const orgId = useActiveOrgId();

  const versions = orgId ? versionsInOrg(orgId) : [];
  const zones = orgId ? zonesInOrg(orgId) : [];
  const users = orgId ? usersInOrg(orgId) : [];

  const inVersion = activeVersionId ? listStudents({ versionId: activeVersionId }) : [];
  const enrolled = inVersion.filter((v) => v.isEnrolled).length;

  return (
    <Screen>
      <RoleHeader />
      <VersionPicker />

      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Summary value={versions.length} label="Versiones" />
          <Summary value={zones.length} label="Zonas" />
          <Summary value={inVersion.length} label="Niños (versión)" />
          <Summary value={enrolled} label="Con foto" />
        </View>
      </Card>

      <Text style={[styles.sectionLabel, styles.sectionTeal]}>Gestión</Text>
      <Tile tone="teal" title="Versiones del programa" description={`${versions.length} creadas`} onPress={() => router.push('/admin/versiones')} />
      <Tile tone="teal" title="Zonas (instituciones)" description={`${zones.length} registradas`} onPress={() => router.push('/admin/zonas')} />
      <Tile tone="teal" title="Usuarios del equipo" description={`${users.length} (tutores y coordinadores)`} onPress={() => router.push('/admin/usuarios')} />

      <Text style={[styles.sectionLabel, styles.sectionViolet]}>Programa</Text>
      <Tile tone="violet" title="Inscritos por versión" description="Ver todas las zonas" onPress={() => router.push('/inscritos')} />
      <Tile tone="violet" title="Monitoreo de asistencia" description="Acumulada + exportar CSV" onPress={() => router.push('/monitoreo')} />
    </Screen>
  );
}

function Summary({ value, label }: { value: number; label: string }) {
  // Números con dato en teal; los que están en cero, en gris apagado.
  const hasData = value > 0;
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color: hasData ? colors.primary : colors.border }]}>{value}</Text>
      <Text style={[styles.summaryItemLabel, !hasData && { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: spacing.md, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontFamily: fonts.semibold, fontSize: 22, color: colors.textPrimary },
  summaryItemLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTeal: { color: colors.primary },
  sectionViolet: { color: colors.violet },
});
