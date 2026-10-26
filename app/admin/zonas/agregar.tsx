import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { Tile } from '@/components/Tile';
import { useAppStore } from '@/store/AppStore';
import { useActiveOrgId } from '@/store/useScope';
import { suggestedEndDate, versionLabel } from '@/domain/retention';
import { colors, fonts, fontSize, spacing } from '@/theme';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function AgregarZona() {
  const params = useLocalSearchParams<{ versionId?: string }>();
  const router = useRouter();
  const { getVersion, zonesInOrg, zonesInVersion, attachZoneToVersion } = useAppStore();
  const orgId = useActiveOrgId();

  const versionId = params.versionId ? String(params.versionId) : null;
  const version = versionId ? getVersion(versionId) : undefined;

  const allZones = orgId ? zonesInOrg(orgId) : [];
  const participatingIds = new Set(versionId ? zonesInVersion(versionId).map((z) => z.id) : []);
  const availableToAdd = allZones
    .filter((z) => !participatingIds.has(z.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const [addZoneId, setAddZoneId] = useState<string | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const onStartChange = (v: string) => {
    setStart(v);
    if (DATE_RE.test(v) && !end) setEnd(suggestedEndDate(v));
  };

  const canAttach = Boolean(versionId && addZoneId && DATE_RE.test(start) && DATE_RE.test(end));
  const handleAttach = () => {
    if (!canAttach || !versionId || !addZoneId) return;
    attachZoneToVersion(versionId, addZoneId, start, end);
    router.back();
  };

  return (
    <Screen>
      <ScreenHeader
        showBack
        backLabel="Zonas"
        title="Agregar zona"
        subtitle={version ? versionLabel(version) : undefined}
      />

      <Text style={styles.sectionLabel}>Crear una zona nueva</Text>
      <Tile
        title="Crear una zona nueva"
        description="Registra una institución nueva (o cárgalas en masa) en el catálogo"
        onPress={() => router.push({ pathname: '/admin/zonas/crear', params: versionId ? { versionId } : {} })}
      />

      <Text style={styles.sectionLabel}>Sumar una zona existente</Text>
      {availableToAdd.length === 0 ? (
        <Banner tone="neutral" text="No hay zonas del catálogo disponibles para sumar. Crea una nueva." />
      ) : (
        <>
          <Select
            label="Zona del catálogo"
            placeholder="Busca y elige una zona"
            value={addZoneId}
            onChange={setAddZoneId}
            options={availableToAdd.map((z) => ({ value: z.id, label: z.name, sublabel: `${z.kind} · ${z.address}` }))}
          />
          <Field label="Fecha de inicio (AAAA-MM-DD)" value={start} onChangeText={onStartChange} placeholder="2027-01-11" autoCapitalize="none" />
          <Field label="Fecha de fin (sugerida: 10 días hábiles)" value={end} onChangeText={setEnd} placeholder="2027-01-22" autoCapitalize="none" />
          {msg ? <Banner tone="error" text={msg} /> : null}
          <Button label="Sumar a la versión" onPress={handleAttach} disabled={!canAttach} />
        </>
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
});
