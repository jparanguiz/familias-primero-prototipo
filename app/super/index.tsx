import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { RoleHeader } from '@/components/RoleHeader';
import { Tile } from '@/components/Tile';
import { Card } from '@/components/Card';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { useActiveOrgId } from '@/store/useScope';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function SuperHome() {
  const router = useRouter();
  const { orgs, getOrg, versionsInOrg, zonesInOrg, usersInOrg } = useAppStore();
  const orgId = useActiveOrgId();
  const org = orgId ? getOrg(orgId) : undefined;

  const activas = orgs.filter((o) => o.license.status === 'activa').length;

  return (
    <Screen>
      <RoleHeader />

      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Summary value={orgs.length} label="Organizaciones" />
          <Summary value={activas} label="Licencias activas" />
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Gestión global</Text>
      <Tile title="Organizaciones y licencias" description={`${orgs.length} registradas`} onPress={() => router.push('/super/organizaciones')} />

      <Text style={styles.sectionLabel}>Operar dentro de una organización</Text>
      {org ? (
        <Banner
          tone="info"
          text={`Estás operando como ${org.name}. Usa el selector de organización (arriba) para cambiar.`}
        />
      ) : (
        <Banner tone="warning" text="Elige una organización activa en el selector de arriba." />
      )}

      {org ? (
        <>
          <Card style={styles.summary}>
            <Text style={styles.orgName}>{org.name}</Text>
            <View style={styles.summaryRow}>
              <Summary value={versionsInOrg(org.id).length} label="Versiones" />
              <Summary value={zonesInOrg(org.id).length} label="Zonas" />
              <Summary value={usersInOrg(org.id).length} label="Usuarios" />
            </View>
          </Card>
          <Tile title="Versiones del programa" onPress={() => router.push('/admin/versiones')} />
          <Tile title="Zonas (instituciones)" onPress={() => router.push('/admin/zonas')} />
          <Tile title="Usuarios del equipo" onPress={() => router.push('/admin/usuarios')} />
          <Tile title="Inscritos por versión" onPress={() => router.push('/inscritos')} />
          <Tile title="Monitoreo de asistencia" onPress={() => router.push('/monitoreo')} />
        </>
      ) : null}
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
  summaryItemLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  orgName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, marginBottom: spacing.md },
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
