import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { OrgType, StaffRole } from '@/domain/types';
import { formatDate } from '@/domain/format';
import { isValidEmail } from '@/domain/auth';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const TYPES: { value: OrgType; label: string }[] = [
  { value: 'fundacion', label: 'Fundación' },
  { value: 'municipalidad', label: 'Municipalidad' },
  { value: 'institucion', label: 'Institución' },
];
const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'superusuario', label: 'Superusuario' },
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function Organizaciones() {
  const { orgs, usersInOrg, users, createOrganization, setLicenseStatus, inviteUser, changeUserRole } = useAppStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<OrgType>('municipalidad');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // Habilitar usuario (cualquier rol) por organización.
  const [newOrgId, setNewOrgId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<StaffRole>('admin');
  const [newEmail, setNewEmail] = useState('');

  const canCreateOrg = name.trim().length >= 3 && DATE_RE.test(start);
  const handleCreateOrg = () => {
    if (!canCreateOrg) {
      setMsg('Ingresa nombre y fecha de inicio de licencia (AAAA-MM-DD).');
      return;
    }
    const org = createOrganization(name.trim(), type, {
      status: 'activa',
      startDate: start,
      endDate: DATE_RE.test(end) ? end : undefined,
    });
    setMsg(`Organización creada: ${org.name} (licencia activa).`);
    setName(''); setStart(''); setEnd('');
  };

  // El superusuario no tiene organización; para otros roles se exige org.
  const needsOrgForNewUser = newRole !== 'superusuario';
  const canInvite = isValidEmail(newEmail) && (!needsOrgForNewUser || !!newOrgId);
  const handleInvite = () => {
    if (!canInvite) {
      setMsg('Ingresa un correo válido y, salvo superusuario, la organización.');
      return;
    }
    const res = inviteUser(needsOrgForNewUser ? newOrgId : null, newEmail.trim(), newRole);
    if ('error' in res) { setMsg(res.error); return; }
    setMsg(`Usuario habilitado: ${res.email}. Creará su cuenta en su primer ingreso.`);
    setNewEmail('');
  };

  const staffList = users.filter((u) => u.role !== 'superusuario');

  return (
    <Screen>
      <ScreenHeader showBack backLabel="Inicio" title="Organizaciones y licencias" subtitle="Transferencia del programa" />

      {msg ? <Banner tone="success" text={msg} /> : null}

      <Text style={styles.sectionLabel}>Organizaciones</Text>
      {orgs.map((o) => {
        const admins = usersInOrg(o.id).filter((u) => u.role === 'admin');
        const suspended = o.license.status === 'suspendida';
        return (
          <View key={o.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.oName}>{o.name}</Text>
              <Text style={[styles.badge, suspended ? styles.badgeOff : styles.badgeOn]}>
                {suspended ? 'Suspendida' : 'Activa'}
              </Text>
            </View>
            <Text style={styles.oMeta}>{o.type} · desde {formatDate(o.license.startDate)}{o.license.endDate ? ` hasta ${formatDate(o.license.endDate)}` : ''}</Text>
            <Text style={styles.oMeta}>{admins.length ? `Admins: ${admins.map((a) => a.name).join(', ')}` : 'Sin administradores'}</Text>
            <Pressable onPress={() => setLicenseStatus(o.id, suspended ? 'activa' : 'suspendida')}>
              <Text style={[styles.action, { color: suspended ? colors.green : colors.red }]}>
                {suspended ? 'Reactivar licencia' : 'Suspender licencia'}
              </Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.sectionLabel}>Nueva organización (licencia)</Text>
      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Municipalidad de Peñalolén" autoCapitalize="words" />
      <Select label="Tipo" value={type} onChange={(v) => setType(v as OrgType)} options={TYPES} searchable={false} />
      <Field label="Inicio de licencia (AAAA-MM-DD)" value={start} onChangeText={setStart} placeholder="2027-01-01" autoCapitalize="none" />
      <Field label="Fin de licencia (opcional)" value={end} onChangeText={setEnd} placeholder="2027-12-31" autoCapitalize="none" />
      <Button label="Crear organización" onPress={handleCreateOrg} disabled={!canCreateOrg} />

      <Text style={styles.sectionLabel}>Habilitar usuario</Text>
      <Banner tone="neutral" text="Habilitas el correo con un rol. La persona crea su nombre, clave y selfie en su primer ingreso." />
      <Select
        label="Rol"
        value={newRole}
        onChange={(v) => setNewRole(v as StaffRole)}
        options={ROLES}
        searchable={false}
      />
      {needsOrgForNewUser ? (
        <Select
          label="Organización"
          placeholder="Elige la organización"
          value={newOrgId}
          onChange={setNewOrgId}
          options={orgs.map((o) => ({ value: o.id, label: o.name, sublabel: o.type }))}
        />
      ) : null}
      <Field label="Correo" value={newEmail} onChangeText={setNewEmail} placeholder="persona@organizacion.cl" keyboardType="email-address" autoCapitalize="none" />
      <Button label="Habilitar usuario" onPress={handleInvite} disabled={!canInvite} />

      <Text style={styles.sectionLabel}>Cambiar rol de un usuario</Text>
      {staffList.map((u) => (
        <View key={u.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.oName}>{u.name || u.email}</Text>
            <Text style={styles.oMeta}>{u.status === 'invitado' ? 'invitado' : 'activo'}</Text>
          </View>
          <Text style={styles.oMeta}>
            {u.email} · {orgs.find((o) => o.id === u.orgId)?.name ?? 'Sin organización'}
          </Text>
          <Select
            label="Rol"
            value={u.role}
            onChange={(v) => { changeUserRole(u.id, v as StaffRole); setMsg(`Rol actualizado para ${u.name || u.email}.`); }}
            options={ROLES}
            searchable={false}
          />
        </View>
      ))}
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  oName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, flex: 1 },
  badge: { fontFamily: fonts.medium, fontSize: 11, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, overflow: 'hidden' },
  badgeOn: { backgroundColor: colors.greenBg, color: colors.green },
  badgeOff: { backgroundColor: colors.redBg, color: colors.red },
  oMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  action: { fontFamily: fonts.medium, fontSize: fontSize.small, marginTop: spacing.sm },
});
