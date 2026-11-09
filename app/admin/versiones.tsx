import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { useActiveOrgId } from '@/store/useScope';
import { Season } from '@/domain/types';
import { versionLabel } from '@/domain/retention';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const SEASONS: Season[] = ['Verano', 'Invierno'];

export default function AdminVersiones() {
  const router = useRouter();
  const { createVersion, versionsInOrg, zonesInVersion, listStudents } = useAppStore();
  const orgId = useActiveOrgId();
  const [season, setSeason] = useState<Season>('Verano');
  const [year, setYear] = useState(String(new Date().getFullYear() + 1));
  const [msg, setMsg] = useState<string | null>(null);
  const [dup, setDup] = useState(false);

  const versions = orgId ? versionsInOrg(orgId) : [];
  const yearNum = parseInt(year, 10);
  const exists = versions.some((v) => v.season === season && v.year === yearNum);
  const canCreate = !Number.isNaN(yearNum) && yearNum > 2024 && !!orgId && !exists;

  const handleCreate = () => {
    if (!canCreate || !orgId) {
      setMsg('Ingresa un año válido.');
      return;
    }
    const v = createVersion(orgId, season, yearNum);
    if ('error' in v) {
      setMsg(v.error);
      setDup(true);
      return;
    }
    setDup(false);
    setMsg(`Versión creada: ${versionLabel(v)}. Ahora agrega sus zonas.`);
  };

  return (
    <Screen footer={<Button label="Crear versión" onPress={handleCreate} disabled={!canCreate} />}>
      <ScreenHeader showBack backLabel="Inicio" title="Versiones del programa" subtitle="Convocatorias por temporada" />

      <Text style={styles.sectionLabel}>Nueva versión</Text>
      <Text style={styles.fieldLabel}>Temporada</Text>
      <View style={styles.seasonRow}>
        {SEASONS.map((s) => {
          const active = season === s;
          return (
            <Pressable key={s} onPress={() => setSeason(s)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>
      {exists ? <Banner tone="warning" text={`Ya existe ${season} ${yearNum}. Solo se puede crear una vez; gestiona sus zonas abajo.`} /> : null}
      <Field label="Año" value={year} onChangeText={setYear} keyboardType="number-pad" placeholder="2027" />

      {msg ? <Banner tone={dup ? 'warning' : 'success'} text={msg} /> : null}

      <Text style={styles.sectionLabel}>Existentes</Text>
      {versions.map((v) => {
        const zoneCount = zonesInVersion(v.id).length;
        const kids = listStudents({ versionId: v.id }).length;
        return (
          <Pressable key={v.id} style={styles.card} onPress={() => router.push({ pathname: '/admin/zonas', params: { versionId: v.id } })}>
            <View style={styles.cardTop}>
              <Text style={styles.vTitle}>{versionLabel(v)}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
            <Text style={styles.vMeta}>{zoneCount} zonas · {kids} niños</Text>
            <Text style={styles.vLink}>Gestionar zonas y fechas</Text>
          </Pressable>
        );
      })}
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
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldLabel: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  seasonRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.regular, fontSize: fontSize.small, color: colors.textPrimary },
  chipTextActive: { color: colors.textOnDark },
  card: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vTitle: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  chevron: { fontSize: 24, color: colors.textMuted },
  vMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  vLink: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.blue, marginTop: spacing.sm },
});
