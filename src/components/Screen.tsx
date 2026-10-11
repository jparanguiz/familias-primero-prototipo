import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  step?: string; // ej. "Paso 1 de 4"
  /** Muestra un botón para volver a la pantalla anterior. */
  showBack?: boolean;
  /** Acción personalizada al volver (por defecto, router.back()). */
  onBack?: () => void;
  /** Texto del botón de volver (por defecto "Atrás"). */
  backLabel?: string;
}

/** Botón de retroceso reutilizable. */
export function BackButton({
  onBack,
  label = 'Atrás',
}: {
  onBack?: () => void;
  label?: string;
}) {
  const router = useRouter();
  const handle = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };
  return (
    <Pressable
      onPress={handle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`Volver: ${label}`}
      style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
    >
      <Text style={styles.backText}>‹ {label}</Text>
    </Pressable>
  );
}

/** Barra de estado simulada (hora + indicador), como en los Figma. */
export function FakeStatusBar({ step }: { step?: string }) {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>9:41</Text>
      {step ? <Text style={styles.statusStep}>{step}</Text> : <View />}
      <View style={styles.statusBattery} />
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  step,
  showBack = false,
  onBack,
  backLabel,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <FakeStatusBar step={step} />
      {showBack ? <BackButton onBack={onBack} label={backLabel} /> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
}

/** Contenedor de pantalla con padding estándar y footer fijo opcional. */
export function Screen({ children, scroll = true, contentStyle, footer }: ScreenProps) {
  const body = (
    <View style={[styles.body, contentStyle]}>{children}</View>
  );
  return (
    <View style={styles.root}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>{body}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  statusTime: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  statusStep: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  backPressed: {
    opacity: 0.6,
  },
  backText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.body,
    color: colors.blue,
  },
  statusBattery: {
    width: 34,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: fontSize.title,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
