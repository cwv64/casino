import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCraps } from '../../hooks/useCraps';
import { DicePair } from '../ui/Dice';
import { Button } from '../ui/Button';
import { ChipSelector, Chip } from '../ui/Chip';
import { DealerPuck } from '../ui/DealerPuck';
import { useWalletStore } from '../../stores/walletStore';
import { WinCelebration } from '../ui/WinCelebration';
import { DealerChat } from '../ui/DealerChat';
import { X } from 'lucide-react';
import { sounds } from '../../utils/sounds';

// Fix 5.6: Table limits
const TABLE_MIN = 5;
const TABLE_MAX = 500;

// Extracted to top-level to avoid re-creation on every render (fix 6.4)
const BetArea = ({ label, betType, amount, onClick, onRemove, disabled, className = '', tooltip, showAmount = true, highlightedBets, isProcessing, isRolling }) => {
  const hasBet = amount > 0;
  const isDisabled = disabled || isProcessing || isRolling;
  const isWinner = highlightedBets.winners.includes(betType);
  const isLoser = highlightedBets.losers.includes(betType);

  return (
    <div className="relative">
      <motion.button
        whileHover={!isDisabled ? { scale: 1.05, y: -2 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        onClick={() => !isDisabled && onClick && onClick()}
        onContextMenu={(e) => {
          e.preventDefault();
          if (hasBet && onRemove && !isDisabled) onRemove();
        }}
        disabled={isDisabled}
        className={`
          relative border-2 rounded-xl flex items-center justify-center
          font-bold transition-all duration-300 w-full h-full
          ${!isDisabled ? 'cursor-pointer hover:border-casino-gold hover:shadow-glow-gold' : 'opacity-50 cursor-not-allowed'}
          ${hasBet ? 'border-casino-gold bg-casino-gold/20 shadow-lg' : 'border-white/40 bg-black/20'}
          ${isWinner ? 'border-green-400 bg-green-500/30 shadow-glow-green animate-pulse' : ''}
          ${isLoser ? 'border-red-400 bg-red-500/30 shadow-glow-red' : ''}
          ${className}
        `}
        title={tooltip}
      >
        <div className="text-center">
          {label}
        </div>

        {hasBet && showAmount && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-3 -right-3"
          >
            <Chip value={amount} className="w-8 h-8 sm:w-12 sm:h-12 text-[0.5rem] sm:text-xs" />
          </motion.div>
        )}
      </motion.button>

      {/* Fix 3.5: Touch-friendly remove button (visible on mobile and desktop) */}
      {hasBet && onRemove && !isDisabled && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-2 -left-2 z-20 w-5 h-5 sm:w-6 sm:h-6 bg-red-600 border border-red-400 rounded-full flex items-center justify-center text-white shadow-lg"
          aria-label={`Remove ${betType} bet`}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

// Extracted to top-level (fix 6.4)
const NumberBox = ({ number, displayText, gameState, handlePlaceBet, handleRemoveBet, highlightedBets, isProcessing, isRolling }) => {
  const comeBet = gameState?.bets?.comeNumbers?.[number];
  const dontComeBet = gameState?.bets?.dontComeNumbers?.[number];
  const placeBetAmt = gameState?.bets?.place?.[number];
  const showPuck = gameState?.puckPosition === number;
  const isPoint = gameState?.point === number;
  const betAreaProps = { highlightedBets, isProcessing, isRolling };

  return (
    <div className="flex flex-col gap-0.5 sm:gap-1">
      {/* LAY area */}
      <div className="relative h-5 sm:h-8 text-[0.5rem] sm:text-xs bg-black bg-opacity-30 border border-white border-opacity-40 rounded-md flex items-center justify-center text-white font-bold">
        LAY
        {dontComeBet?.amount > 0 && (
          <motion.div
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            className="absolute -top-2 -right-2"
          >
            <Chip value={dontComeBet.amount} className="w-6 h-6 sm:w-10 sm:h-10 text-[0.45rem] sm:text-xs" />
          </motion.div>
        )}
      </div>

      {/* Main number box */}
      <div className={`relative border-2 sm:border-4 ${isPoint ? 'border-casino-gold shadow-glow-gold-lg animate-pulse-glow' : 'border-casino-gold/60'} bg-gradient-to-br from-casino-green-dark to-black/60 p-1 sm:p-4 rounded-lg sm:rounded-xl min-h-[55px] sm:min-h-[120px] flex flex-col items-center justify-center overflow-hidden`}>
        {showPuck && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute -top-2 -right-2 sm:-top-8 sm:right-auto z-10"
          >
            <DealerPuck isOn={true} position={number} />
          </motion.div>
        )}

        <div
          className={`font-bold ${isPoint ? 'text-casino-gold' : 'text-white'}`}
          style={{ fontSize: 'clamp(1rem, 4vw, 3rem)' }}
        >
          {displayText || number}
        </div>

        {comeBet?.amount > 0 && (
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            className="absolute top-0.5 right-0.5 sm:top-2 sm:right-2"
          >
            <Chip value={comeBet.amount} className="w-6 h-6 sm:w-10 sm:h-10 text-[0.45rem] sm:text-xs" />
          </motion.div>
        )}

        {placeBetAmt > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-0.5 left-0.5 sm:bottom-2 sm:left-2"
          >
            <Chip value={placeBetAmt} className="w-6 h-6 sm:w-10 sm:h-10 text-[0.45rem] sm:text-xs" />
          </motion.div>
        )}
      </div>

      {/* PLACE / BUY buttons */}
      <div className="grid grid-cols-2 gap-0.5">
        <BetArea
          label="PLACE"
          betType={`place${number}`}
          amount={gameState?.bets?.place?.[number] || 0}
          onClick={() => handlePlaceBet('place', number)}
          onRemove={() => handleRemoveBet('place', number)}
          disabled={false}
          className="h-6 sm:h-10 text-[0.45rem] sm:text-xs bg-casino-green"
          showAmount={false}
          {...betAreaProps}
        />
        <BetArea
          label="BUY"
          betType={`buy${number}`}
          amount={0}
          disabled={true}
          className="h-6 sm:h-10 text-[0.45rem] sm:text-xs bg-casino-green opacity-50"
          {...betAreaProps}
        />
      </div>
    </div>
  );
};

export const CrapsTable = () => {
  const [selectedChip, setSelectedChip] = useState(10);
  const [isRolling, setIsRolling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedBets, setHighlightedBets] = useState({ winners: [], losers: [] });
  const [movingChips, setMovingChips] = useState([]);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [winPayout, setWinPayout] = useState(0);
  const [betError, setBetError] = useState(null);
  const [dealerEvent, setDealerEvent] = useState(null);

  // Fix 5.10: Track bet history as a stack for undo
  const betHistoryRef = useRef([]);

  // Fix 4.4: totalBets is now a memoized value from the hook, not a function call
  const { gameState, rollResult, placeBet, removeBet, roll, resetBets, totalBets, balance } = useCraps();
  const { deposit } = useWalletStore();
  const canRoll = totalBets > 0 && !isRolling && !isProcessing;

  const showBetError = (msg) => {
    setBetError(msg);
    sounds.error();
    setTimeout(() => setBetError(null), 2000);
  };

  const handlePlaceBet = useCallback((betType, number = null) => {
    // Fix 5.6: Enforce table limits
    if (selectedChip < TABLE_MIN) {
      showBetError(`Minimum bet is $${TABLE_MIN}`);
      return;
    }
    if (selectedChip > TABLE_MAX) {
      showBetError(`Maximum bet is $${TABLE_MAX}`);
      return;
    }
    // Fix 5.5: Balance validation
    if (balance < selectedChip) {
      showBetError(`Insufficient funds! Balance: $${balance.toLocaleString()}`);
      return;
    }

    const result = placeBet(betType, selectedChip, number);
    if (result.success) {
      // Fix 5.10: Push to bet history stack
      betHistoryRef.current.push({ betType, amount: selectedChip, number });
      sounds.chipPlace();
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    } else if (result.error) {
      showBetError(result.error);
    }
  }, [balance, selectedChip, placeBet]);

  const handleRemoveBet = useCallback((betType, number = null) => {
    const refunded = removeBet(betType, number);
    if (refunded) {
      sounds.chipRemove();
    }
  }, [removeBet]);

  const handleRoll = async () => {
    if (!canRoll) return;

    setIsRolling(true);
    setIsProcessing(true);
    setDealerEvent('roll');
    sounds.diceRoll();

    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }

    const result = await roll();

    // Clear bet history after rolling (bets are locked in)
    betHistoryRef.current = [];

    setTimeout(async () => {
      setIsRolling(false);

      if (result.outcomes && result.outcomes.length > 0) {
        const winners = [];
        const losers = [];
        let totalPayout = 0;

        const comeMovement = result.outcomes.find(o => o.result === 'moved');
        if (comeMovement) {
          setMovingChips([{
            from: 'come',
            to: comeMovement.toNumber,
            amount: comeMovement.amount
          }]);
          setTimeout(() => setMovingChips([]), 1000);
        }

        result.outcomes.forEach(outcome => {
          if (outcome.result === 'win') {
            winners.push(outcome.bet);
            totalPayout += outcome.payout;
          } else if (outcome.result === 'push') {
            totalPayout += outcome.payout;
          } else if (outcome.result === 'lose') {
            losers.push(outcome.bet);
          }
        });

        setHighlightedBets({ winners, losers });

        // 3.3: Dealer chat based on roll outcome
        const sevenOut = result.outcomes.find(o => o.event === 'sevenOut');
        const pointMade = result.outcomes.find(o => o.event === 'pointMade');
        const pointEstablished = result.outcomes.find(o => o.result === 'pointEstablished');
        const hardwayWin = result.outcomes.find(o => o.bet?.startsWith('hard') && o.result === 'win');

        if (sevenOut) setDealerEvent('sevenOut');
        else if (pointMade) setDealerEvent('pointMade');
        else if (pointEstablished) setDealerEvent('pointSet');
        else if (hardwayWin) setDealerEvent('hardway');
        else if (totalPayout >= 100) setDealerEvent('bigWin');
        else if (result.roll.total === 7 && result.phase === 'comeOut') setDealerEvent('seven');
        else if ([2, 3, 12].includes(result.roll.total)) setDealerEvent('craps');

        if (totalPayout > 0) {
          deposit(totalPayout);
          setWinPayout(totalPayout);
          setShowWinCelebration(true);
          if (totalPayout >= 100) sounds.bigWin();
          else sounds.win();
          setTimeout(() => setShowWinCelebration(false), 3000);
        } else if (losers.length > 0) {
          sounds.lose();
        }

        // 3.7: Extended highlight duration from 2s to 3.5s
        setTimeout(() => {
          setHighlightedBets({ winners: [], losers: [] });
          setIsProcessing(false);
        }, 3500);
      } else {
        setIsProcessing(false);
      }
    }, 1200);
  };

  const handleClearBets = () => {
    const refund = resetBets();
    let total = 0;
    Object.values(refund).forEach(val => {
      if (typeof val === 'number') total += val;
      else if (typeof val === 'object') {
        Object.values(val).forEach(v => {
          if (typeof v === 'number') total += v;
          else if (v.amount) total += v.amount + (v.odds || 0);
        });
      }
    });
    if (total > 0) deposit(total);
    betHistoryRef.current = [];
    sounds.chipRemove();
  };

  // Fix 5.10: Clear only the LAST bet placed (not all bets)
  const handleClearLastBet = () => {
    const history = betHistoryRef.current;
    if (history.length === 0) return;

    const lastBet = history.pop();
    const refunded = removeBet(lastBet.betType, lastBet.number);
    if (refunded > 0) {
      sounds.chipRemove();
    }
  };

  const betAreaProps = { highlightedBets, isProcessing, isRolling };

  return (
    <div className="relative flex flex-col items-center gap-3 sm:gap-6 p-2 sm:p-6 bg-radial-gradient from-casino-green via-casino-green-dark to-black bg-felt-texture min-h-[700px] sm:min-h-[900px] rounded-2xl shadow-felt-depth max-w-full box-border overflow-x-hidden vignette">
      <WinCelebration show={showWinCelebration} payout={winPayout} />

      {/* 3.3: Dealer chat */}
      <div className="relative z-10">
        <DealerChat game="craps" event={dealerEvent} />
      </div>

      {/* Phase and Point Display */}
      <div className="flex gap-2 sm:gap-8 items-center flex-wrap justify-center relative z-10">
        <div className="bg-black/50 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-casino-gold shadow-glow-gold">
          <div className="text-casino-gold text-xs sm:text-sm font-semibold">Phase</div>
          <div className="text-white text-base sm:text-xl font-bold capitalize">
            {gameState?.phase === 'comeOut' ? 'Come Out' : 'Point'}
          </div>
        </div>

        {gameState?.point && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-yellow-400 via-casino-gold to-yellow-600 px-4 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-glow-gold-lg border-2 sm:border-4 border-yellow-300"
          >
            <div className="text-charcoal text-xs sm:text-sm font-bold">Point</div>
            <div className="text-charcoal text-2xl sm:text-4xl font-black drop-shadow-lg">{gameState.point}</div>
          </motion.div>
        )}

        <div className="bg-black/50 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-casino-gold shadow-glow-gold">
          <div className="text-casino-gold text-xs sm:text-sm font-semibold">Total Bets</div>
          <div className="text-white text-base sm:text-xl font-bold">${totalBets}</div>
        </div>
      </div>

      <div className="relative z-10">
        <ChipSelector onSelectChip={setSelectedChip} selectedChip={selectedChip} />
      </div>

      {/* Fix 5.6: Table limits display */}
      <div className="text-gray-400 text-[0.6rem] sm:text-xs">
        Table Limits: ${TABLE_MIN} - ${TABLE_MAX}
      </div>

      {/* Fix 5.5: Balance validation error */}
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

      {/* Controls */}
      <div className="flex gap-2 sm:gap-4 flex-wrap justify-center relative z-10">
        <Button
          onClick={handleRoll}
          disabled={!canRoll}
          variant="primary"
          className="text-base sm:text-xl px-6 sm:px-12 py-3 sm:py-4"
        >
          {isRolling ? 'Rolling...' : isProcessing ? 'Processing...' : 'Roll Dice'}
        </Button>

        <Button
          onClick={handleClearBets}
          disabled={totalBets === 0 || isProcessing || isRolling}
          variant="danger"
        >
          Clear All
        </Button>

        {/* Fix 5.10: Clear Last now only removes the last bet placed */}
        <Button
          onClick={handleClearLastBet}
          disabled={betHistoryRef.current.length === 0 || isProcessing || isRolling}
          variant="secondary"
        >
          Undo Last
        </Button>
      </div>

      {/* Dice Display */}
      <div className="relative z-10 bg-black/60 p-3 sm:p-8 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-casino-gold shadow-glow-gold-lg min-h-[80px] sm:min-h-[150px] flex items-center justify-center w-full max-w-md">
        {rollResult ? (
          <DicePair
            die1={rollResult.roll.die1}
            die2={rollResult.roll.die2}
            isRolling={isRolling}
          />
        ) : (
          <div className="text-casino-gold text-lg sm:text-2xl font-bold">Ready to roll!</div>
        )}
      </div>

      {/* Outcomes Display */}
      <AnimatePresence>
        {rollResult?.outcomes && rollResult.outcomes.length > 0 && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-1 sm:gap-2 justify-center max-w-4xl"
          >
            {rollResult.outcomes.map((outcome, idx) => (
              outcome.message && (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    px-2 sm:px-4 py-1 sm:py-2 rounded-lg border-2 font-semibold text-xs sm:text-base
                    ${outcome.result === 'win' ? 'bg-green-600 border-green-400 text-white' : ''}
                    ${outcome.result === 'lose' ? 'bg-red-600 border-red-400 text-white' : ''}
                    ${outcome.result === 'moved' ? 'bg-blue-600 border-blue-400 text-white' : ''}
                    ${outcome.result === 'pointEstablished' ? 'bg-casino-gold border-yellow-500 text-charcoal' : ''}
                  `}
                >
                  {outcome.message}
                  {outcome.payout > 0 && ` +$${outcome.payout}`}
                </motion.div>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Craps Table Layout - 3 cols mobile, 7 cols desktop */}
      <div className="w-full max-w-7xl bg-gradient-to-br from-casino-green-dark via-casino-green to-casino-green-light bg-felt-texture border-2 sm:border-8 border-casino-gold shadow-glow-gold-lg rounded-xl sm:rounded-3xl p-2 sm:p-8 relative box-border overflow-hidden z-10">

        {/* Number Boxes */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-1 sm:gap-3 mb-2 sm:mb-6">
          <NumberBox number={4} gameState={gameState} handlePlaceBet={handlePlaceBet} handleRemoveBet={handleRemoveBet} {...betAreaProps} />
          <NumberBox number={5} gameState={gameState} handlePlaceBet={handlePlaceBet} handleRemoveBet={handleRemoveBet} {...betAreaProps} />
          <NumberBox number={6} displayText="SIX" gameState={gameState} handlePlaceBet={handlePlaceBet} handleRemoveBet={handleRemoveBet} {...betAreaProps} />
          <NumberBox number={8} gameState={gameState} handlePlaceBet={handlePlaceBet} handleRemoveBet={handleRemoveBet} {...betAreaProps} />
          <NumberBox number={9} displayText="NINE" gameState={gameState} handlePlaceBet={handlePlaceBet} handleRemoveBet={handleRemoveBet} {...betAreaProps} />
          <NumberBox number={10} gameState={gameState} handlePlaceBet={handlePlaceBet} handleRemoveBet={handleRemoveBet} {...betAreaProps} />

          {/* Don't Come Bar */}
          <div className="flex flex-col gap-0.5 sm:gap-1 col-span-3 sm:col-span-1">
            <div className="h-5 sm:h-8 hidden sm:block"></div>
            <BetArea
              label={
                <div className="flex flex-row sm:flex-col items-center gap-1 sm:gap-0">
                  <span className="text-[0.5rem] sm:text-xs">DON'T</span>
                  <span className="text-sm sm:text-lg font-bold">COME</span>
                  <span className="text-[0.5rem] sm:text-xs">BAR</span>
                  <span className="text-base sm:text-2xl">⚅⚅</span>
                </div>
              }
              betType="dontCome"
              amount={gameState?.bets?.dontCome || 0}
              onClick={() => handlePlaceBet('dontCome')}
              onRemove={() => handleRemoveBet('dontCome')}
              disabled={gameState?.phase === 'comeOut'}
              className="min-h-[45px] sm:min-h-[120px] bg-black bg-opacity-20 text-white"
              {...betAreaProps}
            />
            <div className="hidden sm:block h-[52px]"></div>
          </div>
        </div>

        {/* Come Area + Field */}
        <div className="grid grid-cols-2 gap-1 sm:gap-4 mb-1.5 sm:mb-4">
          <BetArea
            label={<div className="text-lg sm:text-4xl text-red-500 font-black">COME</div>}
            betType="come"
            amount={gameState?.bets?.come || 0}
            onClick={() => handlePlaceBet('come')}
            onRemove={() => handleRemoveBet('come')}
            disabled={gameState?.phase === 'comeOut'}
            className="h-14 sm:h-32 bg-casino-green-dark"
            {...betAreaProps}
          />
          <BetArea
            label={
              <div className="flex flex-col items-center">
                <div className="text-[0.5rem] sm:text-sm text-gray-300">PAYS DOUBLE</div>
                <div className="text-[0.5rem] sm:text-xl">2·3·4·9·10·11·12</div>
                <div className="text-base sm:text-3xl font-black">FIELD</div>
              </div>
            }
            betType="field"
            amount={gameState?.bets?.field || 0}
            onClick={() => handlePlaceBet('field')}
            onRemove={() => handleRemoveBet('field')}
            disabled={false}
            className="h-14 sm:h-32 bg-casino-green text-white"
            {...betAreaProps}
          />
        </div>

        {/* Don't Pass */}
        <BetArea
          label={
            <div className="flex items-center justify-between px-2 sm:px-8 gap-2">
              <span className="text-xs sm:text-3xl font-black">DON'T PASS BAR</span>
              <span className="text-lg sm:text-4xl">⚅⚅</span>
            </div>
          }
          betType="dontPass"
          amount={gameState?.bets?.dontPass || 0}
          onClick={() => handlePlaceBet('dontPass')}
          onRemove={() => handleRemoveBet('dontPass')}
          disabled={gameState?.phase !== 'comeOut'}
          className="h-10 sm:h-20 mb-1 sm:mb-3 bg-black bg-opacity-30 text-white"
          tooltip={gameState?.phase !== 'comeOut' ? 'Only available on Come Out Roll' : 'Don\'t Pass Bar'}
          {...betAreaProps}
        />

        {/* Pass Line */}
        <BetArea
          label={<span className="text-lg sm:text-4xl font-black text-blue-300">PASS LINE</span>}
          betType="passLine"
          amount={gameState?.bets?.passLine || 0}
          onClick={() => handlePlaceBet('passLine')}
          onRemove={() => handleRemoveBet('passLine')}
          disabled={gameState?.phase !== 'comeOut'}
          className="h-12 sm:h-24 bg-casino-green-dark border-2 sm:border-4"
          tooltip={gameState?.phase !== 'comeOut' ? 'Only available on Come Out Roll' : 'Pass Line'}
          {...betAreaProps}
        />

        {/* Proposition Bets */}
        <div className="mt-1.5 sm:mt-4 bg-black bg-opacity-30 p-1.5 sm:p-4 rounded-lg border-2 border-casino-gold">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-4">
            <div className="bg-black bg-opacity-50 p-1 sm:p-3 rounded-lg">
              <div className="text-casino-gold text-[0.5rem] sm:text-xs font-bold mb-0.5 sm:mb-2 text-center">HARDWAYS</div>
              <div className="grid grid-cols-2 gap-0.5 sm:gap-2">
                {[4, 6, 8, 10].map(num => (
                  <BetArea
                    key={num}
                    label={<div className="text-[0.45rem] sm:text-xs leading-tight">HARD<br/>{num}<br/>{num === 4 || num === 10 ? '7:1' : '9:1'}</div>}
                    betType="hardway"
                    amount={gameState?.bets?.hardways?.[num] || 0}
                    onClick={() => handlePlaceBet('hardway', num)}
                    onRemove={() => handleRemoveBet('hardway', num)}
                    className="h-9 sm:h-16 bg-casino-green-dark"
                    {...betAreaProps}
                  />
                ))}
              </div>
            </div>

            <div className="bg-black bg-opacity-50 p-1 sm:p-3 rounded-lg">
              <div className="text-casino-gold text-[0.5rem] sm:text-xs font-bold mb-0.5 sm:mb-2 text-center">ONE ROLL BETS</div>
              <div className="grid grid-cols-2 gap-0.5 sm:gap-2">
                <BetArea
                  label={<div className="text-[0.45rem] sm:text-xs text-red-500 leading-tight">ANY<br/>SEVEN<br/>4:1</div>}
                  betType="anySeven"
                  amount={gameState?.bets?.anySeven || 0}
                  onClick={() => handlePlaceBet('anySeven')}
                  onRemove={() => handleRemoveBet('anySeven')}
                  className="h-9 sm:h-16 bg-casino-green-dark"
                  {...betAreaProps}
                />
                <BetArea
                  label={<div className="text-[0.45rem] sm:text-xs leading-tight">ANY<br/>CRAPS<br/>7:1</div>}
                  betType="anyCraps"
                  amount={gameState?.bets?.anyCraps || 0}
                  onClick={() => handlePlaceBet('anyCraps')}
                  onRemove={() => handleRemoveBet('anyCraps')}
                  className="h-9 sm:h-16 bg-casino-green-dark"
                  {...betAreaProps}
                />
                <BetArea
                  label={<div className="text-[0.45rem] sm:text-xs leading-tight">HORN<br/>2<br/>30:1</div>}
                  betType="horn"
                  amount={gameState?.bets?.horn?.[2] || 0}
                  onClick={() => handlePlaceBet('horn', 2)}
                  onRemove={() => handleRemoveBet('horn', 2)}
                  className="h-9 sm:h-16 bg-casino-green-dark"
                  {...betAreaProps}
                />
                <BetArea
                  label={<div className="text-[0.45rem] sm:text-xs leading-tight">HORN<br/>12<br/>30:1</div>}
                  betType="horn"
                  amount={gameState?.bets?.horn?.[12] || 0}
                  onClick={() => handlePlaceBet('horn', 12)}
                  onRemove={() => handleRemoveBet('horn', 12)}
                  className="h-9 sm:h-16 bg-casino-green-dark"
                  {...betAreaProps}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-casino-gold text-xs sm:text-sm text-center max-w-2xl px-2">
        <p>Tap to place bet · Tap <span className="inline-flex items-center justify-center w-4 h-4 bg-red-600 rounded-full text-white text-[0.5rem]">X</span> to remove</p>
        <p className="text-[0.55rem] sm:text-xs mt-1 text-gray-400">
          Pass/Don't Pass only on Come Out · Come bets travel to numbers
        </p>
      </div>
    </div>
  );
};
