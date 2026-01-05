import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SignUpScreenProps {
  onSignUp: () => void;
  onContinue: () => void;
}

export default function SignUpScreen({ onSignUp, onContinue }: SignUpScreenProps) {
  return (
    <View style={styles.signUpContainer}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={onSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onContinue}>
          <Text style={styles.buttonText}>Continue without sign up</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/favicon.png')} style={styles.favicon} />
        <Text style={styles.appName}>Noms</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  signUpContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#034ea6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  favicon: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#034ea6',
  },
});