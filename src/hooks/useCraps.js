import { useState, useEffect, useCallback } from 'react';
import { CrapsEngine } from '../lib/craps';
import { useWalletStore } from '../stores/walletStore';
import { useGameStore } from '../stores/gameStore';

export const useCraps = () => {
  const [engine] = useState(() => new CrapsEngine());
  const [gameState, setGameState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const { balance, withdraw, deposit } = useWalletStore();
  const { setCurrentGame, endGame } = useGameStore();

  useEffect(() => {
    const init = async () => {
      await engine.initialize();
      const state = engine.getGameState();
      setGameState(state);
      setIsInitialized(true);
    };
    init();
  }, [engine]);

  const placeBet = useCallback((betType, amount, number = null) => {
    if (!engine.canPlaceBet(betType)) {
      return { success: false, error: `Cannot place ${betType} bet in current phase` };
    }

    if (balance < amount) {
      return { success: false, error: 'Insufficient funds' };
    }

    const withdrawResult = withdraw(amount);
    if (!withdrawResult.success) {
      return withdrawResult;
    }

    engine.placeBet(betType, amount, number);
    const state = engine.getGameState();
    setGameState(state);

    return { success: true, state };
  }, [engine, balance, withdraw]);

  const removeBet = useCallback((betType, number = null) => {
    const currentBets = gameState?.bets || {};
    let betAmount = 0;

    if (betType === 'place' && number) {
      betAmount = currentBets.place?.[number] || 0;
    } else {
      betAmount = currentBets[betType] || 0;
    }

    if (betAmount > 0) {
      deposit(betAmount);
      engine.removeBet(betType, number);
      const state = engine.getGameState();
      setGameState(state);
    }

    return { success: true };
  }, [engine, gameState, deposit]);

  const roll = useCallback(async () => {
    const result = await engine.roll();
    setRollResult(result);
    const state = engine.getGameState();
    setGameState(state);

    // Process payouts
    let totalPayout = 0;
    result.outcomes.forEach(outcome => {
      if (outcome.payout > 0) {
        totalPayout += outcome.payout;
      }
    });

    if (totalPayout > 0) {
      deposit(totalPayout);
    }

    // Log to game history
    if (result.outcomes.length > 0) {
      endGame({
        type: 'craps',
        roll: result.roll,
        outcomes: result.outcomes,
        totalPayout,
        phase: result.phase,
        point: result.point
      });
    }

    return result;
  }, [engine, deposit, endGame]);

  const resetBets = useCallback(() => {
    const currentBets = gameState?.bets || {};
    let totalRefund = 0;

    // Refund all bets
    Object.keys(currentBets).forEach(key => {
      if (key === 'place') {
        Object.values(currentBets.place).forEach(amount => {
          totalRefund += amount;
        });
      } else {
        totalRefund += currentBets[key] || 0;
      }
    });

    if (totalRefund > 0) {
      deposit(totalRefund);
    }

    engine.resetBets();
    const state = engine.getGameState();
    setGameState(state);

    return { success: true, refunded: totalRefund };
  }, [engine, gameState, deposit]);

  const getTotalBets = useCallback(() => {
    const bets = gameState?.bets || {};
    let total = 0;

    Object.keys(bets).forEach(key => {
      if (key === 'place') {
        Object.values(bets.place).forEach(amount => {
          total += amount;
        });
      } else {
        total += bets[key] || 0;
      }
    });

    return total;
  }, [gameState]);

  return {
    gameState,
    isInitialized,
    rollResult,
    placeBet,
    removeBet,
    roll,
    resetBets,
    getTotalBets,
    balance
  };
};
