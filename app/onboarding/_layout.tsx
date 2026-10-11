import React from 'react';
import { Stack } from 'expo-router';
import { OnboardingFlowProvider } from '@/store/OnboardingFlow';
import { ConsentFlowProvider } from '@/store/ConsentFlow';
import { colors } from '@/theme';

export default function OnboardingLayout() {
  return (
    <OnboardingFlowProvider>
      <ConsentFlowProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        />
      </ConsentFlowProvider>
    </OnboardingFlowProvider>
  );
}
