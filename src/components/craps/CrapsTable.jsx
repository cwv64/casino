import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCraps } from '../../hooks/useCraps';
import { DicePair } from '../ui/Dice';
import { Button } from '../ui/Button';
import { ChipSelector, Chip } from '../ui/Chip';
import { DealerPuck } from '../ui/DealerPuck';
import { useWalletStore } from '../../stores/walletStore';
import { WinCelebration } from '../ui/WinCelebration';

export const CrapsTable = () => {
  const [selectedChip, setSelectedChip] = useState(10);
  const [isRolling, setIsRolling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedBets, setHighlightedBets] = useState({ winners: [], losers: [] });
  const [movingChips, setMovingChips] = useState([]);
  const [lastBetSnapshot, setLastBetSnapshot] = useState(null);
  const [showWinCelebration, setShowWinCelebration] = useState(false);

  const { gameState, rollResult, placeBet, removeBet, roll, resetBets, getTotalBets, balance } = useCraps();
  const { deposit } = useWalletStore();

  const totalBets = getTotalBets();
  const canRoll = totalBets > 0 && !isRolling && !isProcessing;

  // Save bet snapshot when placing first bet
  useEffect(() => {
    if (totalBets > 0 && !lastBetSnapshot) {
      setLastBetSnapshot(JSON.parse(JSON.stringify(gameState?.bets)));
    }
  }, [totalBets, lastBetSnapshot, gameState?.bets]);

  // Betting area component
  const BetArea = ({ label, betType, amount, onClick, onRemove, disabled, className = '', tooltip, showAmount = true }) => {
    const hasBet = amount > 0;
    const isDisabled = disabled || isProcessing || isRolling;
    const isWinner = highlightedBets.winners.includes(betType);
    const isLoser = highlightedBets.losers.includes(betType);

    return (
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
          font-bold transition-all duration-300
          backdrop-blur-sm
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
            <Chip value={amount} className="w-12 h-12 text-xs" />
          </motion.div>
        )}
      </motion.button>
    );
  };

  // Number box component for the top of the table
  const NumberBox = ({ number, displayText }) => {
    const comeBet = gameState?.bets?.comeNumbers?.[number];
    const dontComeBet = gameState?.bets?.dontComeNumbers?.[number];
    const placeBet = gameState?.bets?.place?.[number];
    const showPuck = gameState?.puckPosition === number;
    const isPoint = gameState?.point === number;

    return (
      <div className="flex flex-col gap-1">
        {/* LAY area - shows Don't Come bets */}
        <div className="relative h-6 sm:h-8 text-[0.65rem] sm:text-xs bg-black bg-opacity-30 border-2 border-white border-opacity-40 rounded-md flex items-center justify-center text-white font-bold">
          LAY
          {dontComeBet?.amount > 0 && (
            <motion.div
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              className="absolute -top-2 -right-2"
            >
              <Chip value={dontComeBet.amount} className="w-8 h-8 sm:w-10 sm:h-10 text-xs" />
            </motion.div>
          )}
        </div>

        {/* Main number box */}
        <div className={`relative border-2 sm:border-4 ${isPoint ? 'border-casino-gold shadow-glow-gold-lg animate-pulse-glow' : 'border-casino-gold/60'} bg-gradient-to-br from-casino-green-dark to-black/60 backdrop-blur-sm p-2 sm:p-4 rounded-lg sm:rounded-xl min-h-[80px] sm:min-h-[120px] flex flex-col items-center justify-center overflow-hidden`}>
          {/* Dealer Puck */}
          {showPuck && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute -top-6 sm:-top-8 z-10"
            >
              <DealerPuck isOn={true} position={number} />
            </motion.div>
          )}

          {/* Number display - Responsive sizing with clamp */}
          <div
            className={`font-bold ${isPoint ? 'text-casino-gold' : 'text-white'}`}
            style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}
          >
            {displayText || number}
          </div>

          {/* Come bet on this number */}
          {comeBet?.amount > 0 && (
            <motion.div
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              className="absolute top-1 right-1 sm:top-2 sm:right-2"
            >
              <Chip value={comeBet.amount} className="w-8 h-8 sm:w-10 sm:h-10 text-xs" />
            </motion.div>
          )}

          {/* Place bet indicator */}
          {placeBet > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2"
            >
              <Chip value={placeBet} className="w-8 h-8 sm:w-10 sm:h-10 text-xs" />
            </motion.div>
          )}
        </div>

        {/* PLACE / BUY buttons */}
        <div className="grid grid-cols-2 gap-1">
          <BetArea
            label="PLACE"
            betType={`place${number}`}
            amount={gameState?.bets?.place?.[number] || 0}
            onClick={() => handlePlaceBet('place', number)}
            onRemove={() => handleRemoveBet('place', number)}
            disabled={false}
            className="h-8 sm:h-10 text-[0.65rem] sm:text-xs bg-casino-green"
            showAmount={false}
          />
          <BetArea
            label="BUY"
            betType={`buy${number}`}
            amount={0}
            disabled={true}
            className="h-8 sm:h-10 text-[0.65rem] sm:text-xs bg-casino-green opacity-50"
          />
        </div>
      </div>
    );
  };

  const handlePlaceBet = (betType, number = null) => {
    if (balance >= selectedChip) {
      placeBet(betType, selectedChip, number);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }
  };

  const handleRemoveBet = (betType, number = null) => {
    const refunded = removeBet(betType, number);
    if (refunded) {
      deposit(refunded);
    }
  };

  const handleRoll = async () => {
    if (!canRoll) return;

    setIsRolling(true);
    setIsProcessing(true);

    // Haptic feedback for roll
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }

    // Roll the dice
    const result = await roll();

    // Show dice animation
    setTimeout(async () => {
      setIsRolling(false);

      // Process outcomes
      if (result.outcomes && result.outcomes.length > 0) {
        const winners = [];
        const losers = [];
        let totalPayout = 0;

        // Check for Come bet movement
        const comeMovement = result.outcomes.find(o => o.result === 'moved');
        if (comeMovement) {
          setMovingChips([{
            from: 'come',
            to: comeMovement.toNumber,
            amount: comeMovement.amount
          }]);

          // Clear animation after 1 second
          setTimeout(() => setMovingChips([]), 1000);
        }

        result.outcomes.forEach(outcome => {
          if (outcome.result === 'win') {
            winners.push(outcome.bet);
            totalPayout += outcome.payout;
          } else if (outcome.result === 'lose') {
            losers.push(outcome.bet);
          }
        });

        setHighlightedBets({ winners, losers });

        // Deposit winnings
        if (totalPayout > 0) {
          deposit(totalPayout);
          setShowWinCelebration(true);
          setTimeout(() => setShowWinCelebration(false), 3000);
        }

        // Clear highlights after delay
        setTimeout(() => {
          setHighlightedBets({ winners: [], losers: [] });
          setIsProcessing(false);
        }, 2000);
      } else {
        setIsProcessing(false);
      }
    }, 1200);
  };

  const handleClearBets = () => {
    const refund = resetBets();
    // Calculate total refund
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
    setLastBetSnapshot(null);
  };

  const handleClearLastBet = () => {
    if (!lastBetSnapshot) return;

    // Clear current bets
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
    setLastBetSnapshot(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-3 sm:p-6 bg-radial-gradient from-casino-green via-casino-green-dark to-black bg-felt-texture min-h-[900px] rounded-2xl shadow-felt-depth max-w-full box-border overflow-x-hidden">
      {/* Win Celebration */}
      <WinCelebration show={showWinCelebration} />

      {/* Phase and Point Display */}
      <div className="flex gap-2 sm:gap-8 items-center flex-wrap justify-center">
        <div className="bg-black/40 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-casino-gold shadow-glow-gold">
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

        <div className="bg-black/40 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-casino-gold shadow-glow-gold">
          <div className="text-casino-gold text-xs sm:text-sm font-semibold">Total Bets</div>
          <div className="text-white text-base sm:text-xl font-bold">${totalBets}</div>
        </div>
      </div>

      {/* Chip Selector */}
      <ChipSelector onSelectChip={setSelectedChip} selectedChip={selectedChip} />

      {/* Controls */}
      <div className="flex gap-4 flex-wrap justify-center">
        <Button
          onClick={handleRoll}
          disabled={!canRoll}
          variant="primary"
          className="text-xl px-12 py-4"
        >
          {isRolling ? 'Rolling...' : isProcessing ? 'Processing...' : 'Roll Dice'}
        </Button>

        <Button
          onClick={handleClearBets}
          disabled={totalBets === 0 || isProcessing || isRolling}
          variant="danger"
        >
          Clear All Bets
        </Button>

        <Button
          onClick={handleClearLastBet}
          disabled={!lastBetSnapshot || isProcessing || isRolling}
          variant="secondary"
        >
          Clear Last Bet
        </Button>
      </div>

      {/* Dice Display */}
      <div className="bg-black/50 backdrop-blur-lg p-4 sm:p-8 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-casino-gold shadow-glow-gold-lg min-h-[100px] sm:min-h-[150px] flex items-center justify-center w-full max-w-md">
        {rollResult ? (
          <DicePair
            die1={rollResult.roll.die1}
            die2={rollResult.roll.die2}
            isRolling={isRolling}
          />
        ) : (
          <div className="text-casino-gold text-2xl font-bold">Ready to roll!</div>
        )}
      </div>

      {/* Outcomes Display */}
      <AnimatePresence>
        {rollResult?.outcomes && rollResult.outcomes.length > 0 && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2 justify-center max-w-4xl"
          >
            {rollResult.outcomes.map((outcome, idx) => (
              outcome.message && (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    px-4 py-2 rounded-lg border-2 font-semibold
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

      {/* Main Craps Table Layout */}
      <div className="w-full max-w-7xl bg-gradient-to-br from-casino-green-dark via-casino-green to-casino-green-light bg-felt-texture border-4 sm:border-8 border-casino-gold shadow-glow-gold-lg rounded-2xl sm:rounded-3xl p-3 sm:p-8 relative box-border overflow-hidden">

        {/* Top: Number Boxes (4, 5, SIX, 8, NINE, 10) + Don't Come Bar */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3 mb-4 sm:mb-6">
          <NumberBox number={4} />
          <NumberBox number={5} />
          <NumberBox number={6} displayText="SIX" />
          <NumberBox number={8} />
          <NumberBox number={9} displayText="NINE" />
          <NumberBox number={10} />

          {/* Don't Come Bar */}
          <div className="flex flex-col gap-1">
            <div className="h-6 sm:h-8"></div>
            <BetArea
              label={
                <div className="flex flex-col items-center">
                  <div className="text-[0.6rem] sm:text-xs">DON'T</div>
                  <div className="text-sm sm:text-lg font-bold">COME</div>
                  <div className="text-[0.6rem] sm:text-xs">BAR</div>
                  <div className="text-lg sm:text-2xl">⚅⚅</div>
                </div>
              }
              betType="dontCome"
              amount={gameState?.bets?.dontCome || 0}
              onClick={() => handlePlaceBet('dontCome')}
              onRemove={() => handleRemoveBet('dontCome')}
              disabled={gameState?.phase === 'comeOut'}
              className="min-h-[80px] sm:min-h-[120px] bg-black bg-opacity-20 text-white"
            />
            <div className="h-8 sm:h-[52px]"></div>
          </div>
        </div>

        {/* Middle: Come Area + Field */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          {/* COME Box */}
          <BetArea
            label={<div className="text-2xl sm:text-4xl text-red-500 font-black">COME</div>}
            betType="come"
            amount={gameState?.bets?.come || 0}
            onClick={() => handlePlaceBet('come')}
            onRemove={() => handleRemoveBet('come')}
            disabled={gameState?.phase === 'comeOut'}
            className="h-24 sm:h-32 bg-casino-green-dark"
          />

          {/* FIELD Box */}
          <BetArea
            label={
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <div className="text-[0.65rem] sm:text-sm text-gray-300">PAYS DOUBLE</div>
                <div className="text-xs sm:text-xl">
                  <span>2•3•4•9•10•11•12</span>
                </div>
                <div className="text-xl sm:text-3xl font-black">FIELD</div>
                <div className="text-[0.65rem] sm:text-sm text-gray-300 hidden sm:block">PAYS DOUBLE</div>
              </div>
            }
            betType="field"
            amount={gameState?.bets?.field || 0}
            onClick={() => handlePlaceBet('field')}
            onRemove={() => handleRemoveBet('field')}
            disabled={false}
            className="h-24 sm:h-32 bg-casino-green text-white"
          />
        </div>

        {/* Don't Pass Bar */}
        <BetArea
          label={
            <div className="flex items-center justify-between px-2 sm:px-8">
              <span className="text-lg sm:text-3xl font-black">DON'T PASS BAR</span>
              <span className="text-2xl sm:text-4xl">⚅⚅</span>
            </div>
          }
          betType="dontPass"
          amount={gameState?.bets?.dontPass || 0}
          onClick={() => handlePlaceBet('dontPass')}
          onRemove={() => handleRemoveBet('dontPass')}
          disabled={gameState?.phase !== 'comeOut'}
          className="h-14 sm:h-20 mb-2 sm:mb-3 bg-black bg-opacity-30 text-white"
          tooltip={gameState?.phase !== 'comeOut' ? 'Only available on Come Out Roll' : 'Don\'t Pass Bar - wins on 2, 3; push on 12; loses on 7, 11'}
        />

        {/* Pass Line */}
        <BetArea
          label={<span className="text-2xl sm:text-4xl font-black text-blue-300">PASS LINE</span>}
          betType="passLine"
          amount={gameState?.bets?.passLine || 0}
          onClick={() => handlePlaceBet('passLine')}
          onRemove={() => handleRemoveBet('passLine')}
          disabled={gameState?.phase !== 'comeOut'}
          className="h-16 sm:h-24 bg-casino-green-dark border-2 sm:border-4"
          tooltip={gameState?.phase !== 'comeOut' ? 'Only available on Come Out Roll' : 'Pass Line - wins on 7, 11; loses on 2, 3, 12'}
        />

        {/* Proposition Bets Section */}
        <div className="mt-3 sm:mt-4 bg-black bg-opacity-30 p-2 sm:p-4 rounded-lg border-2 border-casino-gold">
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {/* Hardways */}
            <div className="bg-black bg-opacity-50 p-2 sm:p-3 rounded-lg">
              <div className="text-casino-gold text-[0.65rem] sm:text-xs font-bold mb-1 sm:mb-2 text-center">HARDWAYS</div>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <BetArea
                  label={<div className="text-[0.6rem] sm:text-xs leading-tight">HARD<br/>4<br/>7:1</div>}
                  betType="hardway"
                  amount={gameState?.bets?.hardways?.[4] || 0}
                  onClick={() => handlePlaceBet('hardway', 4)}
                  onRemove={() => handleRemoveBet('hardway', 4)}
                  className="h-12 sm:h-16 bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-[0.6rem] sm:text-xs leading-tight">HARD<br/>6<br/>9:1</div>}
                  betType="hardway"
                  amount={gameState?.bets?.hardways?.[6] || 0}
                  onClick={() => handlePlaceBet('hardway', 6)}
                  onRemove={() => handleRemoveBet('hardway', 6)}
                  className="h-12 sm:h-16 bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-[0.6rem] sm:text-xs leading-tight">HARD<br/>8<br/>9:1</div>}
                  betType="hardway"
                  amount={gameState?.bets?.hardways?.[8] || 0}
                  onClick={() => handlePlaceBet('hardway', 8)}
                  onRemove={() => handleRemoveBet('hardway', 8)}
                  className="h-12 sm:h-16 bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-[0.6rem] sm:text-xs leading-tight">HARD<br/>10<br/>7:1</div>}
                  betType="hardway"
                  amount={gameState?.bets?.hardways?.[10] || 0}
                  onClick={() => handlePlaceBet('hardway', 10)}
                  onRemove={() => handleRemoveBet('hardway', 10)}
                  className="h-12 sm:h-16 bg-casino-green-dark"
                />
              </div>
            </div>

            {/* One Roll Bets */}
            <div className="bg-black bg-opacity-50 p-2 sm:p-3 rounded-lg">
              <div className="text-casino-gold text-[0.65rem] sm:text-xs font-bold mb-1 sm:mb-2 text-center">ONE ROLL BETS</div>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <BetArea
                  label={<div className="text-[0.6rem] sm:text-xs text-red-500 leading-tight">ANY<br/>SEVEN<br/>4:1</div>}
                  betType="anySeven"
                  amount={gameState?.bets?.anySeven || 0}
                  onClick={() => handlePlaceBet('anySeven')}
                  onRemove={() => handleRemoveBet('anySeven')}
                  className="h-12 sm:h-16 bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-[0.6rem] sm:text-xs leading-tight">ANY<br/>CRAPS<br/>7:1</div>}
                  betType="anyCraps"
                  amount={gameState?.bets?.anyCraps || 0}
                  onClick={() => handlePlaceBet('anyCraps')}
                  onRemove={() => handleRemoveBet('anyCraps')}
                  className="h-12 sm:h-16 bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-[0.6rem] sm:text-xs leading-tight">HORN<br/>2<br/>30:1</div>}
                  betType="horn"
                  amount={gameState?.bets?.horn?.[2] || 0}
                  onClick={() => handlePlaceBet('horn', 2)}
                  onRemove={() => handleRemoveBet('horn', 2)}
                  className="h-12 sm:h-16 bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-[0.6rem] sm:text-xs leading-tight">HORN<br/>12<br/>30:1</div>}
                  betType="horn"
                  amount={gameState?.bets?.horn?.[12] || 0}
                  onClick={() => handlePlaceBet('horn', 12)}
                  onRemove={() => handleRemoveBet('horn', 12)}
                  className="h-12 sm:h-16 bg-casino-green-dark"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-casino-gold text-sm text-center max-w-2xl">
        <p>Left click to place bet • Right click to remove bet</p>
        <p className="text-xs mt-2 text-gray-400">
          Pass/Don't Pass only on Come Out • Come bets travel to numbers
        </p>
      </div>
    </div>
  );
};
