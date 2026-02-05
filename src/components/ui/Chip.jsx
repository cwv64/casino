import { motion } from 'framer-motion';

export const Chip = ({ value, onClick, selected = false, className = '' }) => {
  const getChipColor = (val) => {
    if (val >= 1000) return 'bg-purple-600 border-purple-400';
    if (val >= 500) return 'bg-orange-600 border-orange-400';
    if (val >= 100) return 'bg-black border-white';
    if (val >= 25) return 'bg-green-600 border-green-400';
    if (val >= 10) return 'bg-blue-600 border-blue-400';
    if (val >= 5) return 'bg-red-600 border-red-400';
    return 'bg-white border-gray-400 text-black';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`
        relative w-16 h-16 rounded-full
        border-4 ${getChipColor(value)}
        flex items-center justify-center
        font-bold text-white shadow-lg
        cursor-pointer
        ${selected ? 'ring-4 ring-casino-gold' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-0 rounded-full border-4 border-white opacity-20" />
      <div className="absolute inset-2 rounded-full border-2 border-white opacity-30" />
      <span className="relative z-10 text-sm">${value}</span>
    </motion.button>
  );
};

export const ChipSelector = ({ onSelectChip, selectedChip }) => {
  const chipValues = [5, 10, 25, 100, 500, 1000];

  return (
    <div className="flex gap-4 justify-center items-center p-4 bg-charcoal-dark rounded-lg">
      {chipValues.map(value => (
        <Chip
          key={value}
          value={value}
          selected={selectedChip === value}
          onClick={() => onSelectChip(value)}
        />
      ))}
    </div>
  );
};
