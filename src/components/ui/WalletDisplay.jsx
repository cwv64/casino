import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { useWalletStore } from '../../stores/walletStore';

export const WalletDisplay = () => {
  const { balance } = useWalletStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-charcoal-dark px-6 py-3 rounded-lg border-2 border-casino-gold"
    >
      <Coins className="text-casino-gold" size={24} />
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">Balance</span>
        <motion.span
          key={balance}
          initial={{ scale: 1.2, color: '#fbbf24' }}
          animate={{ scale: 1, color: '#ffffff' }}
          className="text-xl font-bold"
        >
          ${balance.toLocaleString()}
        </motion.span>
      </div>
    </motion.div>
  );
};
