import { useState, useEffect, useCallback, useMemo } from 'react';
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
    const refunded = engine.removeBet(betType, number);

    if (refunded > 0) {
      deposit(refunded);
    }

    const state = engine.getGameState();
    setGameState(state);

    return refunded;
  }, [engine, deposit]);

  const roll = useCallback(async () => {
    const result = await engine.roll();
    setRollResult(result);
    const state = engine.getGameState();
    setGameState(state);

    // Note: Payouts are handled in the CrapsTable component
    // to coordinate with animations

    return result;
  }, [engine]);

  const resetBets = useCallback(() => {
    const oldBets = engine.resetBets();
    const state = engine.getGameState();
    setGameState(state);

    return oldBets;
  }, [engine]);

  // Fix 4.4: useMemo so getTotalBets is a derived value, not a function called on every render
  const totalBets = useMemo(() => {
    const bets = gameState?.bets || {};
    let total = 0;

    // Simple bet types
    ['passLine', 'dontPass', 'come', 'dontCome', 'field', 'odds', 'anySeven', 'anyCraps'].forEach(key => {
      total += bets[key] || 0;
    });

    // Place bets
    if (bets.place) {
      Object.values(bets.place).forEach(amount => {
        total += amount || 0;
      });
    }

    // Come numbers (amount + odds)
    if (bets.comeNumbers) {
      Object.values(bets.comeNumbers).forEach(comeBet => {
        total += (comeBet.amount || 0) + (comeBet.odds || 0);
      });
    }

    // Hardways
    if (bets.hardways) {
      Object.values(bets.hardways).forEach(amount => {
        total += amount || 0;
      });
    }

    // Horn bets
    if (bets.horn) {
      Object.values(bets.horn).forEach(amount => {
        total += amount || 0;
      });
    }

    return total;
  }, [gameState]);

  const repeatLastBets = useCallback(() => {
    const lastBets = engine.repeatLastBets();
    if (lastBets) {
      // Calculate total needed
      const total = calculateBetsTotal(lastBets);

      if (balance >= total) {
        const withdrawResult = withdraw(total);
        if (withdrawResult.success) {
          engine.bets = JSON.parse(JSON.stringify(lastBets));
          const state = engine.getGameState();
          setGameState(state);
          return { success: true };
        }
      }
      return { success: false, error: 'Insufficient funds' };
    }
    return { success: false, error: 'No previous bets to repeat' };
  }, [engine, balance, withdraw]);

  const saveBetsForRepeat = useCallback(() => {
    engine.saveLastBets();
  }, [engine]);

  const calculateBetsTotal = (bets) => {
    let total = 0;
    ['passLine', 'dontPass', 'come', 'dontCome', 'field', 'odds', 'anySeven', 'anyCraps'].forEach(key => {
      total += bets[key] || 0;
    });
    if (bets.place) {
      Object.values(bets.place).forEach(amount => total += amount || 0);
    }
    if (bets.comeNumbers) {
      Object.values(bets.comeNumbers).forEach(comeBet => {
        total += (comeBet.amount || 0) + (comeBet.odds || 0);
      });
    }
    if (bets.hardways) {
      Object.values(bets.hardways).forEach(amount => total += amount || 0);
    }
    if (bets.horn) {
      Object.values(bets.horn).forEach(amount => total += amount || 0);
    }
    return total;
  };

  return {
    gameState,
    isInitialized,
    rollResult,
    placeBet,
    removeBet,
    roll,
    resetBets,
    totalBets,
    repeatLastBets,
    saveBetsForRepeat,
    balance
  };
};
