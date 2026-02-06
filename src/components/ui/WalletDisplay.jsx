import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { useWalletStore } from '../../stores/walletStore';

export const WalletDisplay = () => {
  const { balance } = useWalletStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 sm:gap-3 bg-charcoal-dark px-3 sm:px-6 py-2 sm:py-3 rounded-lg border-2 border-casino-gold"
    >
      <Coins className="text-casino-gold hidden sm:block" size={24} />
      <Coins className="text-casino-gold sm:hidden" size={18} />
      <div className="flex flex-col">
        <span className="text-[0.6rem] sm:text-xs text-gray-400">Balance</span>
        <motion.span
          key={balance}
          initial={{ scale: 1.2, color: '#fbbf24' }}
          animate={{ scale: 1, color: '#ffffff' }}
          className="text-sm sm:text-xl font-bold"
        >
          ${balance.toLocaleString()}
        </motion.span>
      </div>
    </motion.div>
  );
};
