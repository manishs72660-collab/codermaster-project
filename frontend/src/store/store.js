import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../authSlice';
import userStateReducer from "../userslice"; 

export const store = configureStore({
  reducer: {
    auth: authReducer,
    userState: userStateReducer
  }
});