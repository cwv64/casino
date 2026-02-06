import { motion } from 'framer-motion';

export const Card = ({ rank, suit, faceDown = false, index = 0, dealDelay = 0 }) => {
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

  return (
    <motion.div
      initial={{ x: -100, opacity: 0, rotateY: 0 }}
      animate={{ x: 0, opacity: 1, rotateY: faceDown ? 180 : 0 }}
      transition={{
        delay: dealDelay + (index * 0.3),
        duration: 0.8,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      className="relative w-14 h-20 sm:w-20 sm:h-28 select-none flex-shrink-0"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Front of card */}
      <div
        className={`
          absolute inset-0 bg-white rounded-lg border-2 border-gray-300
          shadow-lg flex flex-col items-center justify-center
          transition-opacity duration-500
          ${faceDown ? 'opacity-0' : 'opacity-100'}
        `}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className={`text-xl sm:text-3xl font-bold ${getSuitColor(suit)}`}>
          {rank}
        </div>
        <div className={`text-2xl sm:text-4xl ${getSuitColor(suit)}`}>
          {getSuitSymbol(suit)}
        </div>
      </div>

      {/* Back of card */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-br from-casino-red to-red-900
          rounded-lg border-2 border-casino-gold
          shadow-lg flex items-center justify-center
          transition-opacity duration-500
          ${faceDown ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)'
        }}
      >
        <div className="w-10 h-16 sm:w-16 sm:h-24 border-2 sm:border-4 border-casino-gold rounded-md opacity-50" />
      </div>
    </motion.div>
  );
};

export const Hand = ({ cards, faceDownFirst = false, label = '', dealDelay = 0, revealDelay = 0 }) => {
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
