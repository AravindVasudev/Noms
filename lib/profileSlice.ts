import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type Profile = {
  username: string;
  displayPicture: string | null;
};

const initializeProfile = createAsyncThunk('profile/initialize', async () => {
  const username = await AsyncStorage.getItem('username') || 'User';
  const displayPicture = await AsyncStorage.getItem('displayPicture');
  return { username, displayPicture };
});

const setUsernameAsync = createAsyncThunk('profile/setUsername', async (username: string) => {
  await AsyncStorage.setItem('username', username);
  return username;
});

const setDisplayPictureAsync = createAsyncThunk('profile/setDisplayPicture', async (base64Image: string | null) => {
  if (base64Image) {
    await AsyncStorage.setItem('displayPicture', base64Image);
  } else {
    await AsyncStorage.removeItem('displayPicture');
  }
  return base64Image;
});

const clearAllAsync = createAsyncThunk('profile/clearAll', async () => {
  await AsyncStorage.multiRemove(['username', 'displayPicture', 'signedUp']);
  return { username: 'User', displayPicture: null };
});

const setProfile = createAsyncThunk('profile/setProfile', async (profile: Profile) => {
  await AsyncStorage.setItem('username', profile.username);
  if (profile.displayPicture) {
    await AsyncStorage.setItem('displayPicture', profile.displayPicture);
  }
  return profile;
});

const profileSlice = createSlice({
  name: 'profile',
  initialState: { username: 'User', displayPicture: null } as Profile,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeProfile.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setUsernameAsync.fulfilled, (state, action) => {
        state.username = action.payload;
      })
      .addCase(setDisplayPictureAsync.fulfilled, (state, action) => {
        state.displayPicture = action.payload;
      })
      .addCase(clearAllAsync.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setProfile.fulfilled, (state, action) => {
        return action.payload;
      });
  },
});

export { clearAllAsync, initializeProfile, setDisplayPictureAsync, setProfile, setUsernameAsync };
export default profileSlice.reducer;
