import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type Profile = {
  username: string;
};

const initializeProfile = createAsyncThunk('profile/initialize', async () => {
  const username = await AsyncStorage.getItem('username') || 'User';
  return { username };
});

const setUsernameAsync = createAsyncThunk('profile/setUsername', async (username: string) => {
  await AsyncStorage.setItem('username', username);
  return username;
});

const profileSlice = createSlice({
  name: 'profile',
  initialState: { username: 'User' } as Profile,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeProfile.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setUsernameAsync.fulfilled, (state, action) => {
        state.username = action.payload;
      });
  },
});

export { initializeProfile, setUsernameAsync };
export default profileSlice.reducer;
