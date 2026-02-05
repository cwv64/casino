import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBlackjack } from '../../hooks/useBlackjack';
import { Hand } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChipSelector } from '../ui/Chip';
import { WinCelebration } from '../ui/WinCelebration';

export const BlackjackTable = () => {
  const [betAmount, setBetAmount] = useState(0);
  const [selectedChip, setSelectedChip] = useState(10);
  const [showDealerHole, setShowDealerHole] = useState(false);
  const [doubleDownFaceDown, setDoubleDownFaceDown] = useState(true); // Toggle for face-down double down
  const { gameState, isInitialized, startHand, hit, stand, doubleDown, split } = useBlackjack();

  // Delay showing dealer's hole card by 1.5 seconds when game finishes
  useEffect(() => {
    if (gameState?.gameState === 'finished') {
      setShowDealerHole(false);
      const timer = setTimeout(() => {
        setShowDealerHole(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowDealerHole(false);
    }
  }, [gameState?.gameState]);

  const handleStartHand = async () => {
    if (betAmount > 0) {
      await startHand(betAmount);
      setShowDealerHole(false);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    }
  };

  const handlePlaceBet = () => {
    setBetAmount(prev => prev + selectedChip);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleClearBet = () => {
    setBetAmount(0);
  };

  const handleDoubleDown = () => {
    doubleDown(doubleDownFaceDown);
  };

  const getHandValue = (hand, showSoft = false) => {
    if (!hand) return showSoft ? { soft: 0, hard: 0, display: '0' } : 0;

    let value = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank);
      }
    }

    const hardValue = value - (aces * 10); // All aces count as 1
    let softValue = value;

    // Adjust aces to prevent bust
    while (softValue > 21 && aces > 0) {
      softValue -= 10;
      aces--;
    }

    if (showSoft) {
      // Check if hand has usable ace (soft hand)
      const hasUsableAce = hand.some(c => c.rank === 'A') && softValue !== hardValue && softValue <= 21;

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
    <div className="flex flex-col items-center gap-8 p-8 bg-radial-gradient from-casino-green via-casino-green-dark to-black bg-felt-texture min-h-[600px] rounded-2xl shadow-felt-depth">
      {/* Win Celebration */}
      <WinCelebration
        show={gameState?.result && showDealerHole && (gameState.result.outcome === 'win' || gameState.result.outcome === 'blackjack')}
      />

      {/* Dealer's Hand */}
      <div className="flex flex-col items-center gap-4">
        {gameState?.dealerHand && gameState.dealerHand.length > 0 && (
          <>
            <Hand
              cards={gameState.dealerHand}
              faceDownFirst={!showDealerHole && gameState.gameState !== 'betting'}
              label="Dealer"
              dealDelay={0.5}
            />
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
            px-8 py-4 rounded-xl border-4 backdrop-blur-lg
            ${gameState.result.outcome === 'win' || gameState.result.outcome === 'blackjack'
              ? 'bg-gradient-to-br from-green-600/80 to-green-800/80 border-green-400 shadow-glow-green'
              : gameState.result.outcome === 'push'
              ? 'bg-black/60 border-casino-gold shadow-glow-gold'
              : 'bg-gradient-to-br from-red-600/80 to-red-800/80 border-red-400 shadow-glow-red'}
          `}
        >
          <div className="text-center">
            <div className={`text-3xl font-black mb-2 drop-shadow-lg ${
              gameState.result.outcome === 'win' || gameState.result.outcome === 'blackjack'
              ? 'text-green-100' : gameState.result.outcome === 'push' ? 'text-casino-gold' : 'text-red-100'
            }`}>
              {gameState.result.outcome.toUpperCase()}
            </div>
            <div className="text-white text-xl font-semibold">
              {gameState.result.payout > 0 && `Won $${gameState.result.payout}`}
              {gameState.result.payout === 0 && gameState.result.outcome !== 'push' && 'Lost'}
              {gameState.result.outcome === 'push' && 'Push - Bet Returned'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Player's Hands */}
      <div className="flex gap-8">
        {gameState?.playerHands?.map((hand, index) => {
          return (
            <div key={index} className="flex flex-col items-center gap-4">
              <Hand
                cards={hand}
                label={`Player${gameState.playerHands.length > 1 ? ` ${index + 1}` : ''}`}
                dealDelay={0}
              />
              {gameState.currentHandIndex === index && gameState.gameState === 'player-turn' && (
                <div className="text-casino-gold animate-pulse">← Active</div>
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
          className="flex flex-col items-center gap-4 w-full max-w-2xl"
        >
          <div className="text-center">
            <div className="text-casino-gold text-lg mb-2">Current Bet</div>
            <div className="text-white text-3xl font-bold">${betAmount}</div>
          </div>

          <ChipSelector
            onSelectChip={setSelectedChip}
            selectedChip={selectedChip}
          />

          <div className="flex gap-4">
            <Button onClick={handlePlaceBet} variant="secondary">
              Add ${selectedChip}
            </Button>
            <Button onClick={handleClearBet} variant="danger">
              Clear Bet
            </Button>
            <Button
              onClick={handleStartHand}
              disabled={betAmount === 0}
              variant="primary"
            >
              Deal Cards
            </Button>
          </div>
        </motion.div>
      )}

      {/* Game Actions */}
      {gameState?.gameState === 'player-turn' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-4 items-center"
        >
          <div className="flex gap-4">
            <Button onClick={hit} variant="primary">
              Hit
            </Button>
            <Button onClick={stand} variant="secondary">
              Stand
            </Button>
            {gameState.canDoubleDown && (
              <Button onClick={handleDoubleDown} variant="ghost">
                Double Down {doubleDownFaceDown ? '(Face Down)' : '(Face Up)'}
              </Button>
            )}
            {gameState.canSplit && (
              <Button onClick={split} variant="ghost">
                Split
              </Button>
            )}
          </div>

          {/* Double Down Card Option */}
          {gameState.canDoubleDown && (
            <div className="flex items-center gap-2 text-sm">
              <label className="text-casino-gold cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={doubleDownFaceDown}
                  onChange={(e) => setDoubleDownFaceDown(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span>Deal double down card face down (traditional)</span>
              </label>
            </div>
          )}
        </motion.div>
      )}

      {/* Shoe Info */}
      {gameState && (
        <div className="text-casino-gold text-sm opacity-50">
          Cards remaining in shoe: {gameState.shoeSize}
        </div>
      )}
    </div>
  );
};
