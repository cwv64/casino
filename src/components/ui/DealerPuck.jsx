import { motion } from 'framer-motion';

export const DealerPuck = ({ isOn, position }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        w-8 h-8 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4
        flex items-center justify-center
        font-bold text-[0.5rem] sm:text-lg shadow-xl
        ${isOn
          ? 'bg-white border-black text-black'
          : 'bg-black border-white text-white'
        }
      `}
    >
      {isOn ? 'ON' : 'OFF'}
    </motion.div>
  );
};
