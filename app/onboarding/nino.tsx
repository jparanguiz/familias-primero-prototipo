import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { PROXIMITY_LABEL, REGIONS, getRegion, suggestZones } from '@/domain/geo';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { useAppStore } from '@/store/AppStore';
import { useOnboarding } from '@/store/OnboardingFlow';
import { formatRun, isValidRun } from '@/domain/run';
import { versionLabel } from '@/domain/retention';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function OnboardingNino() {
  const router = useRouter();
  const { getVersion, getZone, zonesInVersion } = useAppStore();
  const { versionId, zoneId, child, channel, setChild, setZone } = useOnboarding();

  const [name, setName] = useState(child.name);
  const [birthDate, setBirthDate] = useState(child.birthDate);
  const [grade, setGrade] = useState(child.grade);
  const [run, setRun] = useState(child.run);
  const [regionId, setRegionId] = useState<string | null>(child.regionId || null);
  const [comuna, setComuna] = useState<string | null>(child.comuna || null);
  // Zona: si ya viene definida (tutor / QR) no se pregunta; si no, se sugiere según la comuna.
  const zoneFixed = channel === 'tutor' && Boolean(zoneId);
  const [pickedZone, setPickedZone] = useState<string | null>(channel === 'apoderado' ? zoneId : null);
  const [showAll, setShowAll] = useState(false);
  const [touched, setTouched] = useState(false);

  const nameValid = name.trim().length >= 3;
  const birthValid = DATE_RE.test(birthDate.trim());
  const gradeValid = grade.trim().length >= 1;
  const runValid = useMemo(() => isValidRun(run), [run]);
  const locationValid = Boolean(regionId && comuna);
  const suggestions = useMemo(
    () =>
      !zoneFixed && versionId && regionId && comuna ? suggestZones(zonesInVersion(versionId), regionId, comuna) : [],
    [zoneFixed, versionId, regionId, comuna, zonesInVersion]
  );
  const zoneValid = zoneFixed || Boolean(pickedZone);
  const canContinue = nameValid && birthValid && gradeValid && runValid && locationValid && zoneValid;

  const version = versionId ? getVersion(versionId) : undefined;
  const zone = zoneId ? getZone(zoneId) : undefined;

  const handleContinue = () => {
    setTouched(true);
    if (!canContinue) return;
    setChild({
      name: name.trim(),
      birthDate: birthDate.trim(),
      grade: grade.trim(),
      run: formatRun(run),
      regionId: regionId!,
      comuna: comuna!,
    });
    if (!zoneFixed && pickedZone) setZone(pickedZone);
    router.push('/onboarding/foto');
  };

  return (
    <Screen footer={<Button label="Continuar" onPress={handleContinue} disabled={!canContinue} />}>
      <ScreenHeader showBack title="Datos del niño" subtitle="Todos los campos son obligatorios" step="Onboarding" />

      {version ? <Banner tone="neutral" text={zoneFixed && zone ? `${versionLabel(version)} · ${zone.name}` : versionLabel(version)} /> : null}

      <Field
        label="Nombre completo del niño/a"
        value={name}
        onChangeText={setName}
        placeholder="Martina Soto"
        autoCapitalize="words"
        hint={touched && !nameValid ? 'Ingresa el nombre completo.' : undefined}
        hintTone="error"
      />
      <Field
        label="Fecha de nacimiento (AAAA-MM-DD)"
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="2018-05-14"
        autoCapitalize="none"
        hint={touched && !birthValid ? 'Usa el formato AAAA-MM-DD.' : undefined}
        hintTone="error"
      />
      <Field
        label="Curso / nivel"
        value={grade}
        onChangeText={setGrade}
        placeholder="3° básico A"
        autoCapitalize="words"
        hint={touched && !gradeValid ? 'Ingresa el curso o nivel.' : undefined}
        hintTone="error"
      />
      <Field
        label="RUN del niño/a"
        value={run}
        onChangeText={(t) => setRun(formatRun(t))}
        placeholder="22.333.444-5"
        autoCapitalize="characters"
        hint={
          !run
            ? touched
              ? 'Ingresa el RUN del niño.'
              : undefined
            : runValid
              ? 'RUN válido'
              : 'El RUN no es válido. Revisa el dígito verificador.'
        }
        hintTone={run && runValid ? 'success' : 'error'}
      />
      <Select
        label="Región donde vive el niño/a"
        placeholder="Elige una región"
        value={regionId}
        onChange={(v) => { setRegionId(v); setComuna(null); setPickedZone(null); }}
        options={REGIONS.map((r) => ({ value: r.id, label: r.name }))}
      />
      {regionId ? (
        <Select
          label="Comuna"
          placeholder="Elige una comuna"
          value={comuna}
          onChange={(v) => { setComuna(v); setPickedZone(null); }}
          options={(getRegion(regionId)?.comunas ?? []).map((c) => ({ value: c, label: c }))}
        />
      ) : null}
      {!zoneFixed && locationValid ? (
        suggestions.length === 0 ? (
          <Banner tone="warning" text="Esta versión aún no tiene colegios o zonas disponibles." />
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            <Text style={styles.suggestTitle}>Colegios o zonas sugeridos cerca de {comuna}</Text>
            {(showAll ? suggestions : suggestions.slice(0, 4)).map(({ zone, proximity }) => {
              const selected = pickedZone === zone.id;
              return (
                <Pressable
                  key={zone.id}
                  onPress={() => setPickedZone(zone.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.zoneCard, selected && styles.zoneCardSelected]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <Text style={styles.zoneMeta}>
                      {zone.kind} · {zone.comuna ? `${zone.comuna}, ` : ''}{zone.address}
                    </Text>
                    <Text style={[styles.zoneProx, proximity === 'comuna' && { color: colors.primaryDark }]}>
                      {PROXIMITY_LABEL[proximity]}
                    </Text>
                  </View>
                  <Text style={styles.zoneCheck}>{selected ? '●' : '○'}</Text>
                </Pressable>
              );
            })}
            {suggestions.length > 4 ? (
              <Pressable onPress={() => setShowAll((v) => !v)} accessibilityRole="button">
                <Text style={styles.moreLink}>{showAll ? 'Ver menos' : `Ver todas (${suggestions.length})`}</Text>
              </Pressable>
            ) : null}
            {touched && !pickedZone ? <Text style={styles.zoneError}>Elige dónde participará el niño/a.</Text> : null}
          </View>
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  suggestTitle: { fontFamily: fonts.semibold, fontSize: fontSize.body, color: colors.primaryDark, marginBottom: spacing.sm },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  zoneCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  zoneName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  zoneMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  zoneProx: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  zoneCheck: { fontSize: 20, color: colors.primary, marginLeft: spacing.sm },
  moreLink: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.primaryDark, paddingVertical: spacing.sm },
  zoneError: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.red, marginTop: spacing.xs },
});
