import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';

export const fetchUserState = createAsyncThunk(
  '/code/userstate',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/code/userstate');
     //console.log(data);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Failed to fetch user state' }
      );
    }
  }
);

const userStateSlice = createSlice({
  name: 'userState',
  initialState: {
    stats: {
      total: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      rank: null
    },
    loading: false,
    error: null
  },
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserState.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchUserState.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || 'Something went wrong';
      });
  }
});

// Export only the reducer
export default userStateSlice.reducer;