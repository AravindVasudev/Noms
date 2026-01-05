import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Provider } from 'react-redux';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeDiary } from '@/lib/diarySlice';
import { initializeGoals } from '@/lib/goalsSlice';
import store, { useAppDispatch } from '@/lib/store';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeDiary());
    dispatch(initializeGoals());
  }, [dispatch]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="add" options={{ headerShown: false }} />
          <Stack.Screen name="goals" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const [signedUp, setSignedUp] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSignUp = async () => {
      const hasSignedUp = await AsyncStorage.getItem('signedUp');
      setSignedUp(hasSignedUp === 'true');
    };
    checkSignUp();
  }, []);

  useEffect(() => {
    if (signedUp === false) {
      router.replace('/signup');
    }
  }, [signedUp, router]);

  if (signedUp === null) {
    return null; // or loading
  }

  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
