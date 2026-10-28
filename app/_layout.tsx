import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Provider } from 'react-redux';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeCatalog } from '@/lib/catalogSlice';
import { initializeDiary } from '@/lib/diarySlice';
import { initializeGoals } from '@/lib/goalsSlice';
import { initializeInsightsSettings } from '@/lib/insightsSettingsSlice';
import { initializeProfile } from '@/lib/profileSlice';
import { initializeTraining } from '@/lib/trainingSlice';
import store, { useAppDispatch, useAppSelector } from '@/lib/store';
import MiniWorkoutBar from '@/components/ui/mini-workout-bar';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const signedUp = useAppSelector((state) => state.profile.signedUp);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        dispatch(initializeProfile()),
        dispatch(initializeDiary()),
        dispatch(initializeGoals()),
        dispatch(initializeCatalog()),
        dispatch(initializeInsightsSettings()),
        dispatch(initializeTraining()),
      ]);
      setIsInitialized(true);
    };
    initialize();
  }, [dispatch]);

  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="profile-info" options={{ headerShown: false }} />
          <Stack.Screen name="add" options={{ headerShown: false }} />
          <Stack.Screen name="goals" options={{ headerShown: false }} />
          <Stack.Screen name="tdee-calculator" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="manage-data" options={{ headerShown: false }} />
          <Stack.Screen name="customize-insights" options={{ headerShown: false }} />
          <Stack.Screen name="workout" options={{ headerShown: false }} />
        </Stack>
        <MiniWorkoutBar />
        <StatusBar style="auto" />
        {!signedUp && <Redirect href="/signup" />}
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
