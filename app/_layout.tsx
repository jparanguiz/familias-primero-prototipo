import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import { AppStoreProvider } from '@/store/AppStore';
import { SessionProvider } from '@/store/SessionStore';
import { PhoneFrame } from '@/components/PhoneFrame';
import { colors } from '@/theme';

export default function RootLayout() {
  // Carga las fuentes Inter. No bloqueamos el render: si aún no cargan,
  // RN cae a la fuente del sistema y luego se actualiza.
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <AppStoreProvider>
            <StatusBar style="dark" />
            <PhoneFrame>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation: 'slide_from_right',
                }}
              />
            </PhoneFrame>
          </AppStoreProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
