import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Banner } from '@/components/Banner';
import { Select } from '@/components/Select';
import { useAppStore } from '@/store/AppStore';
import { useOnboarding } from '@/store/OnboardingFlow';
import { useActiveOrgId } from '@/store/useScope';
import { EnrollmentChannel } from '@/domain/types';
import { decodeOnboardingQr } from '@/domain/qr';
import { versionLabel } from '@/domain/retention';

export default function OnboardingContexto() {
  const router = useRouter();
  const params = useLocalSearchParams<{ qr?: string; channel?: string; by?: string }>();
  const { getVersion, getZone, zonesInVersion, versionsInOrg, getVersion: getV } = useAppStore();
  const { versionId, zoneId, setContext } = useOnboarding();
  const sessionOrgId = useActiveOrgId();

  const [vId, setVId] = useState<string | null>(versionId);
  const [zId, setZId] = useState<string | null>(zoneId);
  const [orgId, setOrgId] = useState<string | null>(sessionOrgId);
  const [channel, setChannel] = useState<EnrollmentChannel>('apoderado');
  const [byUserId, setByUserId] = useState<string | null>(null);
  const [fromQr, setFromQr] = useState(false);
  const [locked, setLocked] = useState(false);

  const versions = orgId ? versionsInOrg(orgId) : [];

  // Precarga desde QR (del apoderado al escanear) o desde "Inscribir yo mismo" (tutor).
  useEffect(() => {
    if (locked) return;
    if (params.qr) {
      const decoded = decodeOnboardingQr(String(params.qr));
      if (decoded) {
        const v = getV(decoded.versionId);
        setOrgId(v?.orgId ?? sessionOrgId);
        setVId(decoded.versionId);
        setZId(decoded.zoneId);
        setChannel('tutor');
        setByUserId(decoded.userId ?? null);
        setFromQr(true);
        setLocked(true);
      }
    } else if (params.channel === 'tutor' && params.by) {
      setChannel('tutor');
      setByUserId(String(params.by));
    }
  }, [params.qr, params.channel, params.by, locked, getV, sessionOrgId]);

  const zonesForVersion = vId ? zonesInVersion(vId) : [];
  const canContinue = Boolean(vId && zId);

  const handleContinue = () => {
    if (!vId || !zId || !orgId) return;
    setContext({ orgId, versionId: vId, zoneId: zId, channel, enrolledByUserId: byUserId });
    router.push('/onboarding/nino');
  };

  return (
    <Screen footer={<Button label="Continuar" onPress={handleContinue} disabled={!canContinue} />}>
      <ScreenHeader showBack backLabel="Atrás" title="Inscribir un niño" subtitle="Elige versión y zona" step="Onboarding" />

      {fromQr ? <Banner tone="info" text="Datos precargados desde el QR del tutor del programa." /> : null}
      {channel === 'tutor' && !fromQr ? <Banner tone="info" text="Inscripción iniciada por el tutor del programa." /> : null}

      <Select
        label="Versión del programa"
        placeholder="Elige una versión"
        value={vId}
        onChange={(v) => { setVId(v); setZId(null); }}
        options={versions.map((v) => ({ value: v.id, label: versionLabel(v) }))}
      />

      {vId ? (
        zonesForVersion.length === 0 ? (
          <Banner tone="warning" text="Esta versión aún no tiene zonas disponibles." />
        ) : (
          <Select
            label="Zona (institución)"
            placeholder="Elige una zona"
            value={zId}
            onChange={setZId}
            options={zonesForVersion.map((z) => ({ value: z.id, label: z.name, sublabel: `${z.kind} · ${z.address}` }))}
          />
        )
      ) : null}

      {vId && zId ? (
        <Banner tone="neutral" text={`Inscribirás en ${versionLabel(getVersion(vId)!)} · ${getZone(zId)?.name}`} />
      ) : null}
    </Screen>
  );
}
