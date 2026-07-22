import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../authSlice';
import userStateReducer from "../userslice"; 
import problemReducer from '../problemslice';
import profileReducer from '../profileSlice'; // <-- fix this line

export const store = configureStore({
  reducer: {
    auth: authReducer,
    userState: userStateReducer,
    problem: problemReducer,
    profile: profileReducer
  }
});