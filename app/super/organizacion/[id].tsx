import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { Card } from '@/components/Card';
import { useAppStore } from '@/store/AppStore';
import { StaffRole } from '@/domain/types';
import { formatDate } from '@/domain/format';
import { isValidEmail } from '@/domain/auth';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'tutor', label: 'Tutor' },
];

const GROUPS: { role: StaffRole; title: string }[] = [
  { role: 'admin', title: 'Administradores' },
  { role: 'coordinador', title: 'Coordinadores' },
  { role: 'tutor', title: 'Tutores' },
];

/** Confirmación multiplataforma. */
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

export default function OrganizacionDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orgId = String(id);
  const {
    getOrg,
    usersInOrg,
    inviteUser,
    changeUserRole,
    removeUser,
    resendInvite,
    setLicenseStatus,
  } = useAppStore();

  const org = getOrg(orgId);
  const [newRole, setNewRole] = useState<StaffRole>('tutor');
  const [newEmail, setNewEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  if (!org) {
    return (
      <Screen>
        <ScreenHeader showBack title="Organización" />
        <Banner tone="error" text="No se encontró la organización." />
      </Screen>
    );
  }

  const members = usersInOrg(orgId);
  const suspended = org.license.status === 'suspendida';

  const canInvite = isValidEmail(newEmail);
  const handleInvite = () => {
    if (!canInvite) { setMsg('Ingresa un correo válido.'); return; }
    const res = inviteUser(orgId, newEmail.trim(), newRole);
    if ('error' in res) { setMsg(res.error); return; }
    setMsg(`Usuario habilitado: ${res.email}. Creará su cuenta en su primer ingreso.`);
    setNewEmail('');
  };

  const toggleLicense = () => {
    const to = suspended ? 'activa' : 'suspendida';
    const message = suspended
      ? `¿Reactivar la licencia de ${org.name}? Sus usuarios podrán volver a ingresar.`
      : `¿Suspender la licencia de ${org.name}? Dejarás sin acceso a todos sus usuarios (administradores, coordinadores y tutores).`;
    confirmAction(message, () => {
      setLicenseStatus(orgId, to);
      setMsg(suspended ? 'Licencia reactivada.' : 'Licencia suspendida.');
    });
  };

  return (
    <Screen>
      <ScreenHeader showBack backLabel="Organizaciones" title={org.name} subtitle="Usuarios y licencia" />

      {msg ? <Banner tone="success" text={msg} /> : null}

      <Card style={{ marginBottom: spacing.lg }}>
        <View style={styles.cardTop}>
          <Text style={styles.oType}>{org.type}</Text>
          <Text style={[styles.badge, suspended ? styles.badgeOff : styles.badgeOn]}>
            {suspended ? 'Suspendida' : 'Activa'}
          </Text>
        </View>
        <Text style={styles.oMeta}>
          Licencia desde {formatDate(org.license.startDate)}
          {org.license.endDate ? ` hasta ${formatDate(org.license.endDate)}` : ''}
        </Text>
        <Pressable onPress={toggleLicense}>
          <Text style={[styles.action, { color: suspended ? colors.green : colors.red }]}>
            {suspended ? 'Reactivar licencia' : 'Suspender licencia'}
          </Text>
        </Pressable>
      </Card>

      {GROUPS.map((g) => {
        const list = members.filter((u) => u.role === g.role);
        return (
          <View key={g.role}>
            <Text style={styles.sectionLabel}>{g.title} ({list.length})</Text>
            {list.length === 0 ? (
              <Text style={styles.empty}>Sin {g.title.toLowerCase()}.</Text>
            ) : (
              list.map((u) => (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.cardTop}>
                    <Text style={styles.uName}>{u.name || u.email}</Text>
                    <Text style={[styles.statusTag, u.status === 'invitado' ? styles.statusInv : styles.statusAct]}>
                      {u.status === 'invitado' ? 'Invitado' : 'Activo'}
                    </Text>
                  </View>
                  <Text style={styles.uEmail}>{u.email}</Text>
                  <Select
                    label="Rol"
                    value={u.role}
                    onChange={(v) => { changeUserRole(u.id, v as StaffRole); setMsg(`Rol actualizado para ${u.name || u.email}.`); }}
                    options={ROLES}
                    searchable={false}
                  />
                  <View style={styles.userActions}>
                    {u.status === 'activo' ? (
                      <Pressable onPress={() => confirmAction(`¿Reenviar invitación a ${u.email}? Deberá crear su cuenta de nuevo.`, () => { resendInvite(u.id); setMsg('Invitación reenviada.'); })}>
                        <Text style={styles.linkBlue}>Reenviar invitación</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => confirmAction(`¿Quitar a ${u.name || u.email} de ${org.name}?`, () => { removeUser(u.id); setMsg('Usuario quitado.'); })}>
                      <Text style={styles.linkRed}>Quitar</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        );
      })}

      <Text style={styles.sectionLabel}>Habilitar usuario</Text>
      <Banner tone="neutral" text="Habilitas el correo con un rol. La persona crea su nombre, clave y selfie en su primer ingreso." />
      <Select label="Rol" value={newRole} onChange={(v) => setNewRole(v as StaffRole)} options={ROLES} searchable={false} />
      <Field label="Correo" value={newEmail} onChangeText={setNewEmail} placeholder="persona@organizacion.cl" keyboardType="email-address" autoCapitalize="none" />
      <Button label="Habilitar usuario" onPress={handleInvite} disabled={!canInvite} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  oType: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, textTransform: 'capitalize' },
  oMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 4 },
  action: { fontFamily: fonts.medium, fontSize: fontSize.small, marginTop: spacing.md },
  badge: { fontFamily: fonts.medium, fontSize: 11, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, overflow: 'hidden' },
  badgeOn: { backgroundColor: colors.greenBg, color: colors.green },
  badgeOff: { backgroundColor: colors.redBg, color: colors.red },
  empty: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted, marginBottom: spacing.sm },
  userCard: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  uName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, flex: 1 },
  uEmail: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  statusTag: { fontFamily: fonts.medium, fontSize: 11, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, overflow: 'hidden' },
  statusInv: { backgroundColor: colors.amberBg, color: colors.amber },
  statusAct: { backgroundColor: colors.greenBg, color: colors.green },
  userActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  linkBlue: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
  linkRed: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.red },
});
