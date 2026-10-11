import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  info: { bg: colors.blueBg, fg: colors.blue },
  success: { bg: colors.greenBg, fg: colors.green },
  warning: { bg: colors.amberBg, fg: colors.amber },
  error: { bg: colors.redBg, fg: colors.red },
  neutral: { bg: colors.surface, fg: colors.textSecondary },
};

/** Franja informativa de color, como los avisos del diseño (consentimiento vigente, etc.). */
export function Banner({ tone = 'info', text }: { tone?: Tone; text: string }) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 44,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
  },
});
