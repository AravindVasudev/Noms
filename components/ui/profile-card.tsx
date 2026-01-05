import { setDisplayPictureAsync, setUsernameAsync } from '@/lib/profileSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ProfileCard() {
  const name = useAppSelector(state => state.profile.username);
  const displayPicture = useAppSelector(state => state.profile.displayPicture);
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      dispatch(setDisplayPictureAsync(`data:image/jpeg;base64,${result.assets[0].base64}`));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTempName(name);
  };

  const handleSave = async () => {
    const newName = tempName.trim() || 'User';
    dispatch(setUsernameAsync(newName));
    setIsEditing(false);
  };

  return (
    <View style={styles.profileCard}>
      <Pressable onPress={pickImage}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: displayPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=120&background=2296f3&color=fff` }}
            style={styles.avatar}
          />
        </View>
      </Pressable>
      {isEditing ? (
        <View style={styles.nameEditContainer}>
          <TextInput
            style={styles.nameInput}
            value={tempName}
            onChangeText={setTempName}
            onSubmitEditing={handleSave}
            onBlur={handleSave}
            autoFocus
            selectTextOnFocus
          />
          <Pressable onPress={handleSave} style={styles.checkButton}>
            <Ionicons name="checkmark" size={24} color="#000" />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={handleEdit}>
          <Text style={styles.name}>{name}</Text>
        </Pressable>
      )}
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
  nameInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 4,
    minWidth: 100,
    textAlign: 'center',
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkButton: {
    marginLeft: 8,
  },
});