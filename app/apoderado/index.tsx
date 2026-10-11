import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { RoleHeader } from '@/components/RoleHeader';
import { Tile } from '@/components/Tile';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { versionLabel } from '@/domain/retention';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function ApoderadoHome() {
  const router = useRouter();
  const { versions } = useAppStore();

  return (
    <Screen>
      <RoleHeader />
      <Text style={styles.title}>Inscribe a tus hijos</Text>
      <Text style={styles.subtitle}>
        Puedes inscribir a cuantos niños quieras. Para cada uno eliges la versión y
        la zona, subes una foto y firmas el consentimiento.
      </Text>

      <Tile
        title="Inscribir un niño"
        description="Nuevo onboarding"
        onPress={() => router.push('/onboarding')}
      />

      {versions.length === 0 ? (
        <Banner tone="warning" text="Aún no hay versiones del programa abiertas." />
      ) : (
        <Banner
          tone="info"
          text={`Versiones disponibles: ${versions.map(versionLabel).join(', ')}`}
        />
      )}

      <View style={styles.help}>
        <Text style={styles.helpTitle}>¿Un tutor te compartió un QR?</Text>
        <Text style={styles.helpText}>
          Si un tutor del programa inició la inscripción, usa “Inscribir un niño” y
          escanea el QR para precargar la versión y la zona.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.medium,
    fontSize: fontSize.title,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  help: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  helpTitle: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  helpText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});
