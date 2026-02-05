import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCraps } from '../../hooks/useCraps';
import { DicePair } from '../ui/Dice';
import { Button } from '../ui/Button';
import { ChipSelector, Chip } from '../ui/Chip';
import { DealerPuck } from '../ui/DealerPuck';
import { useWalletStore } from '../../stores/walletStore';

export const CrapsTable = () => {
  const [selectedChip, setSelectedChip] = useState(10);
  const [isRolling, setIsRolling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedBets, setHighlightedBets] = useState({ winners: [], losers: [] });
  const [movingChips, setMovingChips] = useState([]);

  const { gameState, rollResult, placeBet, removeBet, roll, resetBets, getTotalBets, balance } = useCraps();
  const { deposit } = useWalletStore();

  const totalBets = getTotalBets();
  const canRoll = totalBets > 0 && !isRolling && !isProcessing;

  // Betting area component
  const BetArea = ({ label, betType, amount, onClick, onRemove, disabled, className = '', tooltip, showAmount = true }) => {
    const hasBet = amount > 0;
    const isDisabled = disabled || isProcessing || isRolling;

    return (
      <motion.button
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        onClick={() => !isDisabled && onClick && onClick()}
        onContextMenu={(e) => {
          e.preventDefault();
          if (hasBet && onRemove && !isDisabled) onRemove();
        }}
        disabled={isDisabled}
        className={`
          relative border-2 rounded-md flex items-center justify-center
          font-bold transition-all duration-200
          ${!isDisabled ? 'cursor-pointer hover:border-casino-gold' : 'opacity-50 cursor-not-allowed'}
          ${hasBet ? 'border-casino-gold bg-casino-gold bg-opacity-10' : 'border-white border-opacity-40'}
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
    const placeBet = gameState?.bets?.place?.[number];
    const showPuck = gameState?.puckPosition === number;
    const isPoint = gameState?.point === number;

    return (
      <div className="flex flex-col gap-1">
        {/* LAY area */}
        <BetArea
          label="LAY"
          betType={`lay${number}`}
          amount={0}
          disabled={true}
          className="h-8 text-xs bg-black bg-opacity-30"
        />

        {/* Main number box */}
        <div className="relative border-4 border-casino-gold bg-casino-green-dark p-4 rounded-lg min-h-[120px] flex flex-col items-center justify-center">
          {/* Dealer Puck */}
          {showPuck && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute -top-8 z-10"
            >
              <DealerPuck isOn={true} position={number} />
            </motion.div>
          )}

          {/* Number display */}
          <div className={`text-5xl font-bold ${isPoint ? 'text-casino-gold' : 'text-white'}`}>
            {displayText || number}
          </div>

          {/* Come bet on this number */}
          {comeBet?.amount > 0 && (
            <motion.div
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              className="absolute top-2 right-2"
            >
              <Chip value={comeBet.amount} className="w-10 h-10 text-xs" />
            </motion.div>
          )}

          {/* Place bet indicator */}
          {placeBet > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-2 left-2"
            >
              <Chip value={placeBet} className="w-10 h-10 text-xs" />
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
            className="h-10 text-xs bg-casino-green"
            showAmount={false}
          />
          <BetArea
            label="BUY"
            betType={`buy${number}`}
            amount={0}
            disabled={true}
            className="h-10 text-xs bg-casino-green opacity-50"
          />
        </div>
      </div>
    );
  };

  const handlePlaceBet = (betType, number = null) => {
    if (balance >= selectedChip) {
      placeBet(betType, selectedChip, number);
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
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-gradient-to-b from-casino-green-dark to-casino-green min-h-[900px] rounded-2xl">
      {/* Phase and Point Display */}
      <div className="flex gap-8 items-center">
        <div className="bg-charcoal-dark px-6 py-3 rounded-lg border-2 border-casino-gold">
          <div className="text-casino-gold text-sm">Phase</div>
          <div className="text-white text-xl font-bold capitalize">
            {gameState?.phase === 'comeOut' ? 'Come Out Roll' : 'Point'}
          </div>
        </div>

        {gameState?.point && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-casino-gold px-8 py-4 rounded-lg shadow-xl"
          >
            <div className="text-charcoal text-sm font-semibold">Point</div>
            <div className="text-charcoal text-4xl font-bold">{gameState.point}</div>
          </motion.div>
        )}

        <div className="bg-charcoal-dark px-6 py-3 rounded-lg border-2 border-casino-gold">
          <div className="text-casino-gold text-sm">Total Bets</div>
          <div className="text-white text-xl font-bold">${totalBets}</div>
        </div>
      </div>

      {/* Dice Display */}
      <div className="bg-charcoal-dark p-8 rounded-xl border-4 border-casino-gold min-h-[150px] flex items-center justify-center w-full max-w-md">
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
      <div className="w-full max-w-7xl bg-casino-green border-8 border-casino-gold rounded-3xl p-8 relative">

        {/* Top: Number Boxes (4, 5, SIX, 8, NINE, 10) + Don't Come Bar */}
        <div className="grid grid-cols-7 gap-3 mb-6">
          <NumberBox number={4} />
          <NumberBox number={5} />
          <NumberBox number={6} displayText="SIX" />
          <NumberBox number={8} />
          <NumberBox number={9} displayText="NINE" />
          <NumberBox number={10} />

          {/* Don't Come Bar */}
          <div className="flex flex-col gap-1">
            <div className="h-8"></div>
            <BetArea
              label={
                <div className="flex flex-col items-center">
                  <div className="text-xs">DON'T</div>
                  <div className="text-lg">COME</div>
                  <div className="text-xs">BAR</div>
                  <div className="text-2xl">⚅⚅</div>
                </div>
              }
              betType="dontCome"
              amount={gameState?.bets?.dontCome || 0}
              onClick={() => handlePlaceBet('dontCome')}
              onRemove={() => handleRemoveBet('dontCome')}
              disabled={gameState?.phase === 'comeOut'}
              className="min-h-[120px] bg-black bg-opacity-20 text-white"
            />
            <div className="h-[52px]"></div>
          </div>
        </div>

        {/* Middle: Come Area + Field */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* COME Box */}
          <BetArea
            label={<div className="text-4xl text-red-500 font-black">COME</div>}
            betType="come"
            amount={gameState?.bets?.come || 0}
            onClick={() => handlePlaceBet('come')}
            onRemove={() => handleRemoveBet('come')}
            disabled={gameState?.phase === 'comeOut'}
            className="h-32 text-6xl bg-casino-green-dark"
          />

          {/* FIELD Box */}
          <BetArea
            label={
              <div className="flex flex-col items-center gap-1">
                <div className="text-sm text-gray-300">PAYS DOUBLE</div>
                <div className="flex gap-2 text-xl">
                  <span>2 • 3 • 4 • 9 • 10 • 11 • 12</span>
                </div>
                <div className="text-3xl font-black">FIELD</div>
                <div className="text-sm text-gray-300">PAYS DOUBLE</div>
              </div>
            }
            betType="field"
            amount={gameState?.bets?.field || 0}
            onClick={() => handlePlaceBet('field')}
            onRemove={() => handleRemoveBet('field')}
            disabled={false}
            className="h-32 bg-casino-green text-white"
          />
        </div>

        {/* Don't Pass Bar */}
        <BetArea
          label={
            <div className="flex items-center justify-between px-8">
              <span className="text-3xl font-black">DON'T PASS BAR</span>
              <span className="text-4xl">⚅⚅</span>
            </div>
          }
          betType="dontPass"
          amount={gameState?.bets?.dontPass || 0}
          onClick={() => handlePlaceBet('dontPass')}
          onRemove={() => handleRemoveBet('dontPass')}
          disabled={gameState?.phase !== 'comeOut'}
          className="h-20 mb-3 bg-black bg-opacity-30 text-white"
          tooltip={gameState?.phase !== 'comeOut' ? 'Only available on Come Out Roll' : 'Don\'t Pass Bar - wins on 2, 3; push on 12; loses on 7, 11'}
        />

        {/* Pass Line */}
        <BetArea
          label={<span className="text-4xl font-black text-blue-300">PASS LINE</span>}
          betType="passLine"
          amount={gameState?.bets?.passLine || 0}
          onClick={() => handlePlaceBet('passLine')}
          onRemove={() => handleRemoveBet('passLine')}
          disabled={gameState?.phase !== 'comeOut'}
          className="h-24 bg-casino-green-dark border-4"
          tooltip={gameState?.phase !== 'comeOut' ? 'Only available on Come Out Roll' : 'Pass Line - wins on 7, 11; loses on 2, 3, 12'}
        />

        {/* Proposition Bets Section */}
        <div className="mt-4 bg-black bg-opacity-30 p-4 rounded-lg border-2 border-casino-gold">
          <div className="grid grid-cols-2 gap-4">
            {/* Hardways */}
            <div className="bg-black bg-opacity-50 p-3 rounded-lg">
              <div className="text-casino-gold text-xs font-bold mb-2 text-center">HARDWAYS</div>
              <div className="grid grid-cols-2 gap-2">
                <BetArea
                  label={<div className="text-xs">HARD<br/>4<br/>7:1</div>}
                  betType="hardway"
                  amount={gameState?.bets?.hardways?.[4] || 0}
                  onClick={() => handlePlaceBet('hardway', 4)}
                  onRemove={() => handleRemoveBet('hardway', 4)}
                  className="h-16 text-xs bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-xs">HARD<br/>6<br/>9:1</div>}
                  betType="hardway"
                  amount={gameState?.bets?.hardways?.[6] || 0}
                  onClick={() => handlePlaceBet('hardway', 6)}
                  onRemove={() => handleRemoveBet('hardway', 6)}
                  className="h-16 text-xs bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-xs">HARD<br/>8<br/>9:1</div>}
                  betType="hardway"
                  amount={gameState?.bets?.hardways?.[8] || 0}
                  onClick={() => handlePlaceBet('hardway', 8)}
                  onRemove={() => handleRemoveBet('hardway', 8)}
                  className="h-16 text-xs bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-xs">HARD<br/>10<br/>7:1</div>}
                  betType="hardway"
                  amount={gameState?.bets?.hardways?.[10] || 0}
                  onClick={() => handlePlaceBet('hardway', 10)}
                  onRemove={() => handleRemoveBet('hardway', 10)}
                  className="h-16 text-xs bg-casino-green-dark"
                />
              </div>
            </div>

            {/* One Roll Bets */}
            <div className="bg-black bg-opacity-50 p-3 rounded-lg">
              <div className="text-casino-gold text-xs font-bold mb-2 text-center">ONE ROLL BETS</div>
              <div className="grid grid-cols-2 gap-2">
                <BetArea
                  label={<div className="text-xs">ANY<br/>SEVEN<br/>4:1</div>}
                  betType="anySeven"
                  amount={gameState?.bets?.anySeven || 0}
                  onClick={() => handlePlaceBet('anySeven')}
                  onRemove={() => handleRemoveBet('anySeven')}
                  className="h-16 text-red-500 text-xs bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-xs">ANY<br/>CRAPS<br/>7:1</div>}
                  betType="anyCraps"
                  amount={gameState?.bets?.anyCraps || 0}
                  onClick={() => handlePlaceBet('anyCraps')}
                  onRemove={() => handleRemoveBet('anyCraps')}
                  className="h-16 text-xs bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-xs">HORN<br/>2<br/>30:1</div>}
                  betType="horn"
                  amount={gameState?.bets?.horn?.[2] || 0}
                  onClick={() => handlePlaceBet('horn', 2)}
                  onRemove={() => handleRemoveBet('horn', 2)}
                  className="h-16 text-xs bg-casino-green-dark"
                />
                <BetArea
                  label={<div className="text-xs">HORN<br/>12<br/>30:1</div>}
                  betType="horn"
                  amount={gameState?.bets?.horn?.[12] || 0}
                  onClick={() => handlePlaceBet('horn', 12)}
                  onRemove={() => handleRemoveBet('horn', 12)}
                  className="h-16 text-xs bg-casino-green-dark"
                />
              </div>
            </div>
          </div>
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
