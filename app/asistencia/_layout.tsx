import React from 'react';
import { Stack } from 'expo-router';
import { AttendanceFlowProvider } from '@/store/AttendanceFlow';
import { colors } from '@/theme';

export default function AsistenciaLayout() {
  return (
    <AttendanceFlowProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </AttendanceFlowProvider>
  );
}
