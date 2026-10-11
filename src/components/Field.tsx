import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

interface FieldProps extends TextInputProps {
  label: string;
  /** Texto de ayuda bajo el campo. */
  hint?: string;
  /** Tono del hint: por defecto gris; 'error' rojo, 'success' verde. */
  hintTone?: 'muted' | 'error' | 'success';
}

/** Campo de texto con etiqueta y ayuda, estilo del diseño (borde #B4B2A9). */
export function Field({
  label,
  hint,
  hintTone = 'muted',
  style,
  ...inputProps
}: FieldProps) {
  const hintColor =
    hintTone === 'error'
      ? colors.red
      : hintTone === 'success'
        ? colors.green
        : colors.textSecondary;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        {...inputProps}
      />
      {hint ? <Text style={[styles.hint, { color: hintColor }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
});
