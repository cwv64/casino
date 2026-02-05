import { motion } from 'framer-motion';

export const DealerPuck = ({ isOn, position }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        w-16 h-16 rounded-full border-4
        flex items-center justify-center
        font-bold text-lg shadow-xl
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
