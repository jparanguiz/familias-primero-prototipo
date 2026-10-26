import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { StaffRole } from '@/domain/types';
import { isValidEmail } from '@/domain/auth';
import { colors, fonts, fontSize, spacing } from '@/theme';

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'tutor', label: 'Tutor' },
];

export default function CrearUsuario() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orgId = String(id);
  const router = useRouter();
  const { getOrg, inviteUser } = useAppStore();

  const org = getOrg(orgId);
  const [role, setRole] = useState<StaffRole>('tutor');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!isValidEmail(email)) { setError('Ingresa un correo válido.'); return; }
    const res = inviteUser(orgId, email.trim(), role);
    if ('error' in res) { setError(res.error); return; }
    router.back();
  };

  return (
    <Screen footer={<Button label="Crear usuario" onPress={handleCreate} disabled={!isValidEmail(email)} />}>
      <ScreenHeader
        showBack
        backLabel="Organización"
        title="Crear usuario"
        subtitle={org ? org.name : undefined}
      />

      <Banner tone="neutral" text="Habilitas el correo con un rol. La persona crea su nombre, clave y selfie en su primer ingreso." />

      <Select label="Rol" value={role} onChange={(v) => setRole(v as StaffRole)} options={ROLES} searchable={false} />
      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        placeholder="persona@organizacion.cl"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {error ? <Banner tone="error" text={error} /> : null}

      <Text style={styles.note}>
        Se enviará una invitación a este correo. La persona completa su perfil al ingresar
        por primera vez.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing.lg, lineHeight: 18 },
});
