import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

/**
 * En web centra el contenido dentro de un marco tipo teléfono (360x720)
 * para que coincida con los diseños de Figma. En nativo ocupa toda la pantalla.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') {
    return <View style={styles.nativeRoot}>{children}</View>;
  }
  return (
    <View style={styles.webBackdrop}>
      <View style={styles.phone}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webBackdrop: {
    flex: 1,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E7E2',
    paddingVertical: 24,
  },
  phone: {
    width: 390,
    height: 780,
    maxWidth: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    // Sombra suave para efecto de dispositivo
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
});
