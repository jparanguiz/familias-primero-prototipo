import React, { createContext, useContext, useMemo, useState } from 'react';
import { EnrollmentChannel } from '@/domain/types';

export interface ChildData {
  name: string;
  birthDate: string;
  grade: string;
  run: string;
}

interface OnboardingState {
  orgId: string | null;
  versionId: string | null;
  zoneId: string | null;
  child: ChildData;
  childPhotoId: string | null;
  /** Canal de ingreso: 'apoderado' (público) o 'tutor' (lo inició el staff). */
  channel: EnrollmentChannel;
  /** Tutor del staff que inició el onboarding (si aplica). */
  enrolledByUserId: string | null;
  studentId: string | null;
}

interface OnboardingValue extends OnboardingState {
  setContext: (args: {
    orgId: string;
    versionId: string;
    zoneId: string;
    channel?: EnrollmentChannel;
    enrolledByUserId?: string | null;
  }) => void;
  setChild: (child: ChildData) => void;
  setChildPhoto: (photoId: string) => void;
  setStudentId: (id: string) => void;
  reset: () => void;
}

const emptyChild: ChildData = { name: '', birthDate: '', grade: '', run: '' };

const defaultState: OnboardingState = {
  orgId: null,
  versionId: null,
  zoneId: null,
  child: emptyChild,
  childPhotoId: null,
  channel: 'apoderado',
  enrolledByUserId: null,
  studentId: null,
};

const Ctx = createContext<OnboardingValue | null>(null);

export function OnboardingFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);

  const value = useMemo<OnboardingValue>(
    () => ({
      ...state,
      setContext: ({ orgId, versionId, zoneId, channel = 'apoderado', enrolledByUserId = null }) =>
        setState((p) => ({ ...p, orgId, versionId, zoneId, channel, enrolledByUserId })),
      setChild: (child) => setState((p) => ({ ...p, child })),
      setChildPhoto: (childPhotoId) => setState((p) => ({ ...p, childPhotoId })),
      setStudentId: (studentId) => setState((p) => ({ ...p, studentId })),
      reset: () => setState(defaultState),
    }),
    [state]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOnboarding debe usarse dentro de <OnboardingFlowProvider>');
  return ctx;
}
