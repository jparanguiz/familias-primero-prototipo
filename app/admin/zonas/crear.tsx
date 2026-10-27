import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { useActiveOrgId } from '@/store/useScope';
import { ZoneKind } from '@/domain/types';
import { suggestedEndDate } from '@/domain/retention';
import {
  downloadZonesTemplate,
  normalizeZoneKind,
  parseVersionText,
  pick,
  pickAndParse,
} from '@/domain/bulkImport';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const KINDS: ZoneKind[] = ['Colegio', 'Municipalidad', 'Biblioteca', 'Otra'];

export default function CrearZona() {
  const params = useLocalSearchParams<{ versionId?: string }>();
  const router = useRouter();
  const { createZone, findVersion, attachZoneToVersion } = useAppStore();
  const orgId = useActiveOrgId();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [kind, setKind] = useState<ZoneKind>('Colegio');
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cRole, setCRole] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreate =
    name.trim().length >= 3 && address.trim().length >= 3 && cName.trim() && cPhone.trim() && cEmail.trim() && cRole.trim();

  const handleCreate = () => {
    if (!canCreate) { setError('Completa los datos de la institución y del contacto responsable.'); return; }
    if (!orgId) return;
    createZone(orgId, {
      name: name.trim(),
      address: address.trim(),
      kind,
      contact: { name: cName.trim(), phone: cPhone.trim(), email: cEmail.trim(), role: cRole.trim() },
    });
    // Vuelve a "Agregar zona" para sumarla a la versión con sus fechas.
    router.back();
  };

  const handleBulk = async () => {
    setError(null);
    try {
      const file = await pickAndParse();
      if (!file) return;
      if (!orgId) return;
      let created = 0;
      let attached = 0;
      file.rows.forEach((row) => {
        const zn = pick(row, 'nombre', 'name', 'institucion');
        const addr = pick(row, 'direccion', 'address');
        if (!zn || !addr) return;
        const zone = createZone(orgId, {
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
        // Columna 'version' opcional: si coincide con una versión existente, la sumamos.
        const vtext = pick(row, 'version', 'versión', 'temporada');
        const parsed = vtext ? parseVersionText(vtext) : null;
        if (parsed) {
          const v = findVersion(orgId, parsed.season, parsed.year);
          if (v) {
            const start = pick(row, 'inicio', 'fecha_inicio', 'startdate');
            const startDate = /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : '';
            // Solo se suma a la versión si el CSV trae una fecha de inicio válida.
            if (startDate) {
              const end = pick(row, 'fin', 'fecha_fin', 'enddate');
              const endDate = /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : suggestedEndDate(startDate);
              attachZoneToVersion(v.id, zone.id, startDate, endDate);
              attached += 1;
            }
          }
        }
      });
      setMsg(
        `Carga masiva: ${created} zonas creadas` +
          (attached > 0 ? ` · ${attached} sumadas a su versión.` : '.')
      );
    } catch {
      setError('No se pudo leer el archivo. Revisa el formato.');
    }
  };

  return (
    <Screen footer={<Button label="Crear zona" onPress={handleCreate} disabled={!canCreate} />}>
      <ScreenHeader showBack backLabel="Agregar zona" title="Crear una zona nueva" subtitle="Institución y contacto responsable" />

      {msg ? <Banner tone="success" text={msg} /> : null}

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

      {error ? <Banner tone="error" text={error} /> : null}

      <Text style={styles.sectionLabel}>Carga masiva</Text>
      <Banner tone="neutral" text="Importa varias zonas desde .xlsx o .csv. La columna 'version' (ej. Verano 2027) es opcional: si coincide con una versión existente, la zona se suma a esa versión." />
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
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  subhead: { fontFamily: fonts.medium, fontSize: fontSize.body, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md },
  templateLink: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.blue, textAlign: 'center', paddingVertical: spacing.xs },
});
