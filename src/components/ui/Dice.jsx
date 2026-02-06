import { motion } from 'framer-motion';

// 3.5: Enhanced dice with bounce-settle animation and better visuals
export const Die = ({ value, isRolling = false, settleDelay = 0 }) => {
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
              rotateX: [0, 360, 720, 1080],
              rotateY: [0, 180, 540, 720],
              rotateZ: [0, 90, 270, 360],
              scale: [1, 0.85, 1.1, 0.95, 1],
              y: [0, -15, 5, -5, 0],
            }
          : {}
      }
      transition={
        isRolling
          ? {
              duration: 1.1,
              ease: [0.25, 0.1, 0.25, 1],
              times: [0, 0.3, 0.6, 1],
              scale: { duration: 1.1, times: [0, 0.25, 0.5, 0.75, 1] },
              y: { duration: 1.1, times: [0, 0.25, 0.5, 0.75, 1] },
            }
          : {}
      }
      className="relative w-14 h-14 sm:w-16 sm:h-16"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Die body with glossy effect */}
      <div
        className={`
          absolute inset-0 rounded-xl border-2
          ${isRolling ? 'border-gray-600 bg-gray-200' : 'border-gray-700 bg-white'}
          overflow-hidden
        `}
        style={{
          boxShadow: isRolling
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)'
        }}
      >
        {/* Glossy highlight */}
        {!isRolling && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-black/10 pointer-events-none" />
        )}

        {/* Dot grid */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 p-1.5 sm:p-2 gap-0.5">
          {Array.from({ length: 16 }).map((_, i) => {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const dots = getDotPositions(value);
            const shouldShow = dots.some(([r, c]) => r === row && c === col);

            return (
              <div
                key={i}
                className={`
                  rounded-full transition-all duration-200
                  ${shouldShow ? 'bg-gray-900 shadow-sm' : 'bg-transparent'}
                `}
                style={shouldShow ? {
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                } : {}}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export const DicePair = ({ die1, die2, isRolling = false }) => {
  return (
    <div className="flex gap-3 sm:gap-4 items-center justify-center">
      <div className={!isRolling ? 'dice-settle' : ''} style={{ animationDelay: '0s' }}>
        <Die value={die1} isRolling={isRolling} />
      </div>
      <div className={!isRolling ? 'dice-settle' : ''} style={{ animationDelay: '0.1s' }}>
        <Die value={die2} isRolling={isRolling} />
      </div>
      {!isRolling && (
        <motion.div
          initial={{ opacity: 0, scale: 0, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 12 }}
          className="ml-2 sm:ml-4 text-3xl sm:text-4xl font-bold text-casino-gold drop-shadow-lg"
        >
          = {die1 + die2}
        </motion.div>
      )}
    </div>
  );
};
