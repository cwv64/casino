import { WalletDisplay } from '../ui/WalletDisplay';
import { Settings, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header = ({ onOpenSettings, onOpenInfo }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-charcoal border-b-2 border-casino-gold px-8 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-casino-gold to-yellow-500 bg-clip-text text-transparent">
            Premium Vegas Casino
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <WalletDisplay />

          <button
            onClick={onOpenInfo}
            className="p-2 hover:bg-charcoal-light rounded-lg transition-colors"
            title="Provably Fair Info"
          >
            <Info className="text-casino-gold" size={24} />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-charcoal-light rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="text-casino-gold" size={24} />
          </button>
        </div>
      </div>
    </motion.header>
  );
};
