import { motion } from 'framer-motion';
import { Spade, Dices } from 'lucide-react';

export const GameSelector = ({ currentGame, onSelectGame }) => {
  const games = [
    { id: 'blackjack', name: 'Blackjack', icon: Spade, color: 'from-red-600 to-red-800' },
    { id: 'craps', name: 'Craps', icon: Dices, color: 'from-green-600 to-green-800' }
  ];

  return (
    <div className="flex gap-4 justify-center p-6">
      {games.map(({ id, name, icon: Icon, color }) => (
        <motion.button
          key={id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectGame(id)}
          className={`
            relative px-8 py-4 rounded-xl
            bg-gradient-to-br ${color}
            border-2 ${currentGame === id ? 'border-casino-gold' : 'border-transparent'}
            text-white font-semibold
            transition-all duration-200
            flex items-center gap-3
            ${currentGame === id ? 'ring-4 ring-casino-gold ring-opacity-50' : ''}
          `}
        >
          <Icon size={24} />
          <span className="text-xl">{name}</span>
          {currentGame === id && (
            <motion.div
              layoutId="activeGame"
              className="absolute inset-0 rounded-xl border-2 border-casino-gold"
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};
