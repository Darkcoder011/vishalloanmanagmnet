import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  members: [],
  currentMember: null,
  isLoading: false,
  error: null,
};

const memberSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    setMembers: (state, action) => {
      state.members = action.payload;
    },
    setCurrentMember: (state, action) => {
      state.currentMember = action.payload;
    },
    addMember: (state, action) => {
      state.members.push(action.payload);
    },
    updateMember: (state, action) => {
      const index = state.members.findIndex(member => member.id === action.payload.id);
      if (index !== -1) {
        state.members[index] = action.payload;
      }
    },
    setMemberLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setMemberError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setMembers, setCurrentMember, addMember, updateMember, setMemberLoading, setMemberError } = memberSlice.actions;
export default memberSlice;
