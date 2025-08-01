import { createSlice } from '@reduxjs/toolkit';

export interface Account {
  name: string;
  address: string;
  isConnected: boolean;
}

export const accountsSlice = createSlice({
  name: 'ACCOUNTS',
  initialState: [] as Account[] | [],
  reducers: {
    initAccounts: (state, action) => {
      const accountAddresses = action.payload;
      const accounts = accountAddresses.map(
        (address: string, index: number) => ({
          name: `Account ${index + 1}`,
          address,
          isConnected: index === 0
        })
      );

      return accounts;
    },
    addAccount: (state, action) => {
      const accounts = state.map(account => ({
        ...account,
        isConnected: false
      }));
      return [
        ...accounts,
        {
          name: `Account ${state.length + 1}`,
          address: action.payload.address,
          isConnected: true
        }
      ];
    },
    switchAccount: (state, action) => {
      // action.payload => account address
      return state.map(account => {
        if (account.address === action.payload) {
          return { ...account, isConnected: true };
        } else {
          return { ...account, isConnected: false };
        }
      });
    },
    removeAccount: (state, action) => {
      return state
        .filter(account => account.address != action.payload)
        .map((account, index) => {
          if (index === 0) return { ...account, isConnected: true };
          return account;
        });
    },
    changeName: (state, action) => {
      return state.map(account => {
        if (account.address === action.payload.address) {
          return {
            ...account,
            name: action.payload.newName
          };
        } else {
          return account;
        }
      });
    }
  }
});

export const {
  initAccounts,
  addAccount,
  switchAccount,
  removeAccount,
  changeName
} = accountsSlice.actions;

export default accountsSlice.reducer;
