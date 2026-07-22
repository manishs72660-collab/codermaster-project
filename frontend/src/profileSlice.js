import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';

export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get(`/profile/${userId}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch profile' });
    }
  }
);

export const fetchHeatmap = createAsyncThunk(
  'profile/fetchHeatmap',
  async ({ userId, year }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get(`/profile/${userId}/heatmap`, { params: { year } });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch heatmap' });
    }
  }
);

export const fetchRecentSubmissions = createAsyncThunk(
  'profile/fetchRecentSubmissions',
  async ({ userId, page = 1, limit = 10, status }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get(`/profile/${userId}/submissions`, {
        params: { page, limit, status },
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch submissions' });
    }
  }
);

export const fetchSkills = createAsyncThunk(
  'profile/fetchSkills',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get(`/profile/${userId}/skills`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch skills' });
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    data: null,
    heatmap: {},
    submissions: [],
    pagination: null,
    skills: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearProfile: (state) => {
      state.data = null;
      state.heatmap = {};
      state.submissions = [];
      state.skills = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      })
      .addCase(fetchHeatmap.fulfilled, (state, action) => {
        state.heatmap = action.payload.heatmap;
      })
      .addCase(fetchRecentSubmissions.fulfilled, (state, action) => {
        state.submissions = action.payload.submissions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.skills = action.payload.skills;
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;