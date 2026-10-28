import { useAppTheme } from '@/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setSignedUpAsync } from '@/lib/profileSlice';
import { useAppDispatch } from '@/lib/store';

export default function SignUpScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();

  const onSignUp = () => {
    router.push('/profile-info');
  };

  const onContinue = async () => {
    await dispatch(setSignedUpAsync(true));
    router.replace('/(tabs)');
  };
  return (
    <SafeAreaView style={[styles.signUpContainer, { backgroundColor: colors.systemBackground }]}>
      <View style={styles.logoContainer}>
        <Image source={require('@/assets/images/favicon.png')} style={styles.favicon} />
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.systemBlue }]} onPress={onSignUp}>
          <Text style={[styles.buttonText, { color: colors.onAccent }]}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.systemBlue }]} onPress={onContinue}>
          <Text style={[styles.buttonText, { color: colors.onAccent }]}>Continue without sign up</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  signUpContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  buttonsContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  favicon: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
});