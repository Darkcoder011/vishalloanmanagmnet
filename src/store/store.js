import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import loanSlice from './slices/loanSlice';
import memberSlice from './slices/memberSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    loans: loanSlice.reducer,
    members: memberSlice.reducer,
  },
});
