import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCraps } from '../../hooks/useCraps';
import { DicePair } from '../ui/Dice';
import { Button } from '../ui/Button';
import { ChipSelector } from '../ui/Chip';

export const CrapsTable = () => {
  const [selectedChip, setSelectedChip] = useState(10);
  const [isRolling, setIsRolling] = useState(false);
  const { gameState, rollResult, placeBet, removeBet, roll, resetBets, getTotalBets, balance } = useCraps();

  const handlePlaceBet = (betType, number = null) => {
    placeBet(betType, selectedChip, number);
  };

  const handleRemoveBet = (betType, number = null) => {
    removeBet(betType, number);
  };

  const handleRoll = async () => {
    setIsRolling(true);
    await roll();
    setTimeout(() => setIsRolling(false), 1000);
  };

  const BetSpot = ({ label, betType, amount, canBet, number = null, className = '' }) => {
    const hasBet = amount > 0;

    return (
      <motion.button
        whileHover={canBet ? { scale: 1.05 } : {}}
        onClick={() => canBet && handlePlaceBet(betType, number)}
        onContextMenu={(e) => {
          e.preventDefault();
          if (hasBet) handleRemoveBet(betType, number);
        }}
        disabled={!canBet}
        className={`
          relative p-4 border-2 rounded-lg
          ${canBet ? 'border-casino-gold cursor-pointer hover:bg-casino-green-light' : 'border-gray-600 opacity-50'}
          ${hasBet ? 'bg-casino-gold bg-opacity-20' : 'bg-black bg-opacity-30'}
          transition-all duration-200
          ${className}
        `}
      >
        <div className="text-white font-semibold text-sm">{label}</div>
        {hasBet && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-casino-gold text-charcoal px-2 py-1 rounded-full text-xs font-bold"
          >
            ${amount}
          </motion.div>
        )}
      </motion.button>
    );
  };

  const totalBets = getTotalBets();

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-gradient-to-b from-casino-green-dark to-casino-green min-h-[700px] rounded-2xl">
      {/* Phase and Point Display */}
      <div className="flex gap-8 items-center">
        <div className="bg-charcoal-dark px-6 py-3 rounded-lg border-2 border-casino-gold">
          <div className="text-casino-gold text-sm">Phase</div>
          <div className="text-white text-xl font-bold">
            {gameState?.phase === 'comeOut' ? 'Come Out Roll' : 'Point Phase'}
          </div>
        </div>

        {gameState?.point && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-casino-gold px-8 py-4 rounded-lg"
          >
            <div className="text-charcoal text-sm">Point</div>
            <div className="text-charcoal text-3xl font-bold">{gameState.point}</div>
          </motion.div>
        )}

        <div className="bg-charcoal-dark px-6 py-3 rounded-lg border-2 border-casino-gold">
          <div className="text-casino-gold text-sm">Total Bets</div>
          <div className="text-white text-xl font-bold">${totalBets}</div>
        </div>
      </div>

      {/* Dice Display */}
      <div className="bg-charcoal-dark p-8 rounded-xl border-4 border-casino-gold min-h-[150px] flex items-center justify-center">
        {rollResult ? (
          <DicePair
            die1={rollResult.roll.die1}
            die2={rollResult.roll.die2}
            isRolling={isRolling}
          />
        ) : (
          <div className="text-casino-gold text-xl">Ready to roll!</div>
        )}
      </div>

      {/* Recent Outcomes */}
      <AnimatePresence>
        {rollResult?.outcomes && rollResult.outcomes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2 justify-center max-w-2xl"
          >
            {rollResult.outcomes.map((outcome, idx) => (
              <div
                key={idx}
                className={`
                  px-4 py-2 rounded-lg border-2
                  ${outcome.result === 'win' ? 'bg-green-600 border-green-400' : ''}
                  ${outcome.result === 'lose' ? 'bg-red-600 border-red-400' : ''}
                  ${outcome.result === 'push' ? 'bg-yellow-600 border-yellow-400' : ''}
                  ${outcome.result === 'point' ? 'bg-blue-600 border-blue-400' : ''}
                  text-white font-semibold
                `}
              >
                {outcome.bet}: {outcome.result}
                {outcome.payout > 0 && ` +$${outcome.payout}`}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Betting Layout */}
      <div className="w-full max-w-4xl bg-casino-green border-4 border-casino-gold rounded-xl p-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Pass Line */}
          <div className="col-span-3">
            <BetSpot
              label="PASS LINE"
              betType="passLine"
              amount={gameState?.bets?.passLine || 0}
              canBet={gameState?.phase === 'comeOut'}
              className="w-full"
            />
          </div>

          {/* Don't Pass */}
          <div className="col-span-3">
            <BetSpot
              label="DON'T PASS"
              betType="dontPass"
              amount={gameState?.bets?.dontPass || 0}
              canBet={gameState?.phase === 'comeOut'}
              className="w-full"
            />
          </div>

          {/* Odds */}
          {gameState?.phase === 'point' && (
            <div className="col-span-3">
              <BetSpot
                label={`ODDS (Point: ${gameState.point})`}
                betType="odds"
                amount={gameState?.bets?.odds || 0}
                canBet={true}
                className="w-full"
              />
            </div>
          )}

          {/* Field */}
          <div className="col-span-3">
            <BetSpot
              label="FIELD (2, 3, 4, 9, 10, 11, 12) - 2x on 2 & 12"
              betType="field"
              amount={gameState?.bets?.field || 0}
              canBet={true}
              className="w-full"
            />
          </div>
        </div>

        {/* Place Bets */}
        <div className="border-t-2 border-casino-gold pt-4">
          <div className="text-casino-gold text-sm mb-2 text-center">PLACE BETS</div>
          <div className="grid grid-cols-6 gap-2">
            {[4, 5, 6, 8, 9, 10].map(num => (
              <BetSpot
                key={num}
                label={`${num}`}
                betType="place"
                number={num}
                amount={gameState?.bets?.place?.[num] || 0}
                canBet={true}
              />
            ))}
          </div>
          <div className="text-xs text-casino-gold text-center mt-2">
            4/10: 9:5 | 5/9: 7:5 | 6/8: 7:6
          </div>
        </div>
      </div>

      {/* Chip Selector */}
      <ChipSelector onSelectChip={setSelectedChip} selectedChip={selectedChip} />

      {/* Controls */}
      <div className="flex gap-4">
        <Button
          onClick={handleRoll}
          disabled={totalBets === 0 || isRolling}
          variant="primary"
          className="text-xl px-12 py-4"
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </Button>

        <Button
          onClick={resetBets}
          disabled={totalBets === 0}
          variant="danger"
        >
          Clear All Bets
        </Button>
      </div>

      <div className="text-casino-gold text-sm text-center">
        Left click to place bet • Right click to remove bet
      </div>
    </div>
  );
};
