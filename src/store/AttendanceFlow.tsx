import React, { createContext, useContext, useMemo, useState } from 'react';
import { AttendanceStatus } from '@/domain/types';

export interface DraftEntry {
  studentId: string;
  status: AttendanceStatus;
}

interface AttendanceFlowState {
  versionId: string | null;
  zoneId: string | null;
  detectedCount: number;
  photoTaken: boolean;
  entries: DraftEntry[];
  unassigned: number;
}

interface AttendanceFlowValue extends AttendanceFlowState {
  setTarget: (versionId: string, zoneId: string) => void;
  setResult: (args: { detectedCount: number; entries: DraftEntry[]; unassigned: number }) => void;
  toggleStatus: (studentId: string) => void;
  assignUnidentified: (studentId: string) => void;
  reset: () => void;
}

const defaultState: AttendanceFlowState = {
  versionId: null,
  zoneId: null,
  detectedCount: 0,
  photoTaken: false,
  entries: [],
  unassigned: 0,
};

const Ctx = createContext<AttendanceFlowValue | null>(null);

export function AttendanceFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AttendanceFlowState>(defaultState);

  const value = useMemo<AttendanceFlowValue>(
    () => ({
      ...state,
      setTarget: (versionId, zoneId) => setState((p) => ({ ...p, versionId, zoneId })),
      setResult: ({ detectedCount, entries, unassigned }) =>
        setState((p) => ({ ...p, detectedCount, entries, unassigned, photoTaken: true })),
      toggleStatus: (studentId) =>
        setState((p) => ({
          ...p,
          entries: p.entries.map((e) =>
            e.studentId === studentId
              ? { ...e, status: e.status === 'presente' ? 'ausente' : 'presente' }
              : e
          ),
        })),
      assignUnidentified: (studentId) =>
        setState((p) => ({
          ...p,
          unassigned: Math.max(0, p.unassigned - 1),
          entries: p.entries.map((e) => (e.studentId === studentId ? { ...e, status: 'presente' } : e)),
        })),
      reset: () => setState(defaultState),
    }),
    [state]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAttendanceFlow(): AttendanceFlowValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAttendanceFlow debe usarse dentro de <AttendanceFlowProvider>');
  return ctx;
}
