import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { useActiveOrgId } from '@/store/useScope';
import { versionLabel } from '@/domain/retention';
import { formatDate, formatSignedAt } from '@/domain/format';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function AdminZonas() {
  const params = useLocalSearchParams<{ versionId?: string }>();
  const router = useRouter();
  const {
    getVersion,
    getZoneAssignment,
    zonesInVersion,
    versionsInOrg,
    detachZoneFromVersion,
    logZoneContact,
  } = useAppStore();
  const orgId = useActiveOrgId();

  const versions = orgId ? versionsInOrg(orgId) : [];
  const [versionId, setVersionId] = useState<string | null>(
    params.versionId ? String(params.versionId) : versions[0]?.id ?? null
  );
  const [msg, setMsg] = useState<string | null>(null);

  const version = versionId ? getVersion(versionId) : undefined;
  const participating = versionId
    ? [...zonesInVersion(versionId)].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    : [];

  const confirmDetach = (zoneId: string, zoneName: string) => {
    if (!versionId) return;
    const doIt = () => { detachZoneFromVersion(versionId, zoneId); setMsg(`${zoneName} quitada de la versión.`); };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`¿Quitar ${zoneName} de esta versión? Se quitarán también sus asignaciones de staff.`)) doIt();
      return;
    }
    Alert.alert('Quitar zona', `¿Quitar ${zoneName} de esta versión?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: doIt },
    ]);
  };

  return (
    <Screen
      footer={
        <Button
          label="Agregar zona"
          onPress={() => router.push({ pathname: '/admin/zonas/agregar', params: versionId ? { versionId } : {} })}
          disabled={!versionId}
        />
      }
    >
      <ScreenHeader showBack backLabel="Inicio" title="Zonas de la versión" subtitle="Primero confirma la zona, luego convoca niños" />

      <Select
        label="Versión"
        placeholder="Elige una versión"
        value={versionId}
        onChange={setVersionId}
        options={versions.map((v) => ({ value: v.id, label: versionLabel(v) }))}
      />

      {msg ? <Banner tone="success" text={msg} /> : null}

      {version ? (
        <>
          <Text style={styles.sectionLabel}>Zonas en {versionLabel(version)} ({participating.length})</Text>
          {participating.length === 0 ? (
            <Banner tone="neutral" text="Aún no hay zonas en esta versión. Usa 'Agregar zona'." />
          ) : (
            participating.map((z) => {
              const a = getZoneAssignment(versionId!, z.id);
              return (
                <View key={z.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.zTitle}>{z.name}</Text>
                    <Pressable onPress={() => confirmDetach(z.id, z.name)}>
                      <Text style={styles.remove}>Quitar</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.zMeta}>{z.kind} · {z.address}</Text>
                  {a ? <Text style={styles.zDates}>Del {formatDate(a.startDate)} al {formatDate(a.endDate)}</Text> : null}
                  <Text style={styles.zContact}>
                    Contacto: {z.contact.name} ({z.contact.role}) · {z.contact.phone} · {z.contact.email}
                  </Text>
                  <Pressable onPress={() => { logZoneContact(z.id, 'Convocatoria de la versión', undefined); setMsg('Uso del contacto registrado.'); }}>
                    <Text style={styles.logLink}>Registrar uso del contacto</Text>
                  </Pressable>
                  {z.contactLog.length > 0 ? (
                    <Text style={styles.logMeta}>
                      Último uso: {formatSignedAt(z.contactLog[0].at)} · {z.contactLog[0].reason} ({z.contactLog.length} en total)
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}
        </>
      ) : (
        <Banner tone="warning" text="Crea o elige una versión para gestionar sus zonas." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zTitle: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  remove: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.red },
  zMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  zDates: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.blue, marginTop: spacing.xs },
  zContact: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: spacing.xs },
  logLink: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.blue, marginTop: spacing.sm },
  logMeta: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },
});
