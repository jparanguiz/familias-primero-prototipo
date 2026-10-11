import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { useActiveOrgId } from '@/store/useScope';
import { ZoneKind } from '@/domain/types';
import { suggestedEndDate, versionLabel } from '@/domain/retention';
import { formatDate, formatSignedAt } from '@/domain/format';
import { downloadZonesTemplate, normalizeZoneKind, pick, pickAndParse } from '@/domain/bulkImport';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const KINDS: ZoneKind[] = ['Colegio', 'Municipalidad', 'Biblioteca', 'Otra'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function AdminZonas() {
  const params = useLocalSearchParams<{ versionId?: string }>();
  const {
    createZone,
    getVersion,
    getZoneAssignment,
    zonesInVersion,
    versionsInOrg,
    zonesInOrg,
    attachZoneToVersion,
    detachZoneFromVersion,
    logZoneContact,
  } = useAppStore();
  const orgId = useActiveOrgId();

  const versions = orgId ? versionsInOrg(orgId) : [];
  const zones = orgId ? zonesInOrg(orgId) : [];

  const [versionId, setVersionId] = useState<string | null>(
    params.versionId ? String(params.versionId) : versions[0]?.id ?? null
  );

  // Alta de zona nueva (catálogo).
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [kind, setKind] = useState<ZoneKind>('Colegio');
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cRole, setCRole] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // Agregar zona existente a la versión con fechas.
  const [addZoneId, setAddZoneId] = useState<string | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const participating = versionId ? zonesInVersion(versionId) : [];
  const participatingIds = new Set(participating.map((z) => z.id));
  const availableToAdd = zones.filter((z) => !participatingIds.has(z.id));

  const canCreateZone =
    name.trim().length >= 3 && address.trim().length >= 3 && cName.trim() && cPhone.trim() && cEmail.trim() && cRole.trim();

  const handleCreateZone = () => {
    if (!canCreateZone) {
      setMsg('Completa los datos de la institución y del contacto responsable.');
      return;
    }
    if (!orgId) return;
    const z = createZone(orgId, {
      name: name.trim(),
      address: address.trim(),
      kind,
      contact: { name: cName.trim(), phone: cPhone.trim(), email: cEmail.trim(), role: cRole.trim() },
    });
    setMsg(`Zona creada: ${z.name}. Ya puedes agregarla a una versión.`);
    setName(''); setAddress(''); setCName(''); setCPhone(''); setCEmail(''); setCRole('');
  };

  const onStartChange = (v: string) => {
    setStart(v);
    if (DATE_RE.test(v) && !end) setEnd(suggestedEndDate(v));
  };

  const canAttach = Boolean(versionId && addZoneId && DATE_RE.test(start) && DATE_RE.test(end));
  const handleAttach = () => {
    if (!canAttach || !versionId || !addZoneId) return;
    attachZoneToVersion(versionId, addZoneId, start, end);
    setMsg('Zona agregada a la versión con sus fechas.');
    setAddZoneId(null); setStart(''); setEnd('');
  };

  const handleBulk = async () => {
    try {
      const file = await pickAndParse();
      if (!file) return;
      if (!orgId) return;
      let created = 0;
      file.rows.forEach((row) => {
        const zn = pick(row, 'nombre', 'name', 'institucion');
        const addr = pick(row, 'direccion', 'address');
        if (!zn || !addr) return;
        createZone(orgId, {
          name: zn,
          address: addr,
          kind: normalizeZoneKind(pick(row, 'tipo', 'kind')),
          contact: {
            name: pick(row, 'contacto_nombre', 'contacto', 'responsable'),
            phone: pick(row, 'contacto_telefono', 'telefono', 'fono'),
            email: pick(row, 'contacto_email', 'email', 'correo'),
            role: pick(row, 'contacto_cargo', 'cargo'),
          },
        });
        created += 1;
      });
      setMsg(`Carga masiva: ${created} zonas creadas desde ${file.name}.`);
    } catch (e) {
      setMsg('No se pudo leer el archivo. Revisa el formato.');
    }
  };

  const confirmDetach = (zoneId: string, zoneName: string) => {
    const doIt = () => detachZoneFromVersion(versionId!, zoneId);
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`¿Quitar ${zoneName} de esta versión? Se quitarán también sus asignaciones de staff.`)) doIt();
      return;
    }
    Alert.alert('Quitar zona', `¿Quitar ${zoneName} de esta versión?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: doIt },
    ]);
  };

  const version = versionId ? getVersion(versionId) : undefined;

  return (
    <Screen>
      <ScreenHeader showBack backLabel="Inicio" title="Zonas de la versión" subtitle="Primero confirma la zona, luego convoca niños" />

      <Select
        label="Versión"
        placeholder="Elige una versión"
        value={versionId}
        onChange={setVersionId}
        options={versions.map((v) => ({ value: v.id, label: versionLabel(v) }))}
      />

      {msg ? <Banner tone="success" text={msg} /> : null}

      {version ? (
        <>
          <Text style={styles.sectionLabel}>Zonas en {versionLabel(version)}</Text>
          {participating.length === 0 ? (
            <Banner tone="neutral" text="Aún no hay zonas en esta versión." />
          ) : (
            participating.map((z) => {
              const a = getZoneAssignment(versionId!, z.id);
              return (
                <View key={z.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.zTitle}>{z.name}</Text>
                    <Pressable onPress={() => confirmDetach(z.id, z.name)}>
                      <Text style={styles.remove}>Quitar</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.zMeta}>{z.kind} · {z.address}</Text>
                  {a ? <Text style={styles.zDates}>Del {formatDate(a.startDate)} al {formatDate(a.endDate)}</Text> : null}
                  <Text style={styles.zContact}>
                    Contacto: {z.contact.name} ({z.contact.role}) · {z.contact.phone} · {z.contact.email}
                  </Text>
                  <Pressable onPress={() => logZoneContact(z.id, 'Convocatoria de la versión', undefined)}>
                    <Text style={styles.logLink}>Registrar uso del contacto</Text>
                  </Pressable>
                  {z.contactLog.length > 0 ? (
                    <Text style={styles.logMeta}>
                      Último uso: {formatSignedAt(z.contactLog[0].at)} · {z.contactLog[0].reason} ({z.contactLog.length} en total)
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}

          <Text style={styles.sectionLabel}>Agregar zona a la versión</Text>
          <Select
            label="Zona (del catálogo)"
            placeholder="Elige una zona ya creada"
            value={addZoneId}
            onChange={setAddZoneId}
            options={availableToAdd.map((z) => ({ value: z.id, label: z.name, sublabel: `${z.kind} · ${z.address}` }))}
          />
          <Field label="Fecha de inicio (AAAA-MM-DD)" value={start} onChangeText={onStartChange} placeholder="2027-01-11" autoCapitalize="none" />
          <Field label="Fecha de fin (sugerida: 10 días hábiles)" value={end} onChangeText={setEnd} placeholder="2027-01-22" autoCapitalize="none" />
          <Button label="Agregar a la versión" onPress={handleAttach} disabled={!canAttach} variant="secondary" />
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Crear zona nueva (catálogo)</Text>
      <Field label="Nombre de la institución" value={name} onChangeText={setName} placeholder="Colegio Lo Espejo" autoCapitalize="words" />
      <Field label="Dirección" value={address} onChangeText={setAddress} placeholder="Av. Central 123" autoCapitalize="words" />
      <Select
        label="Tipo"
        value={kind}
        onChange={(v) => setKind(v as ZoneKind)}
        options={KINDS.map((k) => ({ value: k, label: k }))}
        searchable={false}
      />
      <Text style={styles.subhead}>Contacto responsable</Text>
      <Field label="Nombre" value={cName} onChangeText={setCName} placeholder="Rosa Fernández" autoCapitalize="words" />
      <Field label="Teléfono" value={cPhone} onChangeText={setCPhone} placeholder="+56 9 1111 1111" keyboardType="phone-pad" />
      <Field label="Correo" value={cEmail} onChangeText={setCEmail} placeholder="rosa@colegio.cl" keyboardType="email-address" autoCapitalize="none" />
      <Field label="Cargo" value={cRole} onChangeText={setCRole} placeholder="Directora" autoCapitalize="words" />
      <Button label="Crear zona" onPress={handleCreateZone} disabled={!canCreateZone} />

      <Text style={styles.sectionLabel}>Carga masiva</Text>
      <View style={{ gap: spacing.sm }}>
        <Button label="Importar zonas (.xlsx / .csv)" variant="secondary" onPress={handleBulk} />
        <Pressable onPress={downloadZonesTemplate}>
          <Text style={styles.templateLink}>Descargar plantilla de zonas</Text>
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
  subhead: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.xs },
  card: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zTitle: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary },
  remove: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.red },
  zMeta: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  zDates: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.blue, marginTop: spacing.xs },
  zContact: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: spacing.xs },
  logLink: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.blue, marginTop: spacing.sm },
  logMeta: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },
  templateLink: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.blue, textAlign: 'center', paddingVertical: spacing.xs },
});
