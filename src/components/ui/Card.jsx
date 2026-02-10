import { memo } from 'react';
import { motion } from 'framer-motion';

// 3.4: True 3D card flip using CSS backface-visibility
// 3.8: Depth shadows that increase with overlap
export const Card = memo(({ rank, suit, faceDown = false, index = 0, dealDelay = 0 }) => {
  const getSuitSymbol = (s) => {
    const symbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    return symbols[s] || '';
  };

  const getSuitColor = (s) => {
    return s === 'hearts' || s === 'diamonds' ? 'text-red-600' : 'text-black';
  };

  // 3.8: Increasing shadow depth for overlapping cards
  const shadowDepth = Math.min(index, 4);
  const shadow = `0 ${2 + shadowDepth * 2}px ${6 + shadowDepth * 4}px rgba(0,0,0,${0.15 + shadowDepth * 0.08})`;

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        delay: dealDelay + (index * 0.3),
        duration: 0.5,
        type: 'spring',
        stiffness: 120,
        damping: 14
      }}
      className="card-3d relative w-14 h-20 sm:w-20 sm:h-28 select-none flex-shrink-0"
    >
      {/* 3.4: Inner container that flips via rotateY */}
      <motion.div
        animate={{ rotateY: faceDown ? 180 : 0 }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front face */}
        <div
          className="card-face absolute inset-0 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center overflow-hidden"
          style={{ boxShadow: shadow }}
        >
          {/* 3.8: Subtle inner highlight for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-gray-100 opacity-60 pointer-events-none" />
          <div className={`relative text-xl sm:text-3xl font-bold ${getSuitColor(suit)}`}>
            {rank}
          </div>
          <div className={`relative text-2xl sm:text-4xl ${getSuitColor(suit)}`}>
            {getSuitSymbol(suit)}
          </div>
        </div>

        {/* Back face */}
        <div
          className="card-back absolute inset-0 bg-gradient-to-br from-casino-red to-red-900 rounded-lg border-2 border-casino-gold flex items-center justify-center overflow-hidden"
          style={{ boxShadow: shadow }}
        >
          {/* Decorative pattern on card back */}
          <div className="absolute inset-1 sm:inset-1.5 border border-casino-gold/40 rounded-md" />
          <div className="w-8 h-14 sm:w-14 sm:h-22 border-2 sm:border-3 border-casino-gold/50 rounded-md flex items-center justify-center">
            <div className="text-casino-gold/40 text-lg sm:text-2xl font-bold">♠</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

export const Hand = ({ cards, faceDownFirst = false, label = '', dealDelay = 0 }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-casino-gold font-semibold text-sm sm:text-base">{label}</span>
      )}
      <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
        {cards.map((card, index) => (
          <Card
            key={`${card.rank}-${card.suit}-${index}`}
            rank={card.rank}
            suit={card.suit}
            faceDown={(index === 0 && faceDownFirst) || card.faceDown}
            index={index}
            dealDelay={dealDelay}
          />
        ))}
      </div>
    </div>
  );
};
