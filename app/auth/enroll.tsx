import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';
import { hashPassword, isValidEmail, normalizeEmail, passwordIssues } from '@/domain/auth';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

type Step = 'nombre' | 'correo' | 'codigo' | 'clave' | 'selfie';
const STEPS: Step[] = ['nombre', 'correo', 'codigo', 'clave', 'selfie'];
const STEP_TITLE: Record<Step, string> = {
  nombre: 'Tu nombre',
  correo: 'Verifica tu correo',
  codigo: 'Ingresa el código',
  clave: 'Crea tu clave',
  selfie: 'Tómate una selfie',
};

export default function Enroll() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { getUserByEmail, completeEnrollment } = useAppStore();
  const { signIn } = useSession();
  const [permission, requestPermission] = useCameraPermissions();

  const invitedUser = params.email ? getUserByEmail(normalizeEmail(String(params.email))) : undefined;

  const [step, setStep] = useState<Step>('nombre');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(params.email ? String(params.email) : '');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [selfieId, setSelfieId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);

  const goBackStep = () => {
    setError(null);
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setStep(STEPS[stepIndex - 1]);
  };

  // Genera un "código" de demostración (se muestra en pantalla).
  const sendCode = () => {
    if (!isValidEmail(email)) {
      setError('Ingresa un correo válido.');
      return;
    }
    const demo = String(Math.floor(1000 + Math.random() * 9000));
    setSentCode(demo);
    setError(null);
    setStep('codigo');
  };

  const next = () => {
    setError(null);
    if (step === 'nombre') {
      if (firstName.trim().length < 2 || lastName.trim().length < 2) {
        setError('Ingresa tu nombre y apellido.');
        return;
      }
      setStep('correo');
    } else if (step === 'correo') {
      sendCode();
    } else if (step === 'codigo') {
      // Se acepta cualquier código (demo).
      if (code.trim().length === 0) {
        setError('Ingresa el código que te enviamos.');
        return;
      }
      setStep('clave');
    } else if (step === 'clave') {
      const issue = passwordIssues(pwd);
      if (issue) { setError(issue); return; }
      if (pwd !== pwd2) { setError('Las claves no coinciden.'); return; }
      setStep('selfie');
    } else if (step === 'selfie') {
      finish();
    }
  };

  const finish = () => {
    if (!selfieId) { setError('Tómate la selfie para continuar.'); return; }
    if (!invitedUser) {
      setError('No encontramos la invitación para este correo.');
      return;
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    completeEnrollment(invitedUser.id, {
      name: fullName,
      passwordHash: hashPassword(pwd),
      selfiePhotoId: selfieId,
    });
    signIn({ role: invitedUser.role, userId: invitedUser.id, activeOrgId: invitedUser.orgId });
    router.replace('/');
  };

  const useRealCamera = Platform.OS !== 'web' && permission?.granted === true;

  const footerLabel = step === 'selfie' ? 'Finalizar' : step === 'correo' ? 'Enviar código' : 'Continuar';

  return (
    <Screen
      footer={
        step === 'selfie' && !selfieId ? (
          <Button
            label={useRealCamera ? 'Tomar selfie' : 'Tomar selfie (simulada)'}
            onPress={() => setSelfieId(`selfie_${Date.now()}`)}
          />
        ) : (
          <Button label={footerLabel} onPress={next} />
        )
      }
    >
      <ScreenHeader
        showBack
        onBack={goBackStep}
        title="Primer ingreso"
        subtitle={STEP_TITLE[step]}
        step={`Paso ${stepIndex + 1} de ${STEPS.length}`}
      />

      {!invitedUser ? (
        <Banner tone="error" text="Este correo no tiene una invitación activa. Pide al administrador que te habilite." />
      ) : null}

      {step === 'nombre' ? (
        <>
          <Field label="Nombre" value={firstName} onChangeText={setFirstName} placeholder="Ana" autoCapitalize="words" />
          <Field label="Apellido" value={lastName} onChangeText={setLastName} placeholder="Soto" autoCapitalize="words" />
        </>
      ) : null}

      {step === 'correo' ? (
        <>
          <Field
            label="Correo"
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@organizacion.cl"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!params.email}
          />
          <Banner tone="info" text="Te enviaremos un código de verificación a este correo." />
        </>
      ) : null}

      {step === 'codigo' ? (
        <>
          <Banner tone="warning" text={`Correo de demostración: tu código es ${sentCode}. (En la demo se acepta cualquier código.)`} />
          <Field
            label="Código de verificación"
            value={code}
            onChangeText={setCode}
            placeholder="1234"
            keyboardType="number-pad"
          />
          <Pressable onPress={sendCode}><Text style={styles.resend}>Reenviar código</Text></Pressable>
        </>
      ) : null}

      {step === 'clave' ? (
        <>
          <Field label="Crea tu clave" value={pwd} onChangeText={setPwd} placeholder="Mínimo 6 caracteres" secureTextEntry autoCapitalize="none" />
          <Field label="Repite tu clave" value={pwd2} onChangeText={setPwd2} placeholder="Repite la clave" secureTextEntry autoCapitalize="none" />
        </>
      ) : null}

      {step === 'selfie' ? (
        <View style={styles.selfieWrap}>
          <View style={styles.viewport}>
            {selfieId ? (
              <View style={[styles.fill, styles.done]}><Text style={styles.doneText}>Selfie lista ✓</Text></View>
            ) : useRealCamera ? (
              <CameraView style={styles.fill} facing="front" />
            ) : (
              <View style={[styles.fill, styles.placeholder]}>
                <View style={styles.avatar} />
                <Text style={styles.placeholderText}>Encuadra tu rostro</Text>
              </View>
            )}
          </View>
          {Platform.OS !== 'web' && !permission?.granted ? (
            <Button label="Permitir cámara" variant="secondary" onPress={requestPermission} style={{ marginTop: spacing.md }} />
          ) : null}
          {selfieId ? (
            <Pressable onPress={() => setSelfieId(null)}><Text style={styles.resend}>Volver a tomar</Text></Pressable>
          ) : null}
        </View>
      ) : null}

      {error ? <Banner tone="error" text={error} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  resend: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue, marginTop: spacing.sm, textAlign: 'center' },
  selfieWrap: { marginTop: spacing.sm },
  viewport: { height: 280, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  placeholder: {},
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.border, marginBottom: spacing.md },
  placeholderText: { fontFamily: fonts.regular, fontSize: fontSize.small, color: colors.textSecondary },
  done: { backgroundColor: colors.greenBg },
  doneText: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.green },
});
