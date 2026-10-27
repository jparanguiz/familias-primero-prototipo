import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, FakeStatusBar } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';
import { isValidEmail, normalizeEmail, verifyPassword } from '@/domain/auth';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function Login() {
  const router = useRouter();
  const { getUserByEmail, getOrg } = useAppStore();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    setError(null);
    if (!isValidEmail(email)) {
      setError('Ingresa un correo válido.');
      return;
    }
    const user = getUserByEmail(normalizeEmail(email));
    if (!user) {
      setError('No encontramos una cuenta con ese correo. Pide al administrador que te habilite.');
      return;
    }
    if (user.status === 'invitado' || !user.passwordHash) {
      // Primer ingreso: la persona debe enrolarse.
      router.push({ pathname: '/auth/enroll', params: { email: user.email } });
      return;
    }
    if (!verifyPassword(password, user.passwordHash)) {
      setError('Correo o clave incorrectos.');
      return;
    }
    // Bloqueo por licencia suspendida (el superusuario no tiene organización).
    if (user.role !== 'superusuario' && user.orgId) {
      const org = getOrg(user.orgId);
      if (org && org.license.status === 'suspendida') {
        setError('La licencia de tu organización está suspendida. Contacta a la Fundación Familias Primero.');
        return;
      }
    }
    signIn({ role: user.role, userId: user.id, activeOrgId: user.orgId });
    router.replace('/');
  };

  return (
    <Screen>
      <FakeStatusBar />
      <View style={styles.brand}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo Fundación Familias Primero"
        />
        <Text style={styles.program}>Programa Leer es Poderoso</Text>
      </View>

      <Text style={styles.title}>Iniciar sesión</Text>

      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        placeholder="tucorreo@organizacion.cl"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Field
        label="Clave"
        value={password}
        onChangeText={setPassword}
        placeholder="Tu clave"
        secureTextEntry
        autoCapitalize="none"
      />

      {error ? <Banner tone="error" text={error} /> : null}

      <Button label="Entrar" onPress={handleLogin} />

      <Pressable onPress={() => router.push('/auth/recover')} style={styles.linkWrap}>
        <Text style={styles.link}>¿Olvidaste tu clave?</Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable onPress={() => router.push('/auth/apoderado')}>
        <Text style={styles.apoderado}>Soy apoderado/a y quiero inscribir a mi hijo/a</Text>
      </Pressable>

      {/* Credenciales de demostración */}
      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>Cuentas de demostración (clave: demo123)</Text>
        <Text style={styles.demoItem}>super@familiasprimero.cl — Superusuario</Text>
        <Text style={styles.demoItem}>admin@familiasprimero.cl — Administrador (Fundación)</Text>
        <Text style={styles.demoItem}>carla@familiasprimero.cl — Coordinadora</Text>
        <Text style={styles.demoItem}>pedro@familiasprimero.cl — Tutor</Text>
        <Text style={styles.demoItem}>admin@lapintana.cl — Administrador (Municipalidad)</Text>
        <Text style={[styles.demoItem, { marginTop: spacing.xs }]}>
          nuevo@familiasprimero.cl — invitado (prueba el primer ingreso; entra sin clave)
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { marginTop: spacing.lg, marginBottom: spacing.xl, alignItems: 'center' },
  logo: { width: 140, height: 126 },
  program: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.sm },
  title: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.textPrimary, marginBottom: spacing.lg },
  linkWrap: { marginTop: spacing.md, alignItems: 'center' },
  link: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
  divider: { height: 1, backgroundColor: colors.borderSoft, marginVertical: spacing.xl },
  apoderado: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, textAlign: 'center' },
  demoBox: { marginTop: spacing.xl, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md },
  demoTitle: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  demoItem: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, lineHeight: 18 },
});
