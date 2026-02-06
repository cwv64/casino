import { WalletDisplay } from '../ui/WalletDisplay';
import { Settings, Info, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header = ({ onOpenSettings, onOpenInfo, onOpenRules }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-charcoal border-b-2 border-casino-gold px-4 sm:px-8 py-3 sm:py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-4">
          <img src="/logo.svg" alt="Lucky Roll Casino" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full" />
          <h1 className="text-lg sm:text-3xl font-bold bg-gradient-to-r from-casino-gold to-yellow-500 bg-clip-text text-transparent">
            Lucky Roll Casino
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <WalletDisplay />

          <button
            onClick={onOpenRules}
            className="p-2 hover:bg-charcoal-light rounded-lg transition-colors"
            title="How to Play"
          >
            <HelpCircle className="text-casino-gold" size={20} />
          </button>

          <button
            onClick={onOpenInfo}
            className="p-2 hover:bg-charcoal-light rounded-lg transition-colors"
            title="Provably Fair Info"
          >
            <Info className="text-casino-gold" size={20} />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-charcoal-light rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="text-casino-gold" size={20} />
          </button>
        </div>
      </div>
    </motion.header>
  );
};
