import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';

// Fetch Problems
export const fetchProblems = createAsyncThunk(
  'problem/fetchProblems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/problem/');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Failed to fetch problems',
        }
      );
    }
  }
);

const problemSlice = createSlice({
  name: 'problem',

  initialState: {
    problems: [],
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchProblems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchProblems.fulfilled, (state, action) => {
        state.loading = false;
        state.problems = action.payload;
      })

      .addCase(fetchProblems.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || 'Something went wrong';
      });
  },
});

export default problemSlice.reducer;