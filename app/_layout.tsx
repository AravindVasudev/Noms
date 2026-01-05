import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { DiaryProvider } from '@/components/diary-context';
import SignUpScreen from '@/components/SignUpScreen';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [signedUp, setSignedUp] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSignUp = async () => {
      const hasSignedUp = await AsyncStorage.getItem('signedUp');
      setSignedUp(hasSignedUp === 'true');
    };
    checkSignUp();
  }, []);

  const handleContinueWithoutSignUp = async () => {
    await AsyncStorage.setItem('signedUp', 'true');
    setSignedUp(true);
  };

  const handleSignUp = () => {
    console.log('Sign Up pressed');
  };

  if (signedUp === null) {
    return null; // or loading screen
  }

  if (!signedUp) {
    return <SignUpScreen onSignUp={handleSignUp} onContinue={handleContinueWithoutSignUp} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DiaryProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </DiaryProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
