import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loans: [],
  currentLoan: null,
  isLoading: false,
  error: null,
};

const loanSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    setLoans: (state, action) => {
      state.loans = action.payload;
    },
    setCurrentLoan: (state, action) => {
      state.currentLoan = action.payload;
    },
    addLoan: (state, action) => {
      state.loans.push(action.payload);
    },
    updateLoan: (state, action) => {
      const index = state.loans.findIndex(loan => loan.id === action.payload.id);
      if (index !== -1) {
        state.loans[index] = action.payload;
      }
    },
    setLoanLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setLoanError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setLoans, setCurrentLoan, addLoan, updateLoan, setLoanLoading, setLoanError } = loanSlice.actions;
export default loanSlice;
