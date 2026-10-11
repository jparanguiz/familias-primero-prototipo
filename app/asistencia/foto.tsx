import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Circle, Rect } from 'react-native-svg';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Banner } from '@/components/Banner';
import { useActiveVersion } from '@/components/VersionPicker';
import { useAppStore } from '@/store/AppStore';
import { useAttendanceFlow } from '@/store/AttendanceFlow';
import { useCanTakeAttendance, useVisibleZoneIds } from '@/store/useScope';
import { simulateRecognition } from '@/domain/faceRecognition';
import { versionLabel } from '@/domain/retention';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

function DetectionOverlay() {
  const faces = [
    { x: 45, y: 70 }, { x: 95, y: 62 }, { x: 140, y: 75 },
    { x: 62, y: 130 }, { x: 118, y: 135 },
    { x: 40, y: 190 }, { x: 100, y: 195 }, { x: 145, y: 188 },
  ];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 185 240">
      {faces.map((f, i) => (
        <Circle key={`c${i}`} cx={f.x} cy={f.y} r={16} fill={colors.border} />
      ))}
      {faces.map((f, i) => (
        <Rect key={`r${i}`} x={f.x - 18} y={f.y - 18} width={36} height={36} rx={4} fill="none" stroke={colors.blue} strokeWidth={1.2} />
      ))}
    </Svg>
  );
}

export default function FotoCurso() {
  const router = useRouter();
  const { getZone, listStudents } = useAppStore();
  const { active } = useActiveVersion();
  const { setTarget, setResult } = useAttendanceFlow();
  const canTake = useCanTakeAttendance();
  const myZones = useVisibleZoneIds(active?.id ?? null);
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [zoneId, setZoneId] = useState<string | null>(myZones[0] ?? null);

  useEffect(() => {
    if (!zoneId && myZones.length) setZoneId(myZones[0]);
  }, [myZones, zoneId]);

  useEffect(() => {
    if (active && zoneId) setTarget(active.id, zoneId);
  }, [active, zoneId, setTarget]);

  if (!canTake) {
    return (
      <Screen footer={<Button label="Volver" onPress={() => router.replace('/')} />}>
        <ScreenHeader showBack backLabel="Inicio" title="Asistencia" />
        <Banner tone="warning" text="Solo el tutor del programa puede pasar asistencia." />
      </Screen>
    );
  }

  const enrolled =
    active && zoneId
      ? listStudents({ versionId: active.id, zoneIds: [zoneId] }).filter((v) => v.isEnrolled)
      : [];

  const useRealCamera = Platform.OS !== 'web' && permission?.granted === true;
  const detectedPreview = Math.min(8, enrolled.length);

  const handleCapture = () => {
    if (!active || !zoneId || enrolled.length === 0) return;
    setProcessing(true);
    setTimeout(() => {
      const result = simulateRecognition(enrolled.map((v) => v.student.id));
      setResult(result);
      setProcessing(false);
      router.push('/asistencia/revision');
    }, 700);
  };

  return (
    <Screen scroll={false}>
      <ScreenHeader
        showBack
        backLabel="Inicio"
        title="Asistencia de hoy"
        subtitle={active ? `${versionLabel(active)} · ${getZone(zoneId ?? '')?.name ?? 'elige zona'}` : ''}
        step="Foto"
      />

      {myZones.length > 1 ? (
        <View style={styles.zoneRow}>
          {myZones.map((z) => {
            const activeZone = zoneId === z;
            return (
              <Pressable key={z} onPress={() => setZoneId(z)} style={[styles.zoneChip, activeZone && styles.zoneChipActive]}>
                <Text style={[styles.zoneText, activeZone && styles.zoneTextActive]}>{getZone(z)?.name}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.viewport}>
        {useRealCamera ? (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.placeholder}>
            <DetectionOverlay />
          </View>
        )}
        <View style={styles.chip}>
          <Text style={styles.chipText}>{detectedPreview} rostros detectados</Text>
        </View>
      </View>

      {enrolled.length === 0 ? (
        <Banner tone="warning" text="No hay niños con foto de referencia en esta zona. Inscribe al menos uno." />
      ) : null}

      {Platform.OS !== 'web' && !permission?.granted ? (
        <Banner tone="info" text="Para usar la cámara real habilita el permiso. También puedes continuar con la foto simulada." />
      ) : null}

      <Text style={styles.hint}>Encuadra al grupo y toma la foto</Text>

      <View style={styles.shutterWrap}>
        {Platform.OS !== 'web' && permission && !permission.granted ? (
          <Button label="Permitir cámara" variant="secondary" onPress={requestPermission} style={{ marginBottom: spacing.md }} />
        ) : null}
        <Pressable
          onPress={handleCapture}
          disabled={processing || enrolled.length === 0}
          style={[styles.shutter, (processing || enrolled.length === 0) && styles.shutterDisabled]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
        <Text style={styles.shutterLabel}>{processing ? 'Analizando foto…' : 'Tomar foto'}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  zoneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  zoneChip: {
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  zoneText: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textPrimary },
  zoneTextActive: { color: colors.textOnDark },
  viewport: {
    marginHorizontal: spacing.xl,
    height: 320,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  chip: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.blueBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 11, color: colors.blue },
  hint: { fontFamily: fonts.regular, fontSize: fontSize.small, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  shutterWrap: { alignItems: 'center', marginTop: spacing.md, paddingBottom: spacing.xl },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.4 },
  shutterInner: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.textPrimary },
  shutterLabel: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing.sm },
});
