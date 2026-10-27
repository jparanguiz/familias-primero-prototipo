import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export type TileTone = 'teal' | 'violet' | 'neutral';

const TONE_COLOR: Record<TileTone, string> = {
  teal: colors.primaryDark,
  violet: colors.violetDark,
  neutral: colors.textPrimary,
};

const CHEVRON_COLOR: Record<TileTone, string> = {
  teal: colors.primary,
  violet: colors.violet,
  neutral: colors.textMuted,
};

export function Tile({
  title,
  description,
  onPress,
  disabled,
  tone = 'neutral',
}: {
  title: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
  /** Color del título y el chevron, según la sección. */
  tone?: TileTone;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.tile,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: disabled ? colors.textMuted : TONE_COLOR[tone] }]}>
          {title}
        </Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
      <Text style={[styles.chevron, { color: CHEVRON_COLOR[tone] }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { backgroundColor: colors.surface },
  disabled: { opacity: 0.5 },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.body },
  desc: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: { fontSize: 26, marginLeft: spacing.sm },
});
