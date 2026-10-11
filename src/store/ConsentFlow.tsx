import React, { createContext, useContext, useMemo, useState } from 'react';
import { Relationship } from '@/domain/types';

interface ConsentFlowState {
  studentId: string | null;
  run: string;
  fullName: string;
  relationship: Relationship;
  signaturePng: string;
  declarationAccepted: boolean;
}

interface ConsentFlowValue extends ConsentFlowState {
  setStudentId: (id: string) => void;
  setGuardian: (data: {
    run: string;
    fullName: string;
    relationship: Relationship;
  }) => void;
  setSignature: (png: string) => void;
  setDeclaration: (accepted: boolean) => void;
  reset: () => void;
}

const defaultState: ConsentFlowState = {
  studentId: null,
  run: '',
  fullName: '',
  relationship: 'Madre',
  signaturePng: '',
  declarationAccepted: false,
};

const ConsentFlowContext = createContext<ConsentFlowValue | null>(null);

export function ConsentFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConsentFlowState>(defaultState);

  const value = useMemo<ConsentFlowValue>(
    () => ({
      ...state,
      setStudentId: (id) => setState((p) => ({ ...p, studentId: id })),
      setGuardian: ({ run, fullName, relationship }) =>
        setState((p) => ({ ...p, run, fullName, relationship })),
      setSignature: (png) => setState((p) => ({ ...p, signaturePng: png })),
      setDeclaration: (accepted) =>
        setState((p) => ({ ...p, declarationAccepted: accepted })),
      reset: () => setState(defaultState),
    }),
    [state]
  );

  return (
    <ConsentFlowContext.Provider value={value}>
      {children}
    </ConsentFlowContext.Provider>
  );
}

export function useConsentFlow(): ConsentFlowValue {
  const ctx = useContext(ConsentFlowContext);
  if (!ctx) {
    throw new Error('useConsentFlow debe usarse dentro de <ConsentFlowProvider>');
  }
  return ctx;
}
