import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { useOnboarding } from '@/store/OnboardingFlow';
import { useConsentFlow } from '@/store/ConsentFlow';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/**
 * Foto del niño en el onboarding. Esta foto es la "foto de referencia" que se
 * usará para el reconocimiento facial al pasar asistencia. Al confirmar, se
 * crea el alumno y se encadena al flujo de consentimiento.
 */
export default function OnboardingFoto() {
  const router = useRouter();
  const { enrollStudent } = useAppStore();
  const {
    orgId,
    versionId,
    zoneId,
    child,
    childPhotoId,
    channel,
    enrolledByUserId,
    setChildPhoto,
    setStudentId,
  } = useOnboarding();
  const { setStudentId: setConsentStudent } = useConsentFlow();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  const useRealCamera = Platform.OS !== 'web' && permission?.granted === true;
  const hasPhoto = Boolean(childPhotoId);

  const takePhoto = () => {
    // Simula la captura/carga de la foto del niño.
    setChildPhoto(`childphoto_${Date.now()}`);
  };

  const handleContinue = () => {
    if (!orgId || !versionId || !zoneId || !hasPhoto) return;
    setBusy(true);
    const student = enrollStudent({
      orgId,
      name: child.name,
      birthDate: child.birthDate,
      grade: child.grade,
      run: child.run,
      versionId,
      zoneId,
      referencePhotoId: childPhotoId!,
      enrollmentChannel: channel,
      enrolledByUserId: enrolledByUserId ?? undefined,
    });
    setStudentId(student.id);
    // Encadena al consentimiento con el alumno recién creado.
    setConsentStudent(student.id);
    setBusy(false);
    router.push('/onboarding/1a');
  };

  return (
    <Screen
      footer={
        <Button
          label={hasPhoto ? 'Continuar al consentimiento' : 'Tomar / subir foto'}
          onPress={hasPhoto ? handleContinue : takePhoto}
          loading={busy}
        />
      }
    >
      <ScreenHeader showBack title="Foto del niño" subtitle="Se usará para registrar su asistencia" step="Onboarding" />

      <View style={styles.viewport}>
        {useRealCamera ? (
          <CameraView style={StyleSheet.absoluteFill} facing="front" />
        ) : hasPhoto ? (
          <View style={[StyleSheet.absoluteFill, styles.photoDone]}>
            <Text style={styles.photoDoneText}>Foto lista ✓</Text>
          </View>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
            <View style={styles.avatar} />
            <Text style={styles.placeholderText}>Encuadra el rostro del niño/a</Text>
          </View>
        )}
      </View>

      {Platform.OS !== 'web' && !permission?.granted ? (
        <Button
          label="Permitir cámara"
          variant="secondary"
          onPress={requestPermission}
          style={{ marginBottom: spacing.md }}
        />
      ) : null}

      {hasPhoto ? (
        <>
          <Banner tone="success" text="Foto registrada. Esta será la foto de referencia del niño." />
          <Pressable onPress={() => setChildPhoto('')}>
            <Text style={styles.retake}>Volver a tomar</Text>
          </Pressable>
        </>
      ) : (
        <Banner
          tone="info"
          text="La foto del niño es obligatoria: permite reconocerlo en la foto grupal de asistencia."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  viewport: {
    height: 300,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  placeholderText: { fontFamily: fonts.regular, fontSize: fontSize.small, color: colors.textSecondary },
  photoDone: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenBg },
  photoDoneText: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.green },
  retake: {
    fontFamily: fonts.medium,
    fontSize: fontSize.small,
    color: colors.blue,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
