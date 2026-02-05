import { create } from 'zustand';
import { getGameHistory, addGameToHistory } from '../utils/localStorage';

export const useGameStore = create((set, get) => ({
  currentGame: null,
  gameHistory: getGameHistory(),
  isPlaying: false,

  setCurrentGame: (game) => set({ currentGame: game, isPlaying: !!game }),

  endGame: (result) => {
    const game = get().currentGame;
    if (game) {
      const gameRecord = {
        ...game,
        ...result,
        endedAt: new Date().toISOString()
      };
      addGameToHistory(gameRecord);
      set({
        currentGame: null,
        isPlaying: false,
        gameHistory: getGameHistory()
      });
    }
  },

  refreshHistory: () => {
    set({ gameHistory: getGameHistory() });
  }
}));
