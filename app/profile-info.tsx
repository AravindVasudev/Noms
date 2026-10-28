import ProfileCard from '@/components/ui/profile-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileInfoScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    router.push('/goals?from=signup');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.systemBackground }]}>
      <View style={styles.content}>
        <Text style={[styles.instruction, { color: colors.label }]}>Click on the name to edit</Text>
        <ProfileCard />
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.systemBlue }]} onPress={handleBack}>
          <Text style={[styles.buttonText, { color: colors.onAccent }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.systemBlue }]} onPress={handleNext}>
          <Text style={[styles.buttonText, { color: colors.onAccent }]}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});