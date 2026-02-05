import { motion } from 'framer-motion';

export const Die = ({ value, isRolling = false }) => {
  const getDotPositions = (val) => {
    const positions = {
      1: [[2, 2]],
      2: [[1, 1], [3, 3]],
      3: [[1, 1], [2, 2], [3, 3]],
      4: [[1, 1], [1, 3], [3, 1], [3, 3]],
      5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
      6: [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2], [3, 3]]
    };
    return positions[val] || [];
  };

  return (
    <motion.div
      animate={
        isRolling
          ? {
              rotateX: [0, 360, 720],
              rotateY: [0, 360, 720],
              rotateZ: [0, 180, 360]
            }
          : {}
      }
      transition={
        isRolling
          ? {
              duration: 1,
              ease: 'easeOut'
            }
          : {}
      }
      className="relative w-16 h-16 bg-white rounded-lg border-2 border-gray-800 shadow-xl"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 p-2 gap-1">
        {Array.from({ length: 16 }).map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const dots = getDotPositions(value);
          const shouldShow = dots.some(([r, c]) => r === row && c === col);

          return (
            <div
              key={i}
              className={`
                rounded-full
                ${shouldShow ? 'bg-black' : 'bg-transparent'}
              `}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

export const DicePair = ({ die1, die2, isRolling = false }) => {
  return (
    <div className="flex gap-4 items-center justify-center">
      <Die value={die1} isRolling={isRolling} />
      <Die value={die2} isRolling={isRolling} />
      {!isRolling && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ml-4 text-4xl font-bold text-casino-gold"
        >
          = {die1 + die2}
        </motion.div>
      )}
    </div>
  );
};
