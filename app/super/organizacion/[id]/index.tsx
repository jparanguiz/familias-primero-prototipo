import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Banner } from '@/components/Banner';
import { Card } from '@/components/Card';
import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';
import { StaffRole, User } from '@/domain/types';
import { formatDate } from '@/domain/format';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

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
  const router = useRouter();
  const { getOrg, usersInOrg, setLicenseStatus } = useAppStore();
  const { session, impersonate } = useSession();

  const org = getOrg(orgId);
  const [msg, setMsg] = useState<string | null>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);

  const isSuper = session?.role === 'superusuario';

  const openEdit = (u: User) => {
    setMenuUser(null);
    router.push(`/super/organizacion/${orgId}/editar/${u.id}`);
  };

  const enterAs = (u: User) => {
    setMenuUser(null);
    impersonate({ role: u.role, userId: u.id, activeOrgId: u.orgId });
    router.replace('/');
  };

  const onUserPress = (u: User) => {
    // El superusuario ve el menú (editar / ingresar como). Otros, editar directo.
    if (isSuper) setMenuUser(u);
    else router.push(`/super/organizacion/${orgId}/editar/${u.id}`);
  };

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
    <Screen
      footer={<Button label="Crear usuario" onPress={() => router.push(`/super/organizacion/${orgId}/crear-usuario`)} />}
    >
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
                <Pressable
                  key={u.id}
                  style={({ pressed }) => [styles.userCard, pressed && styles.userCardPressed]}
                  onPress={() => onUserPress(u)}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.uName}>{u.name || u.email}</Text>
                    <Text style={[styles.statusTag, u.status === 'invitado' ? styles.statusInv : styles.statusAct]}>
                      {u.status === 'invitado' ? 'Invitado' : 'Activo'}
                    </Text>
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.uEmail}>{u.email}</Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        );
      })}

      {/* Menú de acciones por usuario (solo superusuario) */}
      <Modal visible={!!menuUser} transparent animationType="fade" onRequestClose={() => setMenuUser(null)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuUser(null)}>
          <View style={styles.menuSheet}>
            {menuUser ? (
              <>
                <Text style={styles.menuTitle}>{menuUser.name || menuUser.email}</Text>
                <Text style={styles.menuSub}>{menuUser.email}</Text>

                <Pressable style={styles.menuItem} onPress={() => openEdit(menuUser)}>
                  <Text style={styles.menuItemText}>Editar</Text>
                </Pressable>

                {menuUser.status === 'activo' ? (
                  <Pressable style={styles.menuItem} onPress={() => enterAs(menuUser)}>
                    <Text style={[styles.menuItemText, { color: colors.blue }]}>
                      Ingresar como esta persona
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.menuDisabled}>
                    “Ingresar como” disponible cuando la persona haya completado su primer ingreso.
                  </Text>
                )}

                <Pressable style={styles.menuCancel} onPress={() => setMenuUser(null)}>
                  <Text style={styles.menuCancelText}>Cancelar</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </Pressable>
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
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  oType: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, textTransform: 'capitalize' },
  oMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 4 },
  action: { fontFamily: fonts.medium, fontSize: fontSize.small, marginTop: spacing.md },
  badge: { fontFamily: fonts.medium, fontSize: 11, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, overflow: 'hidden' },
  badgeOn: { backgroundColor: colors.greenBg, color: colors.green },
  badgeOff: { backgroundColor: colors.redBg, color: colors.red },
  empty: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted, marginBottom: spacing.sm },
  userCard: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  userCardPressed: { backgroundColor: colors.surface },
  uName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, flex: 1 },
  uEmail: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, flex: 1 },
  chevron: { fontSize: 22, color: colors.textMuted, marginLeft: spacing.sm },
  statusTag: { fontFamily: fonts.medium, fontSize: 11, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, overflow: 'hidden' },
  statusInv: { backgroundColor: colors.amberBg, color: colors.amber },
  statusAct: { backgroundColor: colors.greenBg, color: colors.green },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
  },
  menuTitle: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.textPrimary },
  menuSub: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  menuItem: { paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  menuItemText: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  menuDisabled: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSoft, lineHeight: 18 },
  menuCancel: { paddingVertical: spacing.md, marginTop: spacing.sm, alignItems: 'center' },
  menuCancelText: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.blue },
});
