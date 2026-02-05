import { useState, useEffect, useCallback } from 'react';
import { BlackjackEngine } from '../lib/blackjack';
import { useWalletStore } from '../stores/walletStore';
import { useGameStore } from '../stores/gameStore';

export const useBlackjack = () => {
  const [engine] = useState(() => new BlackjackEngine());
  const [gameState, setGameState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { balance, withdraw, deposit } = useWalletStore();
  const { setCurrentGame, endGame } = useGameStore();

  useEffect(() => {
    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
    };
    init();
  }, [engine]);

  const startHand = useCallback(async (betAmount) => {
    if (!isInitialized || balance < betAmount) {
      return { success: false, error: 'Insufficient funds or not initialized' };
    }

    const withdrawResult = withdraw(betAmount);
    if (!withdrawResult.success) {
      return withdrawResult;
    }

    const state = await engine.startHand(betAmount);
    setGameState(state);
    setCurrentGame({
      type: 'blackjack',
      bet: betAmount,
      startedAt: new Date().toISOString()
    });

    // Auto-resolve if blackjack or immediate finish
    if (state.gameState === 'finished') {
      handleGameEnd(state);
    }

    return { success: true, state };
  }, [isInitialized, balance, withdraw, setCurrentGame, engine]);

  const hit = useCallback(() => {
    const state = engine.hit();
    setGameState(state);

    if (state.gameState === 'finished') {
      handleGameEnd(state);
    }

    return state;
  }, [engine]);

  const stand = useCallback(() => {
    const state = engine.stand();
    setGameState(state);

    if (state.gameState === 'finished') {
      handleGameEnd(state);
    }

    return state;
  }, [engine]);

  const doubleDown = useCallback(() => {
    const currentBet = gameState?.bet || 0;
    const additionalBet = currentBet;

    if (balance < additionalBet) {
      return { success: false, error: 'Insufficient funds for double down' };
    }

    withdraw(additionalBet);
    const state = engine.doubleDown();
    setGameState(state);

    if (state.gameState === 'finished') {
      handleGameEnd(state);
    }

    return { success: true, state };
  }, [engine, balance, withdraw, gameState]);

  const split = useCallback(() => {
    const currentBet = gameState?.bet || 0;

    if (balance < currentBet) {
      return { success: false, error: 'Insufficient funds for split' };
    }

    withdraw(currentBet);
    const state = engine.split();
    setGameState(state);

    return { success: true, state };
  }, [engine, balance, withdraw, gameState]);

  const handleGameEnd = useCallback((state) => {
    if (state.result && state.result.payout > 0) {
      deposit(state.result.payout);
    }

    endGame({
      type: 'blackjack',
      result: state.result.outcome,
      bet: state.bet,
      payout: state.result.payout,
      netWin: state.result.payout - state.bet
    });
  }, [deposit, endGame]);

  return {
    gameState,
    isInitialized,
    startHand,
    hit,
    stand,
    doubleDown,
    split,
    balance
  };
};
