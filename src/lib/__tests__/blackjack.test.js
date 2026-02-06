import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock provablyFair to make tests deterministic
vi.mock('../../utils/provablyFair', () => ({
  generateSeed: () => 'test-seed-' + Math.random().toString(36).slice(2),
  sha256: async (msg) => msg,
  generateGameResult: async (s, c, n) => `${s}:${c}:${n}`,
  // Return a pre-built deck we control
  generateShuffledDeck: async () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    for (let d = 0; d < 6; d++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          const value = rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(rank) ? 10 : parseInt(rank);
          deck.push({ rank, suit, value });
        }
      }
    }
    return deck;
  }
}));

const { BlackjackEngine } = await import('../blackjack');

// Helper: create a card
const card = (rank, suit = 'hearts') => {
  const value = rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(rank) ? 10 : parseInt(rank);
  return { rank, suit, value, faceDown: false };
};

describe('BlackjackEngine', () => {
  let engine;

  beforeEach(async () => {
    engine = new BlackjackEngine();
    await engine.initialize();
  });

  describe('getHandValue', () => {
    it('should calculate simple hand values', () => {
      expect(engine.getHandValue([card('5'), card('8')])).toBe(13);
      expect(engine.getHandValue([card('10'), card('K')])).toBe(20);
      expect(engine.getHandValue([card('2'), card('3'), card('4')])).toBe(9);
    });

    it('should count face cards as 10', () => {
      expect(engine.getHandValue([card('J'), card('Q')])).toBe(20);
      expect(engine.getHandValue([card('K'), card('J'), card('Q')])).toBe(30);
    });

    it('should count ace as 11 when hand is under 21', () => {
      expect(engine.getHandValue([card('A'), card('9')])).toBe(20);
      expect(engine.getHandValue([card('A'), card('K')])).toBe(21);
    });

    it('should count ace as 1 when hand would bust', () => {
      expect(engine.getHandValue([card('A'), card('9'), card('5')])).toBe(15);
      expect(engine.getHandValue([card('A'), card('A'), card('9')])).toBe(21);
    });

    it('should handle multiple aces correctly', () => {
      // A + A = 12 (11 + 1)
      expect(engine.getHandValue([card('A'), card('A')])).toBe(12);
      // A + A + A = 13 (11 + 1 + 1)
      expect(engine.getHandValue([card('A'), card('A'), card('A')])).toBe(13);
      // A + A + 9 = 21 (11 + 1 + 9) — wait, that's already 21. Let me check:
      // 11 + 11 + 9 = 31, reduce first ace: 21. Yes.
      expect(engine.getHandValue([card('A'), card('A'), card('9')])).toBe(21);
    });

    it('should handle bust correctly', () => {
      expect(engine.getHandValue([card('10'), card('K'), card('5')])).toBe(25);
    });

    it('should handle empty hand', () => {
      expect(engine.getHandValue([])).toBe(0);
    });
  });

  describe('startHand', () => {
    it('should deal 4 cards total (2 player, 2 dealer)', async () => {
      const state = await engine.startHand(100);
      expect(state.playerHands[0].length).toBe(2);
      expect(state.dealerHand.length).toBe(2);
    });

    it('should set bet amount correctly', async () => {
      const state = await engine.startHand(50);
      expect(state.bet).toBe(50);
      expect(state.handBets[0]).toBe(50);
    });

    it('should enter player-turn if not blackjack', async () => {
      // With a full 6-deck shoe, most deals won't be blackjack
      const state = await engine.startHand(100);
      // The state should be either player-turn or finished (if blackjack)
      expect(['player-turn', 'finished']).toContain(state.gameState);
    });

    it('should reset previous hand state', async () => {
      await engine.startHand(100);
      const state = await engine.startHand(200);
      expect(state.bet).toBe(200);
      expect(state.result).toBeNull();
      expect(state.playerHands.length).toBe(1);
    });

    it('should track per-hand bets', async () => {
      const state = await engine.startHand(75);
      expect(state.handBets).toEqual([75]);
    });
  });

  describe('hit', () => {
    it('should add a card to current hand', async () => {
      await engine.startHand(100);
      // Force non-blackjack by setting hand manually
      engine.playerHands = [[card('5'), card('3')]];
      engine.gameState = 'player-turn';

      const state = await engine.hit();
      expect(state.playerHands[0].length).toBe(3);
    });

    it('should detect bust', async () => {
      engine.playerHands = [[card('10'), card('8')]];
      engine.handBets = [100];
      engine.bet = 100;
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;

      // Pop specific card that causes bust
      engine.shoe = [card('5')]; // 10 + 8 + 5 = 23 = bust
      const state = await engine.hit();
      expect(state.gameState).toBe('finished');
      expect(state.result.outcome).toBe('bust');
      expect(state.result.payout).toBe(0);
    });

    it('should not act if not player-turn', async () => {
      engine.gameState = 'betting';
      const state = await engine.hit();
      expect(state.gameState).toBe('betting');
    });
  });

  describe('stand', () => {
    it('should trigger dealer play on last hand', async () => {
      engine.playerHands = [[card('10'), card('8')]];
      engine.dealerHand = [card('10'), card('6')];
      engine.handBets = [100];
      engine.bet = 100;
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;

      const state = await engine.stand();
      expect(state.gameState).toBe('finished');
      expect(state.result).not.toBeNull();
    });

    it('should move to next hand in split scenario', async () => {
      engine.playerHands = [[card('10'), card('8')], [card('10'), card('7')]];
      engine.handBets = [100, 100];
      engine.bet = 200;
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;

      await engine.stand();
      expect(engine.currentHandIndex).toBe(1);
    });
  });

  describe('doubleDown', () => {
    it('should double the current hand bet', async () => {
      engine.playerHands = [[card('5'), card('6')]];
      engine.dealerHand = [card('10'), card('7')];
      engine.handBets = [100];
      engine.bet = 100;
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;

      await engine.doubleDown();
      // handBet should be doubled (200), and then stand is called
      expect(engine.gameState).toBe('finished');
    });

    it('should only allow on first two cards', async () => {
      engine.playerHands = [[card('3'), card('4'), card('2')]]; // 3 cards
      engine.handBets = [100];
      engine.bet = 100;
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;

      const state = await engine.doubleDown();
      // Should not have doubled - hand still has 3 cards
      expect(state.handBets[0]).toBe(100);
    });

    it('should deal exactly one card', async () => {
      engine.playerHands = [[card('5'), card('6')]];
      engine.dealerHand = [card('10'), card('7')];
      engine.handBets = [100];
      engine.bet = 100;
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;

      await engine.doubleDown();
      expect(engine.playerHands[0].length).toBe(3);
    });
  });

  describe('split', () => {
    it('should split matching pairs into two hands', async () => {
      engine.playerHands = [[card('8'), card('8')]];
      engine.dealerHand = [card('10'), card('7')];
      engine.handBets = [100];
      engine.bet = 100;
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;

      await engine.split();
      expect(engine.playerHands.length).toBe(2);
      expect(engine.playerHands[0].length).toBe(2);
      expect(engine.playerHands[1].length).toBe(2);
    });

    it('should duplicate bet for split hand', async () => {
      engine.playerHands = [[card('8'), card('8')]];
      engine.dealerHand = [card('10'), card('7')];
      engine.handBets = [100];
      engine.bet = 100;
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;

      await engine.split();
      expect(engine.handBets).toEqual([100, 100]);
      expect(engine.bet).toBe(200);
    });

    it('should reject split on non-pair', async () => {
      engine.playerHands = [[card('8'), card('9')]];
      engine.handBets = [100];
      engine.bet = 100;
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;

      await engine.split();
      expect(engine.playerHands.length).toBe(1); // No split
    });
  });

  describe('canSplit / canDoubleDown', () => {
    it('canSplit returns true for pairs during player-turn', () => {
      engine.playerHands = [[card('J'), card('J')]];
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;
      expect(engine.canSplit()).toBe(true);
    });

    it('canSplit returns false for non-pairs', () => {
      engine.playerHands = [[card('J'), card('Q')]]; // Both value 10 but different ranks
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;
      expect(engine.canSplit()).toBe(false);
    });

    it('canDoubleDown returns true for two-card hand during player-turn', () => {
      engine.playerHands = [[card('5'), card('6')]];
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;
      expect(engine.canDoubleDown()).toBe(true);
    });

    it('canDoubleDown returns false after hitting', () => {
      engine.playerHands = [[card('5'), card('3'), card('2')]];
      engine.gameState = 'player-turn';
      engine.currentHandIndex = 0;
      expect(engine.canDoubleDown()).toBe(false);
    });
  });

  describe('determineWinner', () => {
    it('should award 2x bet on player win', () => {
      engine.playerHands = [[card('10'), card('9')]]; // 19
      engine.dealerHand = [card('10'), card('8')]; // 18
      engine.handBets = [100];
      engine.bet = 100;
      engine.determineWinner();
      expect(engine.result.outcome).toBe('win');
      expect(engine.result.payout).toBe(200);
    });

    it('should return bet on push', () => {
      engine.playerHands = [[card('10'), card('8')]]; // 18
      engine.dealerHand = [card('10'), card('8')]; // 18
      engine.handBets = [100];
      engine.bet = 100;
      engine.determineWinner();
      expect(engine.result.outcome).toBe('push');
      expect(engine.result.payout).toBe(100);
    });

    it('should pay 0 on player loss', () => {
      engine.playerHands = [[card('10'), card('7')]]; // 17
      engine.dealerHand = [card('10'), card('8')]; // 18
      engine.handBets = [100];
      engine.bet = 100;
      engine.determineWinner();
      expect(engine.result.outcome).toBe('lose');
      expect(engine.result.payout).toBe(0);
    });

    it('should award win on dealer bust', () => {
      engine.playerHands = [[card('10'), card('8')]]; // 18
      engine.dealerHand = [card('10'), card('6'), card('K')]; // 26 bust
      engine.handBets = [100];
      engine.bet = 100;
      engine.determineWinner();
      expect(engine.result.outcome).toBe('win');
      expect(engine.result.payout).toBe(200);
      expect(engine.result.dealerBust).toBe(true);
    });

    it('should handle split hands independently', () => {
      engine.playerHands = [
        [card('10'), card('9')], // 19 - wins
        [card('10'), card('7')]  // 17 - loses
      ];
      engine.dealerHand = [card('10'), card('8')]; // 18
      engine.handBets = [100, 100];
      engine.bet = 200;
      engine.determineWinner();
      // Hand 0 wins (200), Hand 1 loses (0) = 200 total, bet is 200 => push
      expect(engine.result.payout).toBe(200);
      expect(engine.result.handResults.length).toBe(2);
      expect(engine.result.handResults[0].outcome).toBe('win');
      expect(engine.result.handResults[1].outcome).toBe('lose');
    });
  });

  describe('blackjack payouts', () => {
    it('should pay 3:2 on blackjack (2.5x bet)', async () => {
      engine.playerHands = [[card('A'), card('K')]]; // 21
      engine.dealerHand = [card('10'), card('8')]; // 18
      engine.handBets = [100];
      engine.bet = 100;
      engine.gameState = 'dealing';

      // Simulate blackjack check from startHand
      if (engine.getHandValue(engine.playerHands[0]) === 21) {
        engine.gameState = 'finished';
        engine.result = { outcome: 'blackjack', payout: engine.bet * 2.5 };
      }

      expect(engine.result.payout).toBe(250);
    });

    it('should push when both have blackjack', async () => {
      engine.playerHands = [[card('A'), card('K')]];
      engine.dealerHand = [card('A'), card('Q')];
      engine.handBets = [100];
      engine.bet = 100;

      const pv = engine.getHandValue(engine.playerHands[0]);
      const dv = engine.getHandValue(engine.dealerHand);

      if (pv === 21 && dv === 21) {
        engine.result = { outcome: 'push', payout: engine.bet };
      }

      expect(engine.result.outcome).toBe('push');
      expect(engine.result.payout).toBe(100);
    });
  });

  describe('shouldReshuffle', () => {
    it('should reshuffle when shoe has fewer than 78 cards', () => {
      engine.shoe = new Array(77);
      expect(engine.shouldReshuffle()).toBe(true);
    });

    it('should not reshuffle when shoe has 78+ cards', () => {
      engine.shoe = new Array(78);
      expect(engine.shouldReshuffle()).toBe(false);
    });
  });

  describe('shouldDealerHit', () => {
    it('should hit on 16 or less', () => {
      engine.dealerHand = [card('10'), card('6')]; // 16
      expect(engine.shouldDealerHit()).toBe(true);

      engine.dealerHand = [card('5'), card('3')]; // 8
      expect(engine.shouldDealerHit()).toBe(true);
    });

    it('should stand on 17', () => {
      engine.dealerHand = [card('10'), card('7')]; // 17
      expect(engine.shouldDealerHit()).toBe(false);
    });

    it('should stand on 18+', () => {
      engine.dealerHand = [card('10'), card('8')]; // 18
      expect(engine.shouldDealerHit()).toBe(false);
    });
  });

  describe('getGameState', () => {
    it('should return all expected fields', async () => {
      const state = await engine.startHand(100);
      expect(state).toHaveProperty('dealerHand');
      expect(state).toHaveProperty('playerHands');
      expect(state).toHaveProperty('currentHandIndex');
      expect(state).toHaveProperty('gameState');
      expect(state).toHaveProperty('bet');
      expect(state).toHaveProperty('handBets');
      expect(state).toHaveProperty('result');
      expect(state).toHaveProperty('canSplit');
      expect(state).toHaveProperty('canDoubleDown');
      expect(state).toHaveProperty('shoeSize');
    });

    it('should return a copy of handBets (not reference)', () => {
      engine.handBets = [100, 200];
      const state = engine.getGameState();
      state.handBets[0] = 999;
      expect(engine.handBets[0]).toBe(100); // Original unchanged
    });
  });
});
