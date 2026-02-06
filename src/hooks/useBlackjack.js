import { useState, useEffect, useCallback, useRef } from 'react';
import { BlackjackEngine } from '../lib/blackjack';
import { useWalletStore } from '../stores/walletStore';
import { useGameStore } from '../stores/gameStore';

export const useBlackjack = () => {
  const [engine] = useState(() => new BlackjackEngine());
  const [gameState, setGameState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { balance, withdraw, deposit } = useWalletStore();
  const { setCurrentGame, endGame } = useGameStore();

  // Fix 1.3: use refs for deposit/endGame to avoid stale closure issues
  const depositRef = useRef(deposit);
  const endGameRef = useRef(endGame);
  depositRef.current = deposit;
  endGameRef.current = endGame;

  useEffect(() => {
    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
    };
    init();
  }, [engine]);

  // Fix 1.3: handleGameEnd defined first using refs, no stale closure
  const handleGameEnd = useCallback((state) => {
    if (state.result && state.result.payout > 0) {
      depositRef.current(state.result.payout);
    }

    endGameRef.current({
      type: 'blackjack',
      result: state.result.outcome,
      bet: state.bet,
      payout: state.result.payout,
      netWin: state.result.payout - state.bet
    });
  }, []);

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
  }, [isInitialized, balance, withdraw, setCurrentGame, engine, handleGameEnd]);

  const hit = useCallback(async () => {
    const state = await engine.hit();
    setGameState(state);

    if (state.gameState === 'finished') {
      handleGameEnd(state);
    }

    return state;
  }, [engine, handleGameEnd]);

  const stand = useCallback(async () => {
    const state = await engine.stand();
    setGameState(state);

    if (state.gameState === 'finished') {
      handleGameEnd(state);
    }

    return state;
  }, [engine, handleGameEnd]);

  // Fix 1.4: accept and forward the faceDown parameter
  const doubleDown = useCallback(async (faceDown = true) => {
    // Fix 1.2 compatible: use per-hand bet from handBets array
    const currentHandBet = gameState?.handBets?.[gameState?.currentHandIndex] || gameState?.bet || 0;
    const additionalBet = currentHandBet;

    if (balance < additionalBet) {
      return { success: false, error: 'Insufficient funds for double down' };
    }

    withdraw(additionalBet);
    const state = await engine.doubleDown(faceDown);
    setGameState(state);

    if (state.gameState === 'finished') {
      handleGameEnd(state);
    }

    return { success: true, state };
  }, [engine, balance, withdraw, gameState, handleGameEnd]);

  const split = useCallback(async () => {
    // Fix 1.2 compatible: use per-hand bet
    const currentHandBet = gameState?.handBets?.[gameState?.currentHandIndex] || gameState?.bet || 0;

    if (balance < currentHandBet) {
      return { success: false, error: 'Insufficient funds for split' };
    }

    withdraw(currentHandBet);
    const state = await engine.split();
    setGameState(state);

    return { success: true, state };
  }, [engine, balance, withdraw, gameState]);

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
