import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../authSlice';
import userStateReducer from "../userslice"; 
import problemReducer from '../problemslice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    userState: userStateReducer,
    problem:problemReducer,
  }
});