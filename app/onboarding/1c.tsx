import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Banner } from '@/components/Banner';
import { SignaturePad } from '@/components/SignaturePad';
import { useAppStore } from '@/store/AppStore';
import { useConsentFlow } from '@/store/ConsentFlow';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function Firma1c() {
  const router = useRouter();
  const { signConsent } = useAppStore();
  const {
    studentId,
    run,
    fullName,
    relationship,
    signaturePng,
    declarationAccepted,
    setSignature,
    setDeclaration,
  } = useConsentFlow();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasSignature = signaturePng.trim().length > 0;

  const handleSubmit = () => {
    if (!hasSignature) {
      setError('Dibuja tu firma antes de enviar.');
      return;
    }
    if (!declarationAccepted) {
      setError('Acepta la declaración para continuar.');
      return;
    }
    if (!studentId) {
      setError('Falta seleccionar al alumno.');
      return;
    }
    setError(null);
    setSubmitting(true);
    signConsent({
      studentId,
      guardian: { run, fullName, relationship, verified: true },
      signaturePng,
    });
    router.replace('/onboarding/1d');
  };

  return (
    <Screen
      footer={
        <Button label="Firmar y enviar" onPress={handleSubmit} loading={submitting} />
      }
    >
      <ScreenHeader
        showBack
        title="Firmar consentimiento"
        subtitle={`Firmas como ${fullName || '—'} · ${run || '—'}`}
        step="Consentimiento 3/4"
      />

      <SignaturePad onChange={setSignature} />

      <Pressable
        style={styles.checkRow}
        onPress={() => setDeclaration(!declarationAccepted)}
      >
        <View style={[styles.checkbox, declarationAccepted && styles.checkboxOn]}>
          {declarationAccepted ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.declaration}>
          Declaro ser tutor legal del alumno y autorizo el uso de su foto para
          registrar su asistencia
        </Text>
      </Pressable>

      {error ? (
        <Banner tone="error" text={error} />
      ) : (
        <Banner tone="success" text="Consentimiento listo para firmar" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm / 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  check: {
    color: colors.textOnDark,
    fontSize: 13,
    fontFamily: fonts.semibold,
    lineHeight: 16,
  },
  declaration: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.small,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
