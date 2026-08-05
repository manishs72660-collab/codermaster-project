import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';

export const fetchProblems = createAsyncThunk(
  'problem/fetchProblems',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get(`/problem/?page=${page}&limit=${limit}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch problems' });
    }
  }
);

const problemSlice = createSlice({
  name: 'problem',
  initialState: {
    problems: [],
    loading: false,       // first page
    loadingMore: false,   // subsequent pages
    error: null,
    currentPage: 1,
    totalProblems: 0,
    hasMore: true,
    initialized: false,   // true once page 1 has been successfully fetched at least once
  },
  reducers: {
    resetProblems: (state) => {
      state.problems = [];
      state.currentPage = 1;
      state.hasMore = true;
      state.initialized = false; // allow a fresh fetch after explicit reset
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProblems.pending, (state, action) => {
        if ((action.meta.arg?.page ?? 1) > 1) state.loadingMore = true;
        else state.loading = true;
        state.error = null;
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const { problems, currentPage, hasMore, totalProblems } = action.payload;
        state.problems = currentPage === 1 ? problems : [...state.problems, ...problems];
        state.currentPage = currentPage;
        state.hasMore = hasMore;
        state.totalProblems = totalProblems ?? state.totalProblems;
        state.initialized = true;
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload?.message || 'Something went wrong';
        // initialized stays false on failure so it retries on next mount
      });
  },
});

export const { resetProblems } = problemSlice.actions;
export default problemSlice.reducer;