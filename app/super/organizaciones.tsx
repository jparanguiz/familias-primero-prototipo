import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { OrgType } from '@/domain/types';
import { formatDate } from '@/domain/format';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const TYPES: { value: OrgType; label: string }[] = [
  { value: 'fundacion', label: 'Fundación' },
  { value: 'municipalidad', label: 'Municipalidad' },
  { value: 'institucion', label: 'Institución' },
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function Organizaciones() {
  const { orgs, usersInOrg, createOrganization, setLicenseStatus, createUser } = useAppStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<OrgType>('municipalidad');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // Alta de administrador por organización.
  const [adminOrgId, setAdminOrgId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

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

  const canCreateAdmin = adminOrgId && adminName.trim().length >= 3;
  const handleCreateAdmin = () => {
    if (!canCreateAdmin || !adminOrgId) {
      setMsg('Elige una organización y el nombre del administrador.');
      return;
    }
    const u = createUser(adminOrgId, adminName.trim(), 'admin', adminEmail.trim() || undefined);
    setMsg(`Administrador creado: ${u.name}.`);
    setAdminName(''); setAdminEmail('');
  };

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

      <Text style={styles.sectionLabel}>Crear administrador</Text>
      <Select
        label="Organización"
        placeholder="Elige la organización"
        value={adminOrgId}
        onChange={setAdminOrgId}
        options={orgs.map((o) => ({ value: o.id, label: o.name, sublabel: o.type }))}
      />
      <Field label="Nombre del administrador" value={adminName} onChangeText={setAdminName} placeholder="Admin Peñalolén" autoCapitalize="words" />
      <Field label="Correo (opcional)" value={adminEmail} onChangeText={setAdminEmail} placeholder="admin@muni.cl" keyboardType="email-address" autoCapitalize="none" />
      <Button label="Crear administrador" onPress={handleCreateAdmin} disabled={!canCreateAdmin} />
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
