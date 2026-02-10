import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlackjack } from '../../hooks/useBlackjack';
import { useWalletStore } from '../../stores/walletStore';
import { Hand } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChipSelector, Chip } from '../ui/Chip';
import { WinCelebration } from '../ui/WinCelebration';
import { DealerChat } from '../ui/DealerChat';
import { sounds } from '../../utils/sounds';

// 3.2: Chip stack visual for bet display
const ChipStack = ({ amount }) => {
  if (amount <= 0) return null;

  const denominations = [1000, 500, 100, 25, 10, 5];
  const chips = [];
  let remaining = amount;
  for (const d of denominations) {
    while (remaining >= d && chips.length < 8) {
      chips.push(d);
      remaining -= d;
    }
  }

  return (
    <div className="flex flex-col-reverse items-center relative h-16 sm:h-20">
      {chips.map((chipVal, i) => (
        <motion.div
          key={i}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 15 }}
          className="absolute"
          style={{ bottom: i * 4 }}
        >
          <Chip value={chipVal} className="w-9 h-9 sm:w-12 sm:h-12 text-[0.5rem] sm:text-xs pointer-events-none shadow-md" />
        </motion.div>
      ))}
      <div className="absolute -bottom-5 text-casino-gold text-xs sm:text-sm font-bold">
        ${amount}
      </div>
    </div>
  );
};

export const BlackjackTable = () => {
  const [betAmount, setBetAmount] = useState(0);
  const [selectedChip, setSelectedChip] = useState(10);
  const [showDealerHole, setShowDealerHole] = useState(false);
  const [doubleDownFaceDown, setDoubleDownFaceDown] = useState(true);
  const [betError, setBetError] = useState(null);
  const [showHandValues, setShowHandValues] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [dealerEvent, setDealerEvent] = useState(null);
  const { gameState, isInitialized, startHand, hit, stand, doubleDown, split } = useBlackjack();
  const { balance } = useWalletStore();

  // 3.1: Determine hand status for visual indicators
  const handStatuses = useMemo(() => {
    if (!gameState?.playerHands || !gameState.result) return [];
    return gameState.playerHands.map((hand, i) => {
      if (!gameState.result?.handResults) {
        if (gameState.result.outcome === 'bust') return 'bust';
        if (gameState.result.outcome === 'win' || gameState.result.outcome === 'blackjack') return 'win';
        if (gameState.result.outcome === 'lose') return 'lose';
        if (gameState.result.outcome === 'push') return 'push';
      } else {
        const hr = gameState.result.handResults[i];
        if (hr?.outcome === 'bust') return 'bust';
        if (hr?.outcome === 'win') return 'win';
        if (hr?.outcome === 'lose') return 'lose';
        if (hr?.outcome === 'push') return 'push';
      }
      return null;
    });
  }, [gameState?.result]);

  // Delay showing hand values until card deal animations complete
  useEffect(() => {
    if (gameState?.gameState === 'player-turn') {
      if (!showHandValues) {
        const timer = setTimeout(() => setShowHandValues(true), 1800);
        return () => clearTimeout(timer);
      }
    } else if (gameState?.gameState === 'betting') {
      setShowHandValues(false);
    }
  }, [gameState?.gameState]);

  // Brief delay when hitting to let card animation play
  useEffect(() => {
    const cardCount = gameState?.playerHands?.reduce((n, h) => n + h.length, 0) || 0;
    if (gameState?.gameState === 'player-turn' && showHandValues && cardCount > 0) {
      setShowHandValues(false);
      const timer = setTimeout(() => setShowHandValues(true), 600);
      return () => clearTimeout(timer);
    }
  }, [gameState?.playerHands?.reduce((n, h) => n + h.length, 0)]);

  // 3.3: Trigger dealer chat on game events + play result sounds
  useEffect(() => {
    if (gameState?.gameState === 'finished') {
      setShowDealerHole(false);
      setShowResult(false);
      setShowHandValues(true);

      // Calculate how long dealer card animations take from mount
      const dealerCards = gameState.dealerHand?.length || 2;
      // Each card animates in at: dealDelay(0.5) + index * 0.3, duration 0.5s
      // Last card finishes at: 0.5 + (dealerCards - 1) * 0.3 + 0.5
      const lastCardAnimEnd = 0.5 + (dealerCards - 1) * 0.3 + 0.5;
      // Hole card reveal happens at 1500ms; ensure all card slide-ins are done first
      const revealDelay = Math.max(1.5, lastCardAnimEnd + 0.2) * 1000;

      const timer = setTimeout(() => {
        setShowDealerHole(true);
        if (gameState.result) {
          const outcome = gameState.result.outcome;
          if (outcome === 'blackjack') {
            setDealerEvent('playerBlackjack');
            if (gameState.result.payout >= 100) sounds.bigWin();
            else sounds.win();
          } else if (outcome === 'win') {
            setDealerEvent(gameState.result.payout >= 200 ? 'bigWin' : 'win');
            if (gameState.result.payout >= 100) sounds.bigWin();
            else sounds.win();
          } else if (outcome === 'push') {
            setDealerEvent('push');
            sounds.push();
          } else if (outcome === 'bust') {
            setDealerEvent('bust');
            sounds.lose();
          } else {
            setDealerEvent('lose');
            sounds.lose();
          }
        }
        // Show result after hole card flip (0.6s) completes plus a small buffer
        setTimeout(() => setShowResult(true), 700);
      }, revealDelay);
      return () => clearTimeout(timer);
    } else {
      setShowDealerHole(false);
      setShowResult(false);
    }
  }, [gameState?.gameState]);

  const handleStartHand = async () => {
    if (betAmount > 0) {
      if (betAmount > balance) {
        setBetError(`Insufficient funds! Balance: $${balance.toLocaleString()}`);
        sounds.error();
        setTimeout(() => setBetError(null), 2500);
        return;
      }
      setDealerEvent('deal');
      await startHand(betAmount);
      sounds.cardDeal();
      setShowDealerHole(false);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }
  };

  const handlePlaceBet = () => {
    if (betAmount + selectedChip > balance) {
      setBetError(`Can't exceed balance ($${balance.toLocaleString()})`);
      sounds.error();
      setTimeout(() => setBetError(null), 2000);
      return;
    }
    setBetAmount(prev => prev + selectedChip);
    sounds.chipPlace();
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleClearBet = () => {
    setBetAmount(0);
    sounds.chipRemove();
  };

  const handleUndoLastChip = () => {
    setBetAmount(prev => Math.max(0, prev - selectedChip));
    sounds.chipRemove();
  };

  const handleDoubleDown = () => {
    setDealerEvent('doubleDown');
    doubleDown(doubleDownFaceDown);
    sounds.cardDeal();
  };

  const handleHit = () => {
    hit();
    sounds.cardDeal();
  };

  const handleStand = () => {
    setDealerEvent('stand');
    stand();
    sounds.buttonClick?.() || sounds.chipPlace();
  };

  const handleSplit = () => {
    setDealerEvent('split');
    split();
    sounds.cardDeal();
  };

  // Hand value calculation (also used for display)
  const getHandValue = (hand, showSoft = false) => {
    if (!hand) return showSoft ? { soft: 0, hard: 0, display: '0' } : 0;

    let value = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.faceDown) continue;
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
        return { soft: softValue, hard: hardValue, display: `${hardValue}/${softValue}` };
      }
      return { soft: softValue, hard: softValue, display: `${softValue}` };
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
    <div className="relative flex flex-col items-center gap-4 sm:gap-8 p-4 sm:p-8 bg-radial-gradient from-casino-green via-casino-green-dark to-black bg-felt-texture min-h-[500px] sm:min-h-[600px] rounded-2xl shadow-felt-depth vignette">
      <WinCelebration
        show={gameState?.result && showResult && (gameState.result.outcome === 'win' || gameState.result.outcome === 'blackjack')}
        payout={gameState?.result?.payout || 0}
      />

      {/* 3.3: Dealer chat bubble */}
      <div className="relative z-10">
        <DealerChat game="blackjack" event={dealerEvent} />
      </div>

      {/* Dealer's Hand */}
      <div className="flex flex-col items-center gap-2 sm:gap-4 relative z-10">
        {gameState?.dealerHand && gameState.dealerHand.length > 0 && (
          <>
            <Hand
              cards={gameState.dealerHand}
              faceDownFirst={!showDealerHole && gameState.gameState !== 'betting'}
              label="Dealer"
              dealDelay={0.5}
            />
            {showHandValues && (
              <div className="text-white text-sm sm:text-lg font-bold bg-black/40 px-3 py-1 rounded-lg">
                {showDealerHole
                  ? getHandValue(gameState.dealerHand, true).display || getHandValue(gameState.dealerHand)
                  : '?'
                }
              </div>
            )}
          </>
        )}
      </div>

      {/* Result Display */}
      {gameState?.result && showResult && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`
            relative z-10 px-4 sm:px-8 py-3 sm:py-4 rounded-xl border-4 backdrop-blur-lg
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

      {/* Player's Hands — with 3.1 bust/win indicators */}
      <div className="flex gap-4 sm:gap-8 flex-wrap justify-center relative z-10">
        {gameState?.playerHands?.map((hand, index) => {
          const handVal = getHandValue(hand, true);
          const status = showResult ? handStatuses[index] : null;

          return (
            <div
              key={index}
              className={`
                flex flex-col items-center gap-2 sm:gap-4 relative p-2 sm:p-3 rounded-xl transition-all duration-300
                ${status === 'win' ? 'hand-win bg-green-500/10' : ''}
                ${status === 'bust' ? 'hand-bust' : ''}
                ${status === 'lose' ? 'bg-red-500/5' : ''}
              `}
            >
              <Hand
                cards={hand}
                label={`Player${gameState.playerHands.length > 1 ? ` ${index + 1}` : ''}`}
                dealDelay={0}
              />

              {/* 3.1: BUST stamp overlay */}
              {status === 'bust' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="bust-stamp text-red-500 text-3xl sm:text-5xl font-black border-4 border-red-500 px-3 sm:px-5 py-1 sm:py-2 rounded-lg bg-red-500/10 backdrop-blur-sm">
                    BUST
                  </div>
                </div>
              )}

              {/* Hand value display */}
              {hand.length > 0 && showHandValues && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm sm:text-lg font-bold px-3 py-1 rounded-lg ${
                    status === 'bust' ? 'bg-red-600/60 text-red-100' :
                    status === 'win' ? 'bg-green-600/60 text-green-100' :
                    'bg-black/40 text-white'
                  }`}
                >
                  {handVal.display || handVal}
                </motion.div>
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
          className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-2xl relative z-10"
        >
          {/* 3.2: Chip stack visual for current bet */}
          <div className="text-center">
            <div className="text-casino-gold text-base sm:text-lg mb-1 sm:mb-2">Current Bet</div>
            {betAmount > 0 ? (
              <ChipStack amount={betAmount} />
            ) : (
              <div className="text-white text-2xl sm:text-3xl font-bold">$0</div>
            )}
          </div>

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
            <Button onClick={handleUndoLastChip} variant="ghost" disabled={betAmount === 0}>
              Undo
            </Button>
            <Button onClick={handleClearBet} variant="danger" disabled={betAmount === 0}>
              Clear
            </Button>
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
          className="flex flex-col gap-3 sm:gap-4 items-center relative z-10"
        >
          <div className="flex gap-2 sm:gap-4 flex-wrap justify-center">
            <Button onClick={handleHit} variant="primary">
              Hit
            </Button>
            <Button onClick={handleStand} variant="secondary">
              Stand
            </Button>
            {gameState.canDoubleDown && (
              <Button onClick={handleDoubleDown} variant="ghost">
                Double{doubleDownFaceDown ? ' (Down)' : ' (Up)'}
              </Button>
            )}
            {gameState.canSplit && (
              <Button onClick={handleSplit} variant="ghost">
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
        <div className="text-casino-gold text-xs sm:text-sm opacity-50 relative z-10">
          Cards remaining: {gameState.shoeSize}
        </div>
      )}
    </div>
  );
};
