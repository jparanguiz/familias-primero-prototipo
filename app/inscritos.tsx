import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Banner } from '@/components/Banner';
import { VersionPicker, useActiveVersion } from '@/components/VersionPicker';
import { useAppStore } from '@/store/AppStore';
import { useVisibleZoneIds } from '@/store/useScope';
import { formatDate } from '@/domain/format';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function Inscritos() {
  const router = useRouter();
  const { listStudents, revokeConsent } = useAppStore();
  const { active } = useActiveVersion();
  const scope = useVisibleZoneIds(active?.id ?? null);
  const [filter, setFilter] = useState<'todos' | 'conFoto' | 'pendientes'>('todos');

  const views = active ? listStudents({ versionId: active.id, zoneIds: scope }) : [];
  const filtered = views.filter((v) => {
    if (filter === 'conFoto') return v.isEnrolled;
    if (filter === 'pendientes') return !v.isEnrolled;
    return true;
  });

  const confirmRevoke = (studentId: string, name: string) => {
    const doRevoke = () => revokeConsent(studentId);
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`¿Revocar el consentimiento de ${name}? Saldrá de la inscripción y se borrará su foto.`)) {
        doRevoke();
      }
      return;
    }
    Alert.alert(
      'Revocar consentimiento',
      `${name} saldrá de la inscripción y se borrará su foto. La asistencia ya confirmada se conserva.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Revocar', style: 'destructive', onPress: doRevoke },
      ]
    );
  };

  return (
    <Screen>
      <ScreenHeader showBack backLabel="Inicio" title="Inscritos" subtitle="Según tu zona y jerarquía" />
      <VersionPicker />

      <View style={styles.filterRow}>
        {(['todos', 'conFoto', 'pendientes'] as const).map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterChip, filter === f && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'conFoto' ? 'Con foto' : f[0].toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {scope.length === 0 ? (
        <Banner tone="warning" text="No tienes zonas asignadas en esta versión." />
      ) : filtered.length === 0 ? (
        <Banner tone="neutral" text="No hay niños en este filtro." />
      ) : null}

      {filtered.map((v) => (
        <View key={v.student.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.name}>{v.student.name}</Text>
            {v.isEnrolled ? (
              <Text style={[styles.pill, styles.pillGreen]}>Con foto</Text>
            ) : v.hasActiveConsent ? (
              <Text style={[styles.pill, styles.pillBlue]}>Consentido</Text>
            ) : (
              <Text style={[styles.pill, styles.pillMuted]}>Pendiente</Text>
            )}
          </View>

          <Text style={styles.meta}>
            {v.zone?.name ?? 'Zona desconocida'} · inscrito {formatDate(v.student.enrolledAt)}
          </Text>
          <Text style={styles.meta}>
            {v.hasActiveConsent
              ? `Consentimiento vigente${v.consent ? ` · ${v.consent.guardian.fullName}` : ''}`
              : 'Sin consentimiento vigente'}
          </Text>

          {v.hasActiveConsent ? (
            <Pressable onPress={() => confirmRevoke(v.student.id, v.student.name)} style={{ marginTop: spacing.sm }}>
              <Text style={[styles.actionLink, { color: colors.red }]}>Revocar consentimiento</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.lg },
  filterChip: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textPrimary },
  filterTextActive: { color: colors.textOnDark },
  card: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  pill: {
    fontFamily: fonts.medium,
    fontSize: 11,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  pillGreen: { backgroundColor: colors.greenBg, color: colors.green },
  pillBlue: { backgroundColor: colors.blueBg, color: colors.blue },
  pillMuted: { backgroundColor: colors.surface, color: colors.textSecondary },
  meta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: spacing.xs },
  actionLink: { fontFamily: fonts.medium, fontSize: fontSize.small },
});
