import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { StaffRole } from '@/domain/types';
import { isValidEmail } from '@/domain/auth';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'tutor', label: 'Tutor' },
];

function confirmAction(message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Confirmar', message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Confirmar', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function EditarUsuario() {
  const { id, userId } = useLocalSearchParams<{ id: string; userId: string }>();
  const orgId = String(id);
  const router = useRouter();
  const {
    getOrg,
    getUser,
    setUserName,
    setUserEmail,
    changeUserRole,
    setUserSelfie,
    resendInvite,
    removeUser,
  } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();

  const org = getOrg(orgId);
  const user = getUser(String(userId));

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<StaffRole>((user?.role as StaffRole) ?? 'tutor');
  const [retakingSelfie, setRetakingSelfie] = useState(false);
  const [newSelfie, setNewSelfie] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) {
    return (
      <Screen>
        <ScreenHeader showBack title="Editar usuario" />
        <Banner tone="error" text="No se encontró el usuario." />
      </Screen>
    );
  }

  const useRealCamera = Platform.OS !== 'web' && permission?.granted === true;

  const save = () => {
    setError(null);
    if (name.trim().length < 2) { setError('Ingresa el nombre.'); return; }
    if (!isValidEmail(email)) { setError('Ingresa un correo válido.'); return; }
    if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const res = setUserEmail(user.id, email.trim());
      if ('error' in res) { setError(res.error); return; }
    }
    if (name.trim() !== user.name) setUserName(user.id, name.trim());
    if (role !== user.role) changeUserRole(user.id, role);
    if (newSelfie) setUserSelfie(user.id, newSelfie);
    router.back();
  };

  return (
    <Screen footer={<Button label="Guardar cambios" onPress={save} />}>
      <ScreenHeader showBack backLabel="Organización" title="Editar usuario" subtitle={org?.name} />

      {msg ? <Banner tone="success" text={msg} /> : null}

      <Text style={styles.statusLine}>
        Estado: {user.status === 'invitado' ? 'Invitado (aún no ingresa)' : 'Activo'}
      </Text>

      <Field label="Nombre y apellido" value={name} onChangeText={setName} placeholder="Ana Soto" autoCapitalize="words" />
      <Field label="Correo" value={email} onChangeText={setEmail} placeholder="persona@organizacion.cl" keyboardType="email-address" autoCapitalize="none" />
      <Select label="Rol" value={role} onChange={(v) => setRole(v as StaffRole)} options={ROLES} searchable={false} />

      <Text style={styles.label}>Selfie</Text>
      {retakingSelfie ? (
        <View>
          <View style={styles.viewport}>
            {newSelfie ? (
              <View style={[styles.fill, styles.done]}><Text style={styles.doneText}>Nueva selfie lista ✓</Text></View>
            ) : useRealCamera ? (
              <CameraView style={styles.fill} facing="front" />
            ) : (
              <View style={[styles.fill, styles.placeholder]}>
                <View style={styles.avatar} />
                <Text style={styles.placeholderText}>Encuadra el rostro</Text>
              </View>
            )}
          </View>
          {Platform.OS !== 'web' && !permission?.granted ? (
            <Button label="Permitir cámara" variant="secondary" onPress={requestPermission} style={{ marginTop: spacing.sm }} />
          ) : null}
          {!newSelfie ? (
            <Button label={useRealCamera ? 'Tomar selfie' : 'Tomar selfie (simulada)'} onPress={() => setNewSelfie(`selfie_${Date.now()}`)} style={{ marginTop: spacing.sm }} />
          ) : (
            <Pressable onPress={() => setNewSelfie(null)}><Text style={styles.linkBlue}>Volver a tomar</Text></Pressable>
          )}
        </View>
      ) : (
        <View style={styles.selfieRow}>
          <View style={styles.selfieThumb}>
            <Text style={styles.selfieThumbText}>{user.selfiePhotoId ? '🙂' : '—'}</Text>
          </View>
          <Pressable onPress={() => { setRetakingSelfie(true); setNewSelfie(null); }}>
            <Text style={styles.linkBlue}>{user.selfiePhotoId ? 'Cambiar selfie' : 'Agregar selfie'}</Text>
          </Pressable>
        </View>
      )}

      {error ? <Banner tone="error" text={error} /> : null}

      <Text style={styles.sectionLabel}>Acciones</Text>
      <Pressable
        style={styles.actionRow}
        onPress={() => confirmAction(`¿Restablecer la clave de ${user.name || user.email}? Deberá crear una nueva en su próximo ingreso.`, () => {
          resendInvite(user.id); // deja status 'invitado' y limpia clave: fuerza recrear credenciales
          setMsg('Clave restablecida. La persona creará una nueva al ingresar.');
        })}
      >
        <Text style={styles.linkBlue}>Restablecer clave</Text>
      </Pressable>

      {user.status === 'activo' ? (
        <Pressable
          style={styles.actionRow}
          onPress={() => confirmAction(`¿Reenviar invitación a ${user.email}? Deberá crear su cuenta de nuevo.`, () => {
            resendInvite(user.id);
            setMsg('Invitación reenviada.');
          })}
        >
          <Text style={styles.linkBlue}>Reenviar invitación</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={styles.actionRow}
        onPress={() => confirmAction(`¿Quitar a ${user.name || user.email} de ${org?.name ?? 'la organización'}?`, () => {
          removeUser(user.id);
          router.back();
        })}
      >
        <Text style={styles.linkRed}>Quitar de la organización</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusLine: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: spacing.md },
  label: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  viewport: { height: 240, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  placeholder: {},
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.border, marginBottom: spacing.sm },
  placeholderText: { fontFamily: fonts.regular, fontSize: fontSize.small, color: colors.textSecondary },
  done: { backgroundColor: colors.greenBg },
  doneText: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.green },
  selfieRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  selfieThumb: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
  selfieThumbText: { fontSize: 24 },
  linkBlue: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
  linkRed: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.red },
  actionRow: { paddingVertical: spacing.sm },
});
