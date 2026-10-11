import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useSession } from '@/store/SessionStore';
import { colors } from '@/theme';

/**
 * Punto de entrada: redirige según la sesión.
 * - Sin sesión → selector de rol.
 * - Con sesión → home del rol correspondiente.
 */
export default function Index() {
  const { ready, session } = useSession();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  switch (session.role) {
    case 'superusuario':
      return <Redirect href="/super" />;
    case 'admin':
      return <Redirect href="/admin" />;
    case 'coordinador':
      return <Redirect href="/coordinador" />;
    case 'tutor':
      return <Redirect href="/tutor" />;
    case 'apoderado':
      return <Redirect href="/apoderado" />;
    default:
      return <Redirect href="/login" />;
  }
}
