import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, FakeStatusBar } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/AppStore';
import { useConsentFlow } from '@/store/ConsentFlow';
import { useOnboarding } from '@/store/OnboardingFlow';
import { formatSignedAt } from '@/domain/format';
import { versionLabel } from '@/domain/retention';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function Firmado1d() {
  const router = useRouter();
  const { studentId, fullName, run, reset: resetConsent } = useConsentFlow();
  const { versionId, zoneId, reset: resetOnboarding } = useOnboarding();
  const { getStudent, getActiveConsent, getZone, getVersion } = useAppStore();

  const student = studentId ? getStudent(studentId) : undefined;
  const consent = studentId ? getActiveConsent(studentId) : undefined;
  const firstName = student?.name.split(' ')[0] ?? 'El niño';
  const zone = zoneId ? getZone(zoneId) : undefined;
  const version = versionId ? getVersion(versionId) : undefined;

  const inscribirOtro = () => {
    resetConsent();
    // Mantiene versión/zona para agilizar varios hijos: reiniciamos solo el niño.
    resetOnboarding();
    router.replace('/onboarding');
  };

  const volver = () => {
    resetConsent();
    resetOnboarding();
    router.replace('/apoderado');
  };

  return (
    <Screen
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button label="Inscribir otro niño" onPress={inscribirOtro} />
          <Button label="Volver al inicio" variant="secondary" onPress={volver} />
        </View>
      }
    >
      <FakeStatusBar />
      <Text style={styles.title}>Consentimiento firmado</Text>

      <View style={styles.checkWrap}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      </View>

      <Text style={styles.lead}>Listo, {firstName} quedó inscrito/a</Text>
      <Text style={styles.sub}>Enviamos una copia al correo de {fullName || 'el tutor'}.</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Programa</Text>
        <Text style={styles.value}>
          {version ? versionLabel(version) : '—'}{zone ? ` · ${zone.name}` : ''}
        </Text>
        <View style={{ height: spacing.md }} />
        <Text style={styles.label}>Firmado por</Text>
        <Text style={styles.value}>{fullName || '—'} · {run || '—'}</Text>
        <View style={{ height: spacing.md }} />
        <Text style={styles.label}>Fecha</Text>
        <Text style={styles.value}>{consent ? formatSignedAt(consent.signedAt) : '—'}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.medium, fontSize: fontSize.title, color: colors.textPrimary, marginTop: spacing.lg },
  checkWrap: { alignItems: 'center', marginTop: spacing.xl },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: colors.green, fontSize: 40, fontFamily: fonts.semibold, lineHeight: 46 },
  lead: {
    fontFamily: fonts.medium,
    fontSize: fontSize.subtitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  card: { marginTop: spacing.xl },
  label: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary },
  value: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary, marginTop: 2 },
});
