import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { hashPassword, isValidEmail, normalizeEmail, passwordIssues } from '@/domain/auth';
import { colors, fonts, fontSize, spacing } from '@/theme';

type Step = 'correo' | 'codigo' | 'clave' | 'listo';

export default function Recover() {
  const router = useRouter();
  const { getUserByEmail, setUserPassword } = useAppStore();

  const [step, setStep] = useState<Step>('correo');
  const [email, setEmail] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sendCode = () => {
    setError(null);
    if (!isValidEmail(email)) { setError('Ingresa un correo válido.'); return; }
    const user = getUserByEmail(normalizeEmail(email));
    if (!user) { setError('No encontramos una cuenta con ese correo.'); return; }
    setSentCode(String(Math.floor(1000 + Math.random() * 9000)));
    setStep('codigo');
  };

  const next = () => {
    setError(null);
    if (step === 'codigo') {
      if (code.trim().length === 0) { setError('Ingresa el código que te enviamos.'); return; }
      setStep('clave');
    } else if (step === 'clave') {
      const issue = passwordIssues(pwd);
      if (issue) { setError(issue); return; }
      if (pwd !== pwd2) { setError('Las claves no coinciden.'); return; }
      const user = getUserByEmail(normalizeEmail(email));
      if (user) setUserPassword(user.id, hashPassword(pwd));
      setStep('listo');
    }
  };

  return (
    <Screen
      footer={
        step === 'correo' ? (
          <Button label="Enviar código" onPress={sendCode} />
        ) : step === 'listo' ? (
          <Button label="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
        ) : (
          <Button label={step === 'clave' ? 'Guardar nueva clave' : 'Continuar'} onPress={next} />
        )
      }
    >
      <ScreenHeader showBack title="Recuperar clave" subtitle="Te enviaremos un código a tu correo" />

      {step === 'correo' ? (
        <Field
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tucorreo@organizacion.cl"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      ) : null}

      {step === 'codigo' ? (
        <>
          <Banner tone="warning" text={`Correo de demostración: tu código es ${sentCode}. (En la demo se acepta cualquier código.)`} />
          <Field label="Código de verificación" value={code} onChangeText={setCode} placeholder="1234" keyboardType="number-pad" />
          <Pressable onPress={sendCode}><Text style={styles.resend}>Reenviar código</Text></Pressable>
        </>
      ) : null}

      {step === 'clave' ? (
        <>
          <Field label="Nueva clave" value={pwd} onChangeText={setPwd} placeholder="Mínimo 6 caracteres" secureTextEntry autoCapitalize="none" />
          <Field label="Repite la nueva clave" value={pwd2} onChangeText={setPwd2} placeholder="Repite la clave" secureTextEntry autoCapitalize="none" />
        </>
      ) : null}

      {step === 'listo' ? (
        <Banner tone="success" text="Tu clave fue restablecida. Ya puedes iniciar sesión." />
      ) : null}

      {error ? <Banner tone="error" text={error} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  resend: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue, marginTop: spacing.sm, textAlign: 'center' },
});
