import { configureStore } from '@reduxjs/toolkit';
import { mobileBarSlice } from './slices/mobileBar';

export const store = configureStore({
  reducer: {
    [mobileBarSlice.name]: mobileBarSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
