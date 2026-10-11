import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useConsentFlow } from '@/store/ConsentFlow';
import { Relationship } from '@/domain/types';
import { formatRun, isValidRun } from '@/domain/run';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const RELATIONSHIPS: Relationship[] = ['Madre', 'Padre', 'Tutor legal'];

export default function TutorLegal1b() {
  const router = useRouter();
  const { run, fullName, relationship, setGuardian } = useConsentFlow();

  const [runText, setRunText] = useState(run);
  const [name, setName] = useState(fullName);
  const [rel, setRel] = useState<Relationship>(relationship);
  const [frontTaken, setFrontTaken] = useState(false);
  const [backTaken, setBackTaken] = useState(false);
  const [touched, setTouched] = useState(false);

  const runValid = useMemo(() => isValidRun(runText), [runText]);
  const nameValid = name.trim().length >= 3;
  const canContinue = runValid && nameValid;

  const runHint = !runText
    ? undefined
    : runValid
      ? 'RUN válido'
      : 'El RUN no es válido. Revisa el dígito verificador.';
  const runHintTone = runValid ? 'success' : 'error';

  const handleContinue = () => {
    setTouched(true);
    if (!canContinue) return;
    setGuardian({ run: formatRun(runText), fullName: name.trim(), relationship: rel });
    router.push('/onboarding/1c');
  };

  return (
    <Screen
      footer={<Button label="Continuar" onPress={handleContinue} disabled={!canContinue} />}
    >
      <ScreenHeader
        showBack
        title="Datos del tutor legal"
        subtitle="Identifica a quien firma"
        step="Consentimiento 2/4"
      />

      <Field
        label="RUN"
        value={runText}
        onChangeText={(t) => setRunText(formatRun(t))}
        placeholder="12.345.678-5"
        keyboardType="default"
        autoCapitalize="characters"
        hint={touched && !runText ? 'Ingresa tu RUN.' : runHint}
        hintTone={touched && !runText ? 'error' : runHintTone}
      />

      <Field
        label="Nombre completo"
        value={name}
        onChangeText={setName}
        placeholder="Ana Soto Pérez"
        autoCapitalize="words"
        hint={touched && !nameValid ? 'Ingresa el nombre completo.' : undefined}
        hintTone="error"
      />

      <Text style={styles.label}>Vínculo con el alumno</Text>
      <View style={styles.relRow}>
        {RELATIONSHIPS.map((r) => {
          const active = rel === r;
          return (
            <Pressable
              key={r}
              onPress={() => setRel(r)}
              style={[styles.relChip, active && styles.relChipActive]}
            >
              <Text style={[styles.relText, active && styles.relTextActive]}>{r}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Cédula de identidad</Text>
      <View style={styles.cedulaRow}>
        <CedulaBox
          caption={frontTaken ? 'Frente ✓' : 'Foto frente'}
          taken={frontTaken}
          onPress={() => setFrontTaken((v) => !v)}
        />
        <CedulaBox
          caption={backTaken ? 'Reverso ✓' : 'Foto reverso'}
          taken={backTaken}
          onPress={() => setBackTaken((v) => !v)}
        />
      </View>

      <Text style={styles.note}>
        Guardamos el RUN y el resultado de la verificación, no las imágenes de la
        cédula.
      </Text>
    </Screen>
  );
}

function CedulaBox({
  caption,
  taken,
  onPress,
}: {
  caption: string;
  taken: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.cedulaBox, taken && styles.cedulaBoxTaken]}
    >
      <Text style={[styles.cedulaText, taken && styles.cedulaTextTaken]}>
        {caption}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  relRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  relChip: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  relText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.small,
    color: colors.textPrimary,
  },
  relTextActive: { color: colors.textOnDark },
  cedulaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cedulaBox: {
    flex: 1,
    height: 100,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cedulaBoxTaken: {
    backgroundColor: colors.greenBg,
    borderColor: colors.green,
    borderStyle: 'solid',
  },
  cedulaText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  cedulaTextTaken: { color: colors.green },
  note: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
