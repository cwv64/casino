import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlackjack } from '../../hooks/useBlackjack';
import { useWalletStore } from '../../stores/walletStore';
import { Hand } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChipSelector } from '../ui/Chip';
import { WinCelebration } from '../ui/WinCelebration';
import { sounds } from '../../utils/sounds';

export const BlackjackTable = () => {
  const [betAmount, setBetAmount] = useState(0);
  const [selectedChip, setSelectedChip] = useState(10);
  const [showDealerHole, setShowDealerHole] = useState(false);
  const [doubleDownFaceDown, setDoubleDownFaceDown] = useState(true);
  const [betError, setBetError] = useState(null);
  const { gameState, isInitialized, startHand, hit, stand, doubleDown, split } = useBlackjack();
  const { balance } = useWalletStore();

  useEffect(() => {
    if (gameState?.gameState === 'finished') {
      setShowDealerHole(false);
      const timer = setTimeout(() => {
        setShowDealerHole(true);
        // Fix 5.4: Play result sound
        if (gameState.result) {
          if (gameState.result.outcome === 'win' || gameState.result.outcome === 'blackjack') {
            if (gameState.result.payout >= 100) sounds.bigWin();
            else sounds.win();
          } else if (gameState.result.outcome === 'push') {
            sounds.push();
          } else {
            sounds.lose();
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowDealerHole(false);
    }
  }, [gameState?.gameState]);

  const handleStartHand = async () => {
    if (betAmount > 0) {
      // Fix 5.5: Validate balance before dealing
      if (betAmount > balance) {
        setBetError(`Insufficient funds! Balance: $${balance.toLocaleString()}`);
        sounds.error();
        setTimeout(() => setBetError(null), 2500);
        return;
      }
      await startHand(betAmount);
      sounds.cardDeal();
      setShowDealerHole(false);
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    }
  };

  const handlePlaceBet = () => {
    // Fix 5.5: Validate balance before adding chip
    if (betAmount + selectedChip > balance) {
      setBetError(`Can't exceed balance ($${balance.toLocaleString()})`);
      sounds.error();
      setTimeout(() => setBetError(null), 2000);
      return;
    }
    setBetAmount(prev => prev + selectedChip);
    sounds.chipPlace();
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleClearBet = () => {
    setBetAmount(0);
    sounds.chipRemove();
  };

  // Fix 5.7: Undo last chip added
  const handleUndoLastChip = () => {
    setBetAmount(prev => Math.max(0, prev - selectedChip));
    sounds.chipRemove();
  };

  const handleDoubleDown = () => {
    doubleDown(doubleDownFaceDown);
    sounds.cardDeal();
  };

  // Fix 5.1: Hand value calculation (also used for display)
  const getHandValue = (hand, showSoft = false) => {
    if (!hand) return showSoft ? { soft: 0, hard: 0, display: '0' } : 0;

    let value = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.faceDown) continue; // Don't count hidden cards
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank);
      }
    }

    const hardValue = value - (aces * 10);
    let softValue = value;

    while (softValue > 21 && aces > 0) {
      softValue -= 10;
      aces--;
    }

    if (showSoft) {
      const hasUsableAce = hand.some(c => !c.faceDown && c.rank === 'A') && softValue !== hardValue && softValue <= 21;

      if (hasUsableAce) {
        return {
          soft: softValue,
          hard: hardValue,
          display: `${hardValue}/${softValue}`
        };
      } else {
        return {
          soft: softValue,
          hard: softValue,
          display: `${softValue}`
        };
      }
    }

    return softValue;
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-casino-gold text-xl">Shuffling deck...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-8 p-4 sm:p-8 bg-radial-gradient from-casino-green via-casino-green-dark to-black bg-felt-texture min-h-[500px] sm:min-h-[600px] rounded-2xl shadow-felt-depth">
      {/* Fix 5.8: Win Celebration scaled with payout */}
      <WinCelebration
        show={gameState?.result && showDealerHole && (gameState.result.outcome === 'win' || gameState.result.outcome === 'blackjack')}
        payout={gameState?.result?.payout || 0}
      />

      {/* Dealer's Hand */}
      <div className="flex flex-col items-center gap-2 sm:gap-4">
        {gameState?.dealerHand && gameState.dealerHand.length > 0 && (
          <>
            <Hand
              cards={gameState.dealerHand}
              faceDownFirst={!showDealerHole && gameState.gameState !== 'betting'}
              label="Dealer"
              dealDelay={0.5}
            />
            {/* Fix 5.1: Show dealer hand value */}
            <div className="text-white text-sm sm:text-lg font-bold bg-black/40 px-3 py-1 rounded-lg">
              {showDealerHole || gameState.gameState === 'betting'
                ? getHandValue(gameState.dealerHand, true).display || getHandValue(gameState.dealerHand)
                : '?'
              }
            </div>
          </>
        )}
      </div>

      {/* Result Display */}
      {gameState?.result && showDealerHole && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`
            px-4 sm:px-8 py-3 sm:py-4 rounded-xl border-4 backdrop-blur-lg
            ${gameState.result.outcome === 'win' || gameState.result.outcome === 'blackjack'
              ? 'bg-gradient-to-br from-green-600/80 to-green-800/80 border-green-400 shadow-glow-green'
              : gameState.result.outcome === 'push'
              ? 'bg-black/60 border-casino-gold shadow-glow-gold'
              : 'bg-gradient-to-br from-red-600/80 to-red-800/80 border-red-400 shadow-glow-red'}
          `}
        >
          <div className="text-center">
            <div className={`text-xl sm:text-3xl font-black mb-1 sm:mb-2 drop-shadow-lg ${
              gameState.result.outcome === 'win' || gameState.result.outcome === 'blackjack'
              ? 'text-green-100' : gameState.result.outcome === 'push' ? 'text-casino-gold' : 'text-red-100'
            }`}>
              {gameState.result.outcome.toUpperCase()}
            </div>
            <div className="text-white text-base sm:text-xl font-semibold">
              {gameState.result.payout > 0 && `Won $${gameState.result.payout}`}
              {gameState.result.payout === 0 && gameState.result.outcome !== 'push' && 'Lost'}
              {gameState.result.outcome === 'push' && 'Push - Bet Returned'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Player's Hands */}
      <div className="flex gap-4 sm:gap-8 flex-wrap justify-center">
        {gameState?.playerHands?.map((hand, index) => {
          const handVal = getHandValue(hand, true);
          return (
            <div key={index} className="flex flex-col items-center gap-2 sm:gap-4">
              <Hand
                cards={hand}
                label={`Player${gameState.playerHands.length > 1 ? ` ${index + 1}` : ''}`}
                dealDelay={0}
              />
              {/* Fix 5.1: Show player hand value */}
              {hand.length > 0 && (
                <div className="text-white text-sm sm:text-lg font-bold bg-black/40 px-3 py-1 rounded-lg">
                  {handVal.display || handVal}
                </div>
              )}
              {gameState.currentHandIndex === index && gameState.gameState === 'player-turn' && (
                <div className="text-casino-gold animate-pulse text-sm">← Active</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Betting Area */}
      {(!gameState || gameState.gameState === 'betting' || gameState.gameState === 'finished') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-2xl"
        >
          <div className="text-center">
            <div className="text-casino-gold text-base sm:text-lg mb-1 sm:mb-2">Current Bet</div>
            <div className="text-white text-2xl sm:text-3xl font-bold">${betAmount}</div>
          </div>

          {/* Fix 5.5: Balance validation error message */}
          <AnimatePresence>
            {betError && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="bg-red-600/80 text-white px-4 py-2 rounded-lg border border-red-400 text-sm font-semibold"
              >
                {betError}
              </motion.div>
            )}
          </AnimatePresence>

          <ChipSelector
            onSelectChip={setSelectedChip}
            selectedChip={selectedChip}
          />

          <div className="flex gap-2 sm:gap-4 flex-wrap justify-center">
            <Button onClick={handlePlaceBet} variant="secondary">
              Add ${selectedChip}
            </Button>
            {/* Fix 5.7: Undo last chip */}
            <Button onClick={handleUndoLastChip} variant="ghost" disabled={betAmount === 0}>
              Undo
            </Button>
            <Button onClick={handleClearBet} variant="danger" disabled={betAmount === 0}>
              Clear
            </Button>
            {/* Fix 5.2: Rebet & Deal button */}
            <Button
              onClick={handleStartHand}
              disabled={betAmount === 0}
              variant="primary"
            >
              {gameState?.gameState === 'finished' ? 'Rebet & Deal' : 'Deal Cards'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Game Actions */}
      {gameState?.gameState === 'player-turn' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3 sm:gap-4 items-center"
        >
          <div className="flex gap-2 sm:gap-4 flex-wrap justify-center">
            <Button onClick={() => { hit(); sounds.cardDeal(); }} variant="primary">
              Hit
            </Button>
            <Button onClick={() => { stand(); sounds.buttonClick(); }} variant="secondary">
              Stand
            </Button>
            {gameState.canDoubleDown && (
              <Button onClick={handleDoubleDown} variant="ghost">
                Double{doubleDownFaceDown ? ' (Down)' : ' (Up)'}
              </Button>
            )}
            {gameState.canSplit && (
              <Button onClick={() => { split(); sounds.cardDeal(); }} variant="ghost">
                Split
              </Button>
            )}
          </div>

          {gameState.canDoubleDown && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <label className="text-casino-gold cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={doubleDownFaceDown}
                  onChange={(e) => setDoubleDownFaceDown(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span>Deal double down card face down</span>
              </label>
            </div>
          )}
        </motion.div>
      )}

      {/* Shoe Info */}
      {gameState && (
        <div className="text-casino-gold text-xs sm:text-sm opacity-50">
          Cards remaining: {gameState.shoeSize}
        </div>
      )}
    </div>
  );
};
