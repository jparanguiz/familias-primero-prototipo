import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { useOnboarding } from '@/store/OnboardingFlow';
import { formatRun, isValidRun } from '@/domain/run';
import { versionLabel } from '@/domain/retention';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function OnboardingNino() {
  const router = useRouter();
  const { getVersion, getZone } = useAppStore();
  const { versionId, zoneId, child, setChild } = useOnboarding();

  const [name, setName] = useState(child.name);
  const [birthDate, setBirthDate] = useState(child.birthDate);
  const [grade, setGrade] = useState(child.grade);
  const [run, setRun] = useState(child.run);
  const [touched, setTouched] = useState(false);

  const nameValid = name.trim().length >= 3;
  const birthValid = DATE_RE.test(birthDate.trim());
  const gradeValid = grade.trim().length >= 1;
  const runValid = useMemo(() => isValidRun(run), [run]);
  const canContinue = nameValid && birthValid && gradeValid && runValid;

  const version = versionId ? getVersion(versionId) : undefined;
  const zone = zoneId ? getZone(zoneId) : undefined;

  const handleContinue = () => {
    setTouched(true);
    if (!canContinue) return;
    setChild({ name: name.trim(), birthDate: birthDate.trim(), grade: grade.trim(), run: formatRun(run) });
    router.push('/onboarding/foto');
  };

  return (
    <Screen footer={<Button label="Continuar" onPress={handleContinue} disabled={!canContinue} />}>
      <ScreenHeader showBack title="Datos del niño" subtitle="Todos los campos son obligatorios" step="Onboarding" />

      {version && zone ? <Banner tone="neutral" text={`${versionLabel(version)} · ${zone.name}`} /> : null}

      <Field
        label="Nombre completo del niño/a"
        value={name}
        onChangeText={setName}
        placeholder="Martina Soto"
        autoCapitalize="words"
        hint={touched && !nameValid ? 'Ingresa el nombre completo.' : undefined}
        hintTone="error"
      />
      <Field
        label="Fecha de nacimiento (AAAA-MM-DD)"
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="2018-05-14"
        autoCapitalize="none"
        hint={touched && !birthValid ? 'Usa el formato AAAA-MM-DD.' : undefined}
        hintTone="error"
      />
      <Field
        label="Curso / nivel"
        value={grade}
        onChangeText={setGrade}
        placeholder="3° básico A"
        autoCapitalize="words"
        hint={touched && !gradeValid ? 'Ingresa el curso o nivel.' : undefined}
        hintTone="error"
      />
      <Field
        label="RUN del niño/a"
        value={run}
        onChangeText={(t) => setRun(formatRun(t))}
        placeholder="22.333.444-5"
        autoCapitalize="characters"
        hint={
          !run
            ? touched
              ? 'Ingresa el RUN del niño.'
              : undefined
            : runValid
              ? 'RUN válido'
              : 'El RUN no es válido. Revisa el dígito verificador.'
        }
        hintTone={run && runValid ? 'success' : 'error'}
      />
    </Screen>
  );
}
