import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function ProfileCard() {
  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: 'https://ui-avatars.com/api/?name=User&size=120&background=2296f3&color=fff' }}
          style={styles.avatar}
        />
      </View>
      <Text style={styles.name}>User</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
});