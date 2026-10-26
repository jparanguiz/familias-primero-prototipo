import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { Banner } from '@/components/Banner';
import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';

export default function ApoderadoEntry() {
  const router = useRouter();
  const { orgs } = useAppStore();
  const { signIn } = useSession();
  const [orgId, setOrgId] = useState<string | null>(null);

  const enter = () => {
    if (!orgId) return;
    signIn({ role: 'apoderado', userId: null, activeOrgId: orgId });
    router.replace('/');
  };

  return (
    <Screen footer={<Button label="Continuar" onPress={enter} disabled={!orgId} />}>
      <ScreenHeader showBack title="Soy apoderado/a" subtitle="Inscribe a tu hijo/a en el programa" />
      <Banner tone="info" text="Los apoderados no necesitan cuenta: solo elige la organización del programa." />
      <Select
        label="Organización del programa"
        placeholder="Elige una organización"
        value={orgId}
        onChange={setOrgId}
        options={orgs.map((o) => ({ value: o.id, label: o.name, sublabel: o.type }))}
      />
    </Screen>
  );
}
