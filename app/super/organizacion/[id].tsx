import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { Card } from '@/components/Card';
import { useAppStore } from '@/store/AppStore';
import { StaffRole, User } from '@/domain/types';
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
    setUserEmail,
    removeUser,
    resendInvite,
    setLicenseStatus,
  } = useAppStore();

  const org = getOrg(orgId);
  const [msg, setMsg] = useState<string | null>(null);

  // Modal "Crear usuario"
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState<StaffRole>('tutor');
  const [newEmail, setNewEmail] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal "Editar usuario"
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<StaffRole>('tutor');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

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

  const openCreate = () => { setNewRole('tutor'); setNewEmail(''); setCreateError(null); setCreateOpen(true); };
  const handleCreate = () => {
    if (!isValidEmail(newEmail)) { setCreateError('Ingresa un correo válido.'); return; }
    const res = inviteUser(orgId, newEmail.trim(), newRole);
    if ('error' in res) { setCreateError(res.error); return; }
    setMsg(`Usuario creado: ${res.email}. Creará su cuenta en su primer ingreso.`);
    setCreateOpen(false);
  };

  const openEdit = (u: User) => {
    setEditUser(u); setEditRole(u.role); setEditEmail(u.email); setEditError(null);
  };
  const saveEdit = () => {
    if (!editUser) return;
    if (!isValidEmail(editEmail)) { setEditError('Ingresa un correo válido.'); return; }
    if (editEmail.trim().toLowerCase() !== editUser.email.toLowerCase()) {
      const res = setUserEmail(editUser.id, editEmail.trim());
      if ('error' in res) { setEditError(res.error); return; }
    }
    if (editRole !== editUser.role) changeUserRole(editUser.id, editRole);
    setMsg(`Usuario actualizado: ${editEmail.trim()}.`);
    setEditUser(null);
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
    <Screen footer={<Button label="Crear usuario" onPress={openCreate} />}>
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
                  <Pressable onPress={() => openEdit(u)} style={styles.editBtn}>
                    <Text style={styles.editText}>Editar</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        );
      })}

      {/* Modal crear usuario */}
      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Crear usuario</Text>
              <Pressable onPress={() => setCreateOpen(false)} hitSlop={8}><Text style={styles.close}>Cancelar</Text></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Banner tone="neutral" text="Habilitas el correo con un rol. La persona crea su nombre, clave y selfie en su primer ingreso." />
              <Select label="Rol" value={newRole} onChange={(v) => setNewRole(v as StaffRole)} options={ROLES} searchable={false} />
              <Field label="Correo" value={newEmail} onChangeText={setNewEmail} placeholder="persona@organizacion.cl" keyboardType="email-address" autoCapitalize="none" />
              {createError ? <Banner tone="error" text={createError} /> : null}
              <Button label="Crear usuario" onPress={handleCreate} disabled={!isValidEmail(newEmail)} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal editar usuario */}
      <Modal visible={!!editUser} animationType="slide" transparent onRequestClose={() => setEditUser(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Editar usuario</Text>
              <Pressable onPress={() => setEditUser(null)} hitSlop={8}><Text style={styles.close}>Cancelar</Text></Pressable>
            </View>
            {editUser ? (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.editName}>{editUser.name || '(aún no ingresa)'}</Text>
                <Text style={styles.editStatus}>{editUser.status === 'invitado' ? 'Invitado' : 'Activo'}</Text>
                <Field label="Correo" value={editEmail} onChangeText={setEditEmail} placeholder="persona@organizacion.cl" keyboardType="email-address" autoCapitalize="none" />
                <Select label="Rol" value={editRole} onChange={(v) => setEditRole(v as StaffRole)} options={ROLES} searchable={false} />
                {editError ? <Banner tone="error" text={editError} /> : null}
                <Button label="Guardar cambios" onPress={saveEdit} />

                <View style={styles.editActions}>
                  {editUser.status === 'activo' ? (
                    <Pressable onPress={() => {
                      const u = editUser;
                      confirmAction(`¿Reenviar invitación a ${u.email}? Deberá crear su cuenta de nuevo.`, () => { resendInvite(u.id); setMsg('Invitación reenviada.'); setEditUser(null); });
                    }}>
                      <Text style={styles.linkBlue}>Reenviar invitación</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => {
                    const u = editUser;
                    confirmAction(`¿Quitar a ${u.name || u.email} de ${org.name}?`, () => { removeUser(u.id); setMsg('Usuario quitado.'); setEditUser(null); });
                  }}>
                    <Text style={styles.linkRed}>Quitar de la organización</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
  uEmail: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  statusTag: { fontFamily: fonts.medium, fontSize: 11, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, overflow: 'hidden' },
  statusInv: { backgroundColor: colors.amberBg, color: colors.amber },
  statusAct: { backgroundColor: colors.greenBg, color: colors.green },
  editBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  editText: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.textPrimary },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sheetTitle: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.textPrimary },
  close: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
  editName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  editStatus: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: spacing.md },
  editActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  linkBlue: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
  linkRed: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.red },
});
