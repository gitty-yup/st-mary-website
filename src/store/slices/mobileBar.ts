import { createSlice } from '@reduxjs/toolkit';

interface MobileBarState {
  open: boolean;
}

const initialState: MobileBarState = {
  open: false,
};

export const mobileBarSlice = createSlice({
  name: 'mobileBar',
  initialState,
  reducers: {
    openMobileBar(state) {
      state.open = true;
    },
    closeMobileBar(state) {
      state.open = false;
    },
  },
});

export const { closeMobileBar, openMobileBar } = mobileBarSlice.actions;

export default mobileBarSlice.reducer;
