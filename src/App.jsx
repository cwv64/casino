import { useState } from 'react';
import { Header } from './components/layout/Header';
import { GameSelector } from './components/layout/GameSelector';
import { BlackjackTable } from './components/blackjack/BlackjackTable';
import { CrapsTable } from './components/craps/CrapsTable';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, RefreshCw, Volume2, VolumeX, History, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './components/ui/Button';
import { useWalletStore } from './stores/walletStore';
import { useGameStore } from './stores/gameStore';
import { setSoundEnabled, isSoundEnabled } from './utils/sounds';

// Fix 4.2: Modal extracted to top-level component (not re-created every render)
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
          className="fixed inset-x-3 top-[10%] bottom-[10%] sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85vh] bg-charcoal border-2 border-casino-gold rounded-xl p-4 sm:p-8 sm:max-w-2xl sm:w-full overflow-y-auto z-50"
        >
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-casino-gold">{title}</h2>
            <button
              onClick={onClose}
              className="text-casino-gold hover:text-white transition-colors p-1"
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

// Fix 5.3: Game history panel component
const GameHistoryPanel = () => {
  const { gameHistory, refreshHistory } = useGameStore();
  const [expanded, setExpanded] = useState(false);

  const recentHistory = expanded ? gameHistory.slice(0, 50) : gameHistory.slice(0, 10);

  return (
    <div className="bg-charcoal-dark p-4 sm:p-6 rounded-lg border border-casino-gold">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-xl font-semibold text-casino-gold flex items-center gap-2">
          <History size={18} />
          Game History
        </h3>
        <button onClick={refreshHistory} className="text-gray-400 hover:text-casino-gold text-xs sm:text-sm">
          Refresh
        </button>
      </div>

      {recentHistory.length === 0 ? (
        <p className="text-gray-400 text-sm">No games played yet. Start playing to see your history!</p>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {recentHistory.map((entry, idx) => (
            <div key={entry.id || idx} className="flex items-center justify-between py-1.5 px-2 rounded bg-black/30 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  entry.outcome === 'win' || entry.outcome === 'blackjack' ? 'bg-green-500' :
                  entry.outcome === 'push' ? 'bg-yellow-500' :
                  entry.result === 'win' ? 'bg-green-500' :
                  'bg-red-500'
                }`} />
                <span className="text-white capitalize">
                  {entry.game === 'craps' ? `Craps ${entry.roll ? `(${entry.roll.die1}+${entry.roll.die2}=${entry.roll.total})` : ''}` :
                   entry.game || 'Blackjack'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {entry.payout > 0 && <span className="text-green-400 font-semibold">+${entry.payout}</span>}
                <span className="text-gray-500 text-[0.6rem] sm:text-xs">
                  {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {gameHistory.length > 10 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-casino-gold text-xs sm:text-sm flex items-center gap-1 hover:text-white transition-colors"
        >
          {expanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all ({gameHistory.length})</>}
        </button>
      )}
    </div>
  );
};

// Fix 5.9: Rules/tutorial component
const RulesPanel = ({ game }) => {
  const [showBlackjack, setShowBlackjack] = useState(game === 'blackjack');
  const [showCraps, setShowCraps] = useState(game === 'craps');

  return (
    <div className="space-y-3">
      {/* Blackjack Rules */}
      <div className="bg-charcoal-dark rounded-lg border border-casino-gold overflow-hidden">
        <button
          onClick={() => setShowBlackjack(!showBlackjack)}
          className="w-full flex items-center justify-between p-3 sm:p-4 text-casino-gold font-semibold text-sm sm:text-base"
        >
          <span>Blackjack Rules</span>
          {showBlackjack ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showBlackjack && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-gray-300 text-xs sm:text-sm space-y-2">
            <p><strong className="text-white">Goal:</strong> Get closer to 21 than the dealer without going over.</p>
            <p><strong className="text-white">Card Values:</strong> Number cards = face value, Face cards (J/Q/K) = 10, Ace = 1 or 11.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Hit</strong> — Take another card</li>
              <li><strong>Stand</strong> — Keep your current hand</li>
              <li><strong>Double Down</strong> — Double your bet, receive one more card</li>
              <li><strong>Split</strong> — If you have a pair, split into two hands</li>
            </ul>
            <p><strong className="text-white">Blackjack:</strong> An Ace + 10-value card on the initial deal pays 3:2.</p>
            <p><strong className="text-white">Dealer Rules:</strong> Dealer must hit on 16 or less and stand on 17 or more.</p>
          </div>
        )}
      </div>

      {/* Craps Rules */}
      <div className="bg-charcoal-dark rounded-lg border border-casino-gold overflow-hidden">
        <button
          onClick={() => setShowCraps(!showCraps)}
          className="w-full flex items-center justify-between p-3 sm:p-4 text-casino-gold font-semibold text-sm sm:text-base"
        >
          <span>Craps Rules</span>
          {showCraps ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showCraps && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-gray-300 text-xs sm:text-sm space-y-2">
            <p><strong className="text-white">Come Out Roll:</strong> The first roll of a new round.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Pass Line</strong> — Wins on 7 or 11, loses on 2/3/12. Other numbers set the Point.</li>
              <li><strong>Don't Pass</strong> — Opposite of Pass Line. Wins on 2/3, pushes on 12, loses on 7/11.</li>
            </ul>
            <p><strong className="text-white">Point Phase:</strong> Once a point is set, the shooter rolls until hitting the Point (Pass wins) or 7 (Pass loses).</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Come/Don't Come</strong> — Like Pass/Don't Pass but placed after the point is set</li>
              <li><strong>Place Bets</strong> — Bet on a specific number (4/5/6/8/9/10) to be rolled before 7</li>
              <li><strong>Field</strong> — One-roll bet, wins on 2/3/4/9/10/11/12 (2x on 2 or 12)</li>
              <li><strong>Hardways</strong> — Bet that a number is rolled as doubles before 7 or the easy way</li>
            </ul>
            <p className="text-casino-gold mt-2">Tip: Pass Line + Odds is the best bet in the casino!</p>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [currentGame, setCurrentGame] = useState('blackjack');
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const { balance, reset } = useWalletStore();

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  return (
    <div className="min-h-screen bg-charcoal-dark text-white">
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onOpenInfo={() => setShowInfo(true)}
        onOpenRules={() => setShowRules(true)}
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
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-charcoal-dark p-4 sm:p-6 rounded-lg border border-casino-gold">
            <h3 className="text-base sm:text-xl font-semibold text-casino-gold mb-3 sm:mb-4">Wallet</h3>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-white text-sm sm:text-base">Current Balance:</span>
              <span className="text-xl sm:text-2xl font-bold text-casino-gold">${balance.toLocaleString()}</span>
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
              <RefreshCw size={18} className="inline mr-2" />
              <span className="text-sm sm:text-base">Reset Balance to $1,000</span>
            </Button>
          </div>

          {/* Fix 5.4: Sound toggle */}
          <div className="bg-charcoal-dark p-4 sm:p-6 rounded-lg border border-casino-gold">
            <h3 className="text-base sm:text-xl font-semibold text-casino-gold mb-3 sm:mb-4">Sound</h3>
            <button
              onClick={toggleSound}
              className="flex items-center gap-3 text-white hover:text-casino-gold transition-colors w-full"
            >
              {soundOn ? <Volume2 size={20} className="text-green-400" /> : <VolumeX size={20} className="text-red-400" />}
              <span className="text-sm sm:text-base">{soundOn ? 'Sound Effects On' : 'Sound Effects Off'}</span>
              <div className={`ml-auto w-10 h-5 rounded-full transition-colors ${soundOn ? 'bg-green-500' : 'bg-gray-600'} relative`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${soundOn ? 'left-5' : 'left-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Fix 5.3: Game history */}
          <GameHistoryPanel />

          <div className="bg-charcoal-dark p-4 sm:p-6 rounded-lg border border-casino-gold">
            <h3 className="text-base sm:text-xl font-semibold text-casino-gold mb-3 sm:mb-4">About</h3>
            <p className="text-gray-300 mb-2 text-sm sm:text-base">
              Lucky Roll Casino - A fully-featured casino web application
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Built with React, Vite, Tailwind CSS, and Framer Motion
            </p>
          </div>
        </div>
      </Modal>

      {/* Fix 5.9: Rules Modal */}
      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="How to Play"
      >
        <RulesPanel game={currentGame} />
      </Modal>

      {/* Provably Fair Info Modal */}
      <Modal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Provably Fair Gaming"
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Shield className="text-casino-gold mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-base sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                What is Provably Fair?
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                Provably Fair is a technology that ensures game outcomes are truly random
                and haven't been manipulated. Each game result is generated using
                cryptographic hashing (SHA-256) with three components:
              </p>
            </div>
          </div>

          <div className="bg-charcoal-dark p-3 sm:p-4 rounded-lg space-y-3">
            <div>
              <h4 className="text-casino-gold font-semibold mb-1 text-sm sm:text-base">Server Seed (Hidden)</h4>
              <p className="text-gray-300 text-xs sm:text-sm">
                A random value generated by the server before each game. This remains
                hidden until after the game to prevent manipulation.
              </p>
            </div>

            <div>
              <h4 className="text-casino-gold font-semibold mb-1 text-sm sm:text-base">Client Seed</h4>
              <p className="text-gray-300 text-xs sm:text-sm">
                A random value generated in your browser. You have control over this value.
              </p>
            </div>

            <div>
              <h4 className="text-casino-gold font-semibold mb-1 text-sm sm:text-base">Nonce</h4>
              <p className="text-gray-300 text-xs sm:text-sm">
                A counter that increments with each game action, ensuring every result
                is unique even with the same seeds.
              </p>
            </div>
          </div>

          <div className="bg-casino-green-dark p-3 sm:p-4 rounded-lg border-l-4 border-casino-gold">
            <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">How It Works</h4>
            <ol className="list-decimal list-inside text-gray-300 text-xs sm:text-sm space-y-1 sm:space-y-2">
              <li>Server generates a random seed and shares its hash (not the seed itself)</li>
              <li>You provide or generate your client seed</li>
              <li>Game outcomes are calculated using: SHA-256(ServerSeed:ClientSeed:Nonce)</li>
              <li>After the game, the server seed is revealed so you can verify the results</li>
            </ol>
          </div>

          <div className="text-center pt-2 sm:pt-4">
            <p className="text-casino-gold text-xs sm:text-sm">
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
