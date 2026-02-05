import { useState } from 'react';
import { Header } from './components/layout/Header';
import { GameSelector } from './components/layout/GameSelector';
import { BlackjackTable } from './components/blackjack/BlackjackTable';
import { CrapsTable } from './components/craps/CrapsTable';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, RefreshCw } from 'lucide-react';
import { Button } from './components/ui/Button';
import { useWalletStore } from './stores/walletStore';

function App() {
  const [currentGame, setCurrentGame] = useState('blackjack');
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const { balance, reset } = useWalletStore();

  const Modal = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-75 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-charcoal border-2 border-casino-gold rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto z-50"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-casino-gold">{title}</h2>
              <button
                onClick={onClose}
                className="text-casino-gold hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-charcoal-dark text-white">
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onOpenInfo={() => setShowInfo(true)}
      />

      <main className="max-w-7xl mx-auto py-8">
        <GameSelector currentGame={currentGame} onSelectGame={setCurrentGame} />

        <motion.div
          key={currentGame}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          {currentGame === 'blackjack' && <BlackjackTable />}
          {currentGame === 'craps' && <CrapsTable />}
        </motion.div>
      </main>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Settings"
      >
        <div className="space-y-6">
          <div className="bg-charcoal-dark p-6 rounded-lg border border-casino-gold">
            <h3 className="text-xl font-semibold text-casino-gold mb-4">Wallet</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white">Current Balance:</span>
              <span className="text-2xl font-bold text-casino-gold">${balance}</span>
            </div>
            <Button
              onClick={() => {
                if (confirm('Reset your balance to $1,000?')) {
                  reset();
                }
              }}
              variant="danger"
              className="w-full"
            >
              <RefreshCw size={20} className="inline mr-2" />
              Reset Balance to $1,000
            </Button>
          </div>

          <div className="bg-charcoal-dark p-6 rounded-lg border border-casino-gold">
            <h3 className="text-xl font-semibold text-casino-gold mb-4">About</h3>
            <p className="text-gray-300 mb-2">
              Premium Vegas Casino - A fully-featured casino web application
            </p>
            <p className="text-gray-400 text-sm">
              Built with React, Vite, Tailwind CSS, and Framer Motion
            </p>
          </div>
        </div>
      </Modal>

      {/* Provably Fair Info Modal */}
      <Modal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Provably Fair Gaming"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="text-casino-gold mt-1" size={24} />
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                What is Provably Fair?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Provably Fair is a technology that ensures game outcomes are truly random
                and haven't been manipulated. Each game result is generated using
                cryptographic hashing (SHA-256) with three components:
              </p>
            </div>
          </div>

          <div className="bg-charcoal-dark p-4 rounded-lg space-y-3">
            <div>
              <h4 className="text-casino-gold font-semibold mb-1">Server Seed (Hidden)</h4>
              <p className="text-gray-300 text-sm">
                A random value generated by the server before each game. This remains
                hidden until after the game to prevent manipulation.
              </p>
            </div>

            <div>
              <h4 className="text-casino-gold font-semibold mb-1">Client Seed</h4>
              <p className="text-gray-300 text-sm">
                A random value generated in your browser. You have control over this value.
              </p>
            </div>

            <div>
              <h4 className="text-casino-gold font-semibold mb-1">Nonce</h4>
              <p className="text-gray-300 text-sm">
                A counter that increments with each game action, ensuring every result
                is unique even with the same seeds.
              </p>
            </div>
          </div>

          <div className="bg-casino-green-dark p-4 rounded-lg border-l-4 border-casino-gold">
            <h4 className="text-white font-semibold mb-2">How It Works</h4>
            <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
              <li>Server generates a random seed and shares its hash (not the seed itself)</li>
              <li>You provide or generate your client seed</li>
              <li>Game outcomes are calculated using: SHA-256(ServerSeed:ClientSeed:Nonce)</li>
              <li>After the game, the server seed is revealed so you can verify the results</li>
            </ol>
          </div>

          <div className="text-center pt-4">
            <p className="text-casino-gold text-sm">
              All games in this casino use the Web Crypto API for secure,
              verifiable randomness.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
