import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, FakeStatusBar } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { useSession, ROLE_LABELS } from '@/store/SessionStore';
import { Role } from '@/domain/types';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  superusuario: 'De la fundación. Gestiona organizaciones (licencias) y administradores. Puede operar en cualquiera.',
  admin: 'De la fundación o de una municipalidad. Gestiona su organización.',
  coordinador: 'A cargo de varias zonas de su organización. Monitorea y exporta.',
  tutor: 'Atiende zonas. Inscribe niños y pasa asistencia.',
  apoderado: 'Inscribe a tus hijos en el programa y firma el consentimiento.',
};

const ROLE_ORDER: Role[] = ['superusuario', 'admin', 'coordinador', 'tutor', 'apoderado'];

export default function Login() {
  const router = useRouter();
  const { users, orgs, getOrg } = useAppStore();
  const { signIn } = useSession();
  const [role, setRole] = useState<Role | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  // El tutor no elige organización en la demo (es irrelevante para ese rol):
  // la organización se infiere de su usuario.
  const needsOrg = role === 'admin' || role === 'coordinador';

  // Usuarios del rol elegido. Para tutor, todos; para admin/coordinador, los de la org.
  const staffUsers = useMemo(() => {
    if (!role || role === 'apoderado' || role === 'superusuario') return [];
    if (role === 'tutor') return users.filter((u) => u.role === 'tutor');
    return users.filter((u) => u.role === role && (!orgId || u.orgId === orgId));
  }, [role, orgId, users]);

  const enterStaff = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    signIn({ role: role!, userId, activeOrgId: u?.orgId ?? orgId });
    router.replace('/');
  };

  const enterSuper = () => {
    const superUser = users.find((u) => u.role === 'superusuario');
    // El superusuario arranca con la primera organización como activa.
    signIn({ role: 'superusuario', userId: superUser?.id ?? null, activeOrgId: orgs[0]?.id ?? null });
    router.replace('/');
  };

  const enterApoderado = () => {
    signIn({ role: 'apoderado', userId: null, activeOrgId: orgId });
    router.replace('/');
  };

  return (
    <Screen>
      <FakeStatusBar />
      <View style={styles.brand}>
        <Text style={styles.foundation}>Fundación Familias Primero</Text>
        <Text style={styles.program}>Programa Leer es Poderoso</Text>
      </View>

      <Text style={styles.sectionLabel}>Ingresa como</Text>

      {ROLE_ORDER.map((r) => {
        const active = role === r;
        return (
          <Pressable key={r} onPress={() => { setRole(r); setOrgId(null); }} style={[styles.roleTile, active && styles.roleTileActive]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleName}>{ROLE_LABELS[r]}</Text>
              <Text style={styles.roleDesc}>{ROLE_DESCRIPTIONS[r]}</Text>
            </View>
            <View style={[styles.radio, active && styles.radioOn]}>{active ? <View style={styles.radioDot} /> : null}</View>
          </Pressable>
        );
      })}

      {/* Superusuario: entra directo */}
      {role === 'superusuario' ? (
        <View style={styles.identityBox}>
          <Button label="Entrar como superusuario" onPress={enterSuper} />
        </View>
      ) : null}

      {/* Tutor: elige directamente su usuario (sin elegir organización) */}
      {role === 'tutor' ? (
        <View style={styles.identityBox}>
          <Text style={styles.sectionLabel}>Elige tu usuario</Text>
          {staffUsers.length === 0 ? (
            <Text style={styles.empty}>No hay tutores creados.</Text>
          ) : (
            staffUsers.map((u) => (
              <Button key={u.id} label={u.name} variant="secondary" onPress={() => enterStaff(u.id)} style={{ marginBottom: spacing.sm }} />
            ))
          )}
        </View>
      ) : null}

      {/* Admin y coordinador: elegir organización y luego usuario */}
      {needsOrg ? (
        <View style={styles.identityBox}>
          <Select
            label="Organización"
            placeholder="Elige una organización"
            value={orgId}
            onChange={setOrgId}
            options={orgs.map((o) => ({ value: o.id, label: o.name, sublabel: o.type }))}
          />
          {orgId ? (
            <>
              <Text style={styles.sectionLabel}>Elige tu usuario</Text>
              {staffUsers.length === 0 ? (
                <Text style={styles.empty}>No hay usuarios con este rol en {getOrg(orgId)?.name}.</Text>
              ) : (
                staffUsers.map((u) => (
                  <Button key={u.id} label={u.name} variant="secondary" onPress={() => enterStaff(u.id)} style={{ marginBottom: spacing.sm }} />
                ))
              )}
            </>
          ) : null}
        </View>
      ) : null}

      {/* Apoderado: elige organización (contexto) y entra */}
      {role === 'apoderado' ? (
        <View style={styles.identityBox}>
          <Select
            label="Organización del programa"
            placeholder="Elige una organización"
            value={orgId}
            onChange={setOrgId}
            options={orgs.map((o) => ({ value: o.id, label: o.name, sublabel: o.type }))}
          />
          <Button label="Continuar como apoderado" onPress={enterApoderado} disabled={!orgId} />
        </View>
      ) : null}

      <Text style={styles.note}>
        En esta versión no hay usuario y clave; eliges un rol para la demostración.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { marginTop: spacing.lg, marginBottom: spacing.xl },
  foundation: { fontFamily: fonts.semibold, fontSize: fontSize.title, color: colors.textPrimary },
  program: { fontFamily: fonts.regular, fontSize: fontSize.small, color: colors.textSecondary, marginTop: spacing.xs },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  roleTile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  roleTileActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  roleName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  roleDesc: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  identityBox: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  empty: { fontFamily: fonts.regular, fontSize: fontSize.small, color: colors.textSecondary },
  note: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing.xl, lineHeight: 18 },
});
