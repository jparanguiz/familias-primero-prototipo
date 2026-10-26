import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FakeStatusBar } from '@/components/Screen';
import { useAppStore } from '@/store/AppStore';
import { useSession, ROLE_LABELS } from '@/store/SessionStore';
import { useActiveOrgId } from '@/store/useScope';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/** Encabezado con identidad, organización activa y acciones de sesión. */
export function RoleHeader() {
  const router = useRouter();
  const { session, signOut, setActiveOrgId, stopImpersonating } = useSession();
  const { getUser, getOrg, orgs } = useAppStore();
  const orgId = useActiveOrgId();
  const [orgOpen, setOrgOpen] = useState(false);

  if (!session) return <FakeStatusBar />;

  const impersonating = Boolean(session.impersonatorSession);
  const user = session.userId ? getUser(session.userId) : undefined;
  const name = user?.name ?? ROLE_LABELS[session.role];
  const org = orgId ? getOrg(orgId) : undefined;
  // Mientras se impersona, el org chip no debe editarse como superusuario.
  const isSuper = session.role === 'superusuario' && !impersonating;

  const handleSwitch = () => {
    signOut();
    router.replace('/login');
  };

  const handleBackToSuper = () => {
    stopImpersonating();
    router.replace('/');
  };

  return (
    <View>
      <FakeStatusBar />

      {impersonating ? (
        <View style={styles.impersonateBar}>
          <Text style={styles.impersonateText} numberOfLines={1}>
            Viendo como {name}
          </Text>
          <Pressable onPress={handleBackToSuper} hitSlop={8}>
            <Text style={styles.impersonateBack}>Volver a mi sesión</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.role}>{ROLE_LABELS[session.role]}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <Pressable onPress={handleSwitch} hitSlop={10}>
          <Text style={styles.switch}>Cerrar sesión</Text>
        </Pressable>
      </View>

      {/* Organización activa. El superusuario puede cambiarla. */}
      {org ? (
        <Pressable
          style={styles.orgChip}
          onPress={isSuper ? () => setOrgOpen(true) : undefined}
          disabled={!isSuper}
        >
          <Text style={styles.orgLabel}>Organización</Text>
          <Text style={styles.orgValue}>
            {org.name}
            {org.license.status === 'suspendida' ? ' · licencia suspendida' : ''}
            {isSuper ? ' ▾' : ''}
          </Text>
        </Pressable>
      ) : null}

      {isSuper ? (
        <Modal visible={orgOpen} transparent animationType="slide" onRequestClose={() => setOrgOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOrgOpen(false)}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Operar como organización</Text>
              <ScrollView>
                {orgs.map((o) => (
                  <Pressable
                    key={o.id}
                    style={styles.orgRow}
                    onPress={() => { setActiveOrgId(o.id); setOrgOpen(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orgRowName}>{o.name}</Text>
                      <Text style={styles.orgRowMeta}>{o.type} · licencia {o.license.status}</Text>
                    </View>
                    {o.id === orgId ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  impersonateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.amberBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  impersonateText: { flex: 1, fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.amber },
  impersonateBack: { fontFamily: fonts.semibold, fontSize: fontSize.caption, color: colors.amber, marginLeft: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, marginBottom: spacing.sm },
  role: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  name: { fontFamily: fonts.semibold, fontSize: fontSize.subtitle, color: colors.textPrimary },
  switch: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
  orgChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  orgLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted, textTransform: 'uppercase' },
  orgValue: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.textPrimary, marginTop: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, maxHeight: '70%' },
  sheetTitle: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.textPrimary, marginBottom: spacing.md },
  orgRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  orgRowName: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary },
  orgRowMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  check: { color: colors.green, fontFamily: fonts.semibold, fontSize: fontSize.body },
});
