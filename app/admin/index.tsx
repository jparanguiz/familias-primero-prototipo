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

      <Text style={styles.sectionLabel}>Gestión</Text>
      <Tile title="Versiones del programa" description={`${versions.length} creadas`} onPress={() => router.push('/admin/versiones')} />
      <Tile title="Zonas (instituciones)" description={`${zones.length} registradas`} onPress={() => router.push('/admin/zonas')} />
      <Tile title="Usuarios del equipo" description={`${users.length} (tutores y coordinadores)`} onPress={() => router.push('/admin/usuarios')} />

      <Text style={styles.sectionLabel}>Programa</Text>
      <Tile title="Inscritos por versión" description="Ver todas las zonas" onPress={() => router.push('/inscritos')} />
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
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
});
