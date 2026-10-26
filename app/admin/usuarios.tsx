import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { useActiveOrgId } from '@/store/useScope';
import { User } from '@/domain/types';
import { versionLabel } from '@/domain/retention';
import { isValidEmail } from '@/domain/auth';
import { downloadUsersTemplate, normalizeRole, pick, pickAndParse } from '@/domain/bulkImport';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

type StaffRole = User['role'];

export default function AdminUsuarios() {
  const {
    inviteUser,
    versionsInOrg,
    usersInOrg,
    zonesInVersion,
    staffAssignments,
    assignStaff,
    unassignStaff,
  } = useAppStore();
  const orgId = useActiveOrgId();

  const versions = orgId ? versionsInOrg(orgId) : [];
  const users = orgId ? usersInOrg(orgId) : [];

  const [versionId, setVersionId] = useState<string | null>(versions[0]?.id ?? null);
  const [role, setRole] = useState<StaffRole>('tutor');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const canCreate = isValidEmail(email);
  const handleCreate = () => {
    if (!canCreate) {
      setMsg('Ingresa un correo válido.');
      return;
    }
    if (!orgId) return;
    const res = inviteUser(orgId, email.trim(), role);
    if ('error' in res) {
      setMsg(res.error);
      return;
    }
    setMsg(`Invitación habilitada para ${res.email}. La persona crea su cuenta en su primer ingreso.`);
    setEmail('');
  };

  const handleBulk = async () => {
    try {
      const file = await pickAndParse();
      if (!file) return;
      if (!orgId) return;
      let created = 0;
      file.rows.forEach((row) => {
        const mail = pick(row, 'email', 'correo');
        const r = normalizeRole(pick(row, 'rol', 'role'));
        if (!mail || !r || !isValidEmail(mail)) return;
        const res = inviteUser(orgId, mail, r);
        if (!('error' in res)) created += 1;
      });
      setMsg(`Carga masiva: ${created} usuarios habilitados desde ${file.name}.`);
    } catch {
      setMsg('No se pudo leer el archivo. Revisa el formato.');
    }
  };

  const zonesOfVersion = versionId ? zonesInVersion(versionId) : [];
  const staff = users.filter((u) => u.role !== 'admin');

  const assignedZoneIds = (userId: string): string[] =>
    staffAssignments
      .filter((a) => a.versionId === versionId && a.userId === userId)
      .map((a) => a.zoneId);

  const setUserZones = (userId: string, next: string[]) => {
    if (!versionId) return;
    const current = assignedZoneIds(userId);
    current.filter((z) => !next.includes(z)).forEach((z) => unassignStaff(versionId, userId, z));
    next.filter((z) => !current.includes(z)).forEach((z) => assignStaff(versionId, userId, z));
  };

  return (
    <Screen>
      <ScreenHeader showBack backLabel="Inicio" title="Usuarios" subtitle="Equipo y asignación por versión" />

      <Select
        label="Versión para asignar zonas"
        placeholder="Elige una versión"
        value={versionId}
        onChange={setVersionId}
        options={versions.map((v) => ({ value: v.id, label: versionLabel(v) }))}
      />

      {msg ? <Banner tone="success" text={msg} /> : null}

      {zonesOfVersion.length === 0 && versionId ? (
        <Banner tone="warning" text="Esta versión no tiene zonas aún. Agrégalas en 'Zonas'." />
      ) : null}

      <Text style={styles.sectionLabel}>Equipo y zonas asignadas</Text>
      {staff.map((u) => {
        const assigned = assignedZoneIds(u.id);
        return (
          <View key={u.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.uName}>{u.name || u.email}</Text>
                <Text style={styles.uMeta}>
                  {u.email}
                  {u.status === 'invitado' ? ' · invitado (aún no ingresa)' : ''}
                </Text>
              </View>
              <Text style={styles.uRole}>{u.role === 'tutor' ? 'Tutor' : 'Coordinador'}</Text>
            </View>
            <Select
              label="Zonas en esta versión"
              placeholder="Sin zonas asignadas"
              multiple
              value={assigned}
              onChange={(next) => setUserZones(u.id, next)}
              options={zonesOfVersion.map((z) => ({ value: z.id, label: z.name, sublabel: z.kind }))}
            />
          </View>
        );
      })}

      <Text style={styles.sectionLabel}>Habilitar usuario</Text>
      <Banner tone="neutral" text="Habilitas el correo con un rol. La persona crea su nombre, clave y selfie en su primer ingreso." />
      <Field label="Correo" value={email} onChangeText={setEmail} placeholder="persona@organizacion.cl" keyboardType="email-address" autoCapitalize="none" />
      <Select
        label="Rol"
        value={role}
        onChange={(v) => setRole(v as StaffRole)}
        options={[{ value: 'tutor', label: 'Tutor' }, { value: 'coordinador', label: 'Coordinador' }]}
        searchable={false}
      />
      <Button label="Habilitar usuario" onPress={handleCreate} disabled={!canCreate} />

      <Text style={styles.sectionLabel}>Carga masiva</Text>
      <View style={{ gap: spacing.sm }}>
        <Button label="Importar usuarios (.xlsx / .csv)" variant="secondary" onPress={handleBulk} />
        <Pressable onPress={downloadUsersTemplate}>
          <Text style={styles.templateLink}>Descargar plantilla de usuarios</Text>
        </Pressable>
      </View>
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
  card: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  uName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  uMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  uRole: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.blue,
    backgroundColor: colors.blueBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  templateLink: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.blue, textAlign: 'center', paddingVertical: spacing.xs },
});
