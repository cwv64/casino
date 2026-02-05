import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBlackjack } from '../../hooks/useBlackjack';
import { Hand } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChipSelector } from '../ui/Chip';

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
    }
  };

  const handlePlaceBet = () => {
    setBetAmount(prev => prev + selectedChip);
  };

  const handleClearBet = () => {
    setBetAmount(0);
  };

  const handleDoubleDown = () => {
    doubleDown(doubleDownFaceDown);
  };

  const getHandValue = (hand) => {
    if (!hand) return 0;
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

    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-casino-gold text-xl">Shuffling deck...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 p-8 bg-gradient-to-b from-casino-green-dark to-casino-green min-h-[600px] rounded-2xl">
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
            {showDealerHole && gameState.gameState === 'finished' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white text-lg font-semibold"
              >
                Value: {getHandValue(gameState.dealerHand)}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Result Display */}
      {gameState?.result && showDealerHole && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-charcoal-dark px-8 py-4 rounded-lg border-2 border-casino-gold"
        >
          <div className="text-center">
            <div className="text-casino-gold text-2xl font-bold mb-2">
              {gameState.result.outcome.toUpperCase()}
            </div>
            <div className="text-white text-xl">
              {gameState.result.payout > 0 && `Won $${gameState.result.payout}`}
              {gameState.result.payout === 0 && gameState.result.outcome !== 'push' && 'Lost'}
              {gameState.result.outcome === 'push' && 'Push - Bet Returned'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Player's Hands */}
      <div className="flex gap-8">
        {gameState?.playerHands?.map((hand, index) => (
          <div key={index} className="flex flex-col items-center gap-4">
            <Hand
              cards={hand}
              label={`Player${gameState.playerHands.length > 1 ? ` ${index + 1}` : ''}`}
              dealDelay={0}
            />
            <div className="text-white text-lg font-semibold">
              Value: {getHandValue(hand)}
              {getHandValue(hand) > 21 && ' - BUST!'}
            </div>
            {gameState.currentHandIndex === index && gameState.gameState === 'player-turn' && (
              <div className="text-casino-gold animate-pulse">← Active</div>
            )}
          </div>
        ))}
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
