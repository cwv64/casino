import { create } from 'zustand';
import { getWalletBalance, setWalletBalance, updateWalletBalance, resetWallet } from '../utils/localStorage';

export const useWalletStore = create((set, get) => ({
  balance: getWalletBalance(),

  deposit: (amount) => {
    const newBalance = updateWalletBalance(amount);
    set({ balance: newBalance });
    return newBalance;
  },

  withdraw: (amount) => {
    const currentBalance = get().balance;
    if (currentBalance >= amount) {
      const newBalance = updateWalletBalance(-amount);
      set({ balance: newBalance });
      return { success: true, balance: newBalance };
    }
    return { success: false, balance: currentBalance, error: 'Insufficient funds' };
  },

  setBalance: (amount) => {
    setWalletBalance(amount);
    set({ balance: amount });
  },

  reset: () => {
    const newBalance = resetWallet();
    set({ balance: newBalance });
    return newBalance;
  },

  refresh: () => {
    const balance = getWalletBalance();
    set({ balance });
    return balance;
  }
}));
