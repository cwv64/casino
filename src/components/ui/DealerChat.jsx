import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// 3.3: Dealer persona with contextual chat bubbles
const DEALER_MESSAGES = {
  blackjack: {
    deal: ['Good luck!', 'Cards are coming...', 'Let\'s see what we get.', 'Place your bets!'],
    playerBlackjack: ['Blackjack! Nicely done!', 'Twenty-one! Beautiful!', 'Natural blackjack! 💰'],
    dealerBlackjack: ['I\'ve got blackjack...', 'House wins this one.'],
    bust: ['Ooh, busted.', 'Over 21... tough break.', 'Bust! Better luck next time.'],
    win: ['Nice hand!', 'Winner winner!', 'Well played!', 'You got me this time!'],
    bigWin: ['Big winner! 🎉', 'Incredible hand!', 'Now that\'s a payout!'],
    lose: ['House wins.', 'Better luck next hand.', 'The house always has an edge...'],
    push: ['Push — bet returned.', 'We tied. Fair enough.', 'Push! Nobody wins.'],
    split: ['Splitting? Bold move!', 'Two hands, double the fun!'],
    doubleDown: ['Doubling down! Risky!', 'Going all in on this hand!', 'Double or nothing!'],
    stand: ['Standing pat.', 'Let\'s see what I\'ve got.'],
  },
  craps: {
    comeOut: ['New shooter! Come-out roll!', 'Let\'s see a seven!', 'Come-out roll — here we go!'],
    pointSet: ['Point is set!', 'Now roll that number again!', 'Point established — good luck!'],
    seven: ['Seven! Natural!', 'Lucky seven!'],
    sevenOut: ['Seven out!', 'That\'s a seven out...', 'Table changes — seven out!'],
    pointMade: ['Point made! 🎉', 'You hit it! Point made!', 'That\'s the number! Winner!'],
    hardway: ['Hardway! The hard way pays!', 'Hard roll! Nice one!'],
    craps: ['Craps!', 'Snake eyes!', 'Boxcars!'],
    fieldWin: ['Field wins!', 'Lucky field bet!'],
    bigWin: ['Big payout! 🎰', 'That\'s a serious win!', 'Look at that payout!'],
    roll: ['Roll \'em!', 'Let it ride!', 'Here come the dice!'],
  }
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const DealerChat = ({ game, event, visible = true }) => {
  const [message, setMessage] = useState(null);
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);
  const lastEventRef = useRef(null);

  useEffect(() => {
    if (!event || !visible) return;

    if (lastEventRef.current === event) return;
    lastEventRef.current = event;

    const messages = DEALER_MESSAGES[game]?.[event];
    if (!messages) return;

    // Clear previous timers
    if (timerRef.current) clearTimeout(timerRef.current);

    // Small delay for natural feel
    const delayTimer = setTimeout(() => {
      setMessage(pickRandom(messages));
      setShow(true);

      // Auto-hide after 3 seconds
      timerRef.current = setTimeout(() => {
        setShow(false);
        timerRef.current = setTimeout(() => {
          lastEventRef.current = null;
        }, 300);
      }, 3000);
    }, 200);

    return () => {
      clearTimeout(delayTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [event, game, visible]);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Dealer avatar */}
      <div className="relative">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-charcoal to-charcoal-dark border-2 border-casino-gold flex items-center justify-center text-sm sm:text-lg shadow-lg">
          🎰
        </div>

        {/* Chat bubble */}
        <AnimatePresence>
          {show && message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap z-30"
            >
              <div className="chat-bubble relative bg-charcoal text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-casino-gold/40 shadow-lg">
                {message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
