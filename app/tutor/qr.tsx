import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';
import { useVisibleZoneIds } from '@/store/useScope';
import { useActiveVersion } from '@/components/VersionPicker';
import { encodeOnboardingQr } from '@/domain/qr';
import { versionLabel } from '@/domain/retention';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/** QR determinista a partir de un string (patrón visual, no decodificable real). */
function QrFromString({ value, size = 180 }: { value: string; size?: number }) {
  const n = 21;
  const cells = useMemo(() => {
    // Hash simple para generar un patrón estable a partir del valor.
    const grid: boolean[][] = [];
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let seed = h >>> 0;
    const rnd = () => {
      seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let y = 0; y < n; y += 1) {
      const row: boolean[] = [];
      for (let x = 0; x < n; x += 1) row.push(rnd() > 0.5);
      grid.push(row);
    }
    // Dibuja los tres "ojos" característicos.
    const eye = (ox: number, oy: number) => {
      for (let y = 0; y < 7; y += 1)
        for (let x = 0; x < 7; x += 1) {
          const border = x === 0 || x === 6 || y === 0 || y === 6;
          const center = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          grid[oy + y][ox + x] = border || center;
        }
    };
    eye(0, 0);
    eye(n - 7, 0);
    eye(0, n - 7);
    return grid;
  }, [value]);

  const s = size / n;
  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" />
      {cells.map((row, y) =>
        row.map((on, x) =>
          on ? <Rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill={colors.textPrimary} /> : null
        )
      )}
    </Svg>
  );
}

export default function TutorQr() {
  const router = useRouter();
  const { session } = useSession();
  const { getUser, getZone } = useAppStore();
  const { active } = useActiveVersion();
  const myZones = useVisibleZoneIds(active?.id ?? null);

  const user = session?.userId ? getUser(session.userId) : undefined;
  const [zoneId, setZoneId] = useState<string | null>(myZones[0] ?? null);

  const canGenerate = Boolean(active && zoneId);
  const qrValue = canGenerate
    ? encodeOnboardingQr({ versionId: active!.id, zoneId: zoneId!, userId: user?.id })
    : '';

  return (
    <Screen footer={
      <Button
        label="Simular escaneo del apoderado"
        disabled={!canGenerate}
        onPress={() => router.push({ pathname: '/onboarding', params: { qr: qrValue } })}
      />
    }>
      <ScreenHeader showBack backLabel="Inicio" title="Iniciar inscripción" subtitle="Comparte este QR al apoderado" step="QR" />

      <Text style={styles.label}>Zona para esta inscripción</Text>
      <View style={styles.wrap}>
        {myZones.map((z) => {
          const name = getZone(z)?.name ?? z;
          const activeZone = zoneId === z;
          return (
            <Pressable key={z} onPress={() => setZoneId(z)} style={[styles.chip, activeZone && styles.chipActive]}>
              <Text style={[styles.chipText, activeZone && styles.chipTextActive]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      {canGenerate ? (
        <>
          <View style={styles.qrBox}>
            <QrFromString value={qrValue} />
          </View>
          <Banner
            tone="info"
            text={`Al escanear, el apoderado inicia el onboarding en ${versionLabel(active!)} · ${getZone(zoneId!)?.name}. Quedará registrado que lo iniciaste tú.`}
          />
          <Text style={styles.code}>{qrValue}</Text>
        </>
      ) : (
        <Banner tone="warning" text="Selecciona una zona para generar el QR." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textPrimary },
  chipTextActive: { color: colors.textOnDark },
  qrBox: {
    alignSelf: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  code: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
