import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { OrgType } from '@/domain/types';
import { formatDate } from '@/domain/format';
import { isValidEmail } from '@/domain/auth';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const TYPES: { value: OrgType; label: string }[] = [
  { value: 'fundacion', label: 'Fundación' },
  { value: 'municipalidad', label: 'Municipalidad' },
  { value: 'institucion', label: 'Institución' },
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function Organizaciones() {
  const router = useRouter();
  const { orgs, usersInOrg, createOrganization, inviteUser } = useAppStore();

  const [msg, setMsg] = useState<string | null>(null);

  // --- Modal "Nueva organización" ---
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<OrgType>('municipalidad');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetOrgForm = () => {
    setName(''); setType('municipalidad'); setStart(''); setEnd(''); setAdminEmail(''); setFormError(null);
  };

  const canCreateOrg =
    name.trim().length >= 3 &&
    DATE_RE.test(start) &&
    (adminEmail.trim() === '' || isValidEmail(adminEmail));

  const handleCreateOrg = () => {
    if (name.trim().length < 3 || !DATE_RE.test(start)) {
      setFormError('Ingresa nombre y fecha de inicio de licencia (AAAA-MM-DD).');
      return;
    }
    if (adminEmail.trim() !== '' && !isValidEmail(adminEmail)) {
      setFormError('El correo del administrador no es válido.');
      return;
    }
    const org = createOrganization(name.trim(), type, {
      status: 'activa',
      startDate: start,
      endDate: DATE_RE.test(end) ? end : undefined,
    });
    let extra = '';
    if (adminEmail.trim() !== '') {
      const res = inviteUser(org.id, adminEmail.trim(), 'admin');
      extra = 'error' in res ? ` (ojo: ${res.error})` : ` · administrador habilitado: ${res.email}`;
    }
    setMsg(`Organización creada: ${org.name}${extra}.`);
    resetOrgForm();
    setOrgModalOpen(false);
  };

  const openModal = () => { resetOrgForm(); setOrgModalOpen(true); };

  return (
    <Screen>
      <ScreenHeader showBack backLabel="Inicio" title="Organizaciones y licencias" subtitle="Transferencia del programa" />

      {msg ? <Banner tone="success" text={msg} /> : null}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Organizaciones</Text>
        <Pressable onPress={openModal} hitSlop={8}>
          <Text style={styles.addLink}>+ Agregar</Text>
        </Pressable>
      </View>

      <Banner tone="neutral" text="Toca una organización para gestionar sus usuarios y su licencia." />

      {orgs.map((o) => {
        const admins = usersInOrg(o.id).filter((u) => u.role === 'admin');
        const total = usersInOrg(o.id).length;
        const suspended = o.license.status === 'suspendida';
        return (
          <Pressable
            key={o.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/super/organizacion/${o.id}`)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.oName}>{o.name}</Text>
              <Text style={[styles.badge, suspended ? styles.badgeOff : styles.badgeOn]}>
                {suspended ? 'Suspendida' : 'Activa'}
              </Text>
            </View>
            <Text style={styles.oMeta}>
              {o.type} · desde {formatDate(o.license.startDate)}{o.license.endDate ? ` hasta ${formatDate(o.license.endDate)}` : ''}
            </Text>
            <View style={styles.cardBottom}>
              <Text style={styles.oMeta}>
                {total} usuario{total === 1 ? '' : 's'}
                {admins.length ? ` · Admin: ${admins.map((a) => a.name || a.email).join(', ')}` : ' · sin admin'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        );
      })}

      <Button label="Agregar organización" onPress={openModal} style={{ marginTop: spacing.sm }} />

      {/* Modal nueva organización */}
      <Modal visible={orgModalOpen} animationType="slide" transparent onRequestClose={() => setOrgModalOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Nueva organización</Text>
              <Pressable onPress={() => setOrgModalOpen(false)} hitSlop={8}>
                <Text style={styles.close}>Cancelar</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }} keyboardShouldPersistTaps="handled">
              <Field label="Nombre" value={name} onChangeText={setName} placeholder="Municipalidad de Peñalolén" autoCapitalize="words" />
              <Select label="Tipo" value={type} onChange={(v) => setType(v as OrgType)} options={TYPES} searchable={false} />
              <Field label="Inicio de licencia (AAAA-MM-DD)" value={start} onChangeText={setStart} placeholder="2027-01-01" autoCapitalize="none" />
              <Field label="Fin de licencia (opcional)" value={end} onChangeText={setEnd} placeholder="2027-12-31" autoCapitalize="none" />
              <Field
                label="Correo del administrador (opcional)"
                value={adminEmail}
                onChangeText={setAdminEmail}
                placeholder="admin@organizacion.cl"
                keyboardType="email-address"
                autoCapitalize="none"
                hint="Si lo indicas, queda habilitado como administrador de esta organización."
              />
              {formError ? <Banner tone="error" text={formError} /> : null}
              <Button label="Crear organización" onPress={handleCreateOrg} disabled={!canCreateOrg} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  addLink: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
  card: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  cardPressed: { backgroundColor: colors.surface },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  oName: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, flex: 1 },
  badge: { fontFamily: fonts.medium, fontSize: 11, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, overflow: 'hidden' },
  badgeOn: { backgroundColor: colors.greenBg, color: colors.green },
  badgeOff: { backgroundColor: colors.redBg, color: colors.red },
  oMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2, flex: 1 },
  chevron: { fontSize: 22, color: colors.textMuted, marginLeft: spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sheetTitle: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.textPrimary },
  close: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
});
