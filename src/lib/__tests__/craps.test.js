import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock provablyFair and localStorage
vi.mock('../../utils/provablyFair', () => ({
  generateSeed: () => 'test-seed',
  generateDiceRoll: async (s, c, n) => {
    // Default: return 7 (can be overridden per test)
    return { die1: 4, die2: 3, total: 7 };
  }
}));

vi.mock('../../utils/localStorage', () => ({
  getGameHistory: () => [],
  addGameToHistory: () => true
}));

const { CrapsEngine } = await import('../craps');

describe('CrapsEngine', () => {
  let engine;

  beforeEach(async () => {
    engine = new CrapsEngine();
    await engine.initialize();
  });

  describe('initial state', () => {
    it('should start in comeOut phase', () => {
      expect(engine.phase).toBe('comeOut');
      expect(engine.point).toBeNull();
      expect(engine.puckPosition).toBeNull();
    });

    it('should have all bets at zero', () => {
      expect(engine.bets.passLine).toBe(0);
      expect(engine.bets.dontPass).toBe(0);
      expect(engine.bets.field).toBe(0);
      expect(engine.bets.come).toBe(0);
    });
  });

  describe('placeBet / removeBet', () => {
    it('should place flat bets correctly', () => {
      engine.placeBet('passLine', 25);
      expect(engine.bets.passLine).toBe(25);
      engine.placeBet('passLine', 10);
      expect(engine.bets.passLine).toBe(35);
    });

    it('should place place bets with number', () => {
      engine.placeBet('place', 30, 6);
      expect(engine.bets.place[6]).toBe(30);
    });

    it('should place hardway bets', () => {
      engine.placeBet('hardway', 10, 8);
      expect(engine.bets.hardways[8]).toBe(10);
    });

    it('should place horn bets', () => {
      engine.placeBet('horn', 5, 2);
      expect(engine.bets.horn[2]).toBe(5);
    });

    it('should place come odds', () => {
      engine.bets.comeNumbers[6].amount = 25;
      engine.placeBet('comeOdds', 50, 6);
      expect(engine.bets.comeNumbers[6].odds).toBe(50);
    });

    it('should remove flat bets and return amount', () => {
      engine.placeBet('passLine', 25);
      const refund = engine.removeBet('passLine');
      expect(refund).toBe(25);
      expect(engine.bets.passLine).toBe(0);
    });

    it('should remove place bets with number', () => {
      engine.placeBet('place', 30, 6);
      const refund = engine.removeBet('place', 6);
      expect(refund).toBe(30);
      expect(engine.bets.place[6]).toBe(0);
    });

    it('should remove hardway bets with number', () => {
      engine.placeBet('hardway', 10, 8);
      const refund = engine.removeBet('hardway', 8);
      expect(refund).toBe(10);
      expect(engine.bets.hardways[8]).toBe(0);
    });

    it('should remove horn bets with number', () => {
      engine.placeBet('horn', 5, 12);
      const refund = engine.removeBet('horn', 12);
      expect(refund).toBe(5);
      expect(engine.bets.horn[12]).toBe(0);
    });
  });

  describe('canPlaceBet', () => {
    it('should allow passLine only on comeOut', () => {
      expect(engine.canPlaceBet('passLine')).toBe(true);
      engine.phase = 'point';
      expect(engine.canPlaceBet('passLine')).toBe(false);
    });

    it('should allow odds only on point phase', () => {
      expect(engine.canPlaceBet('odds')).toBe(false);
      engine.phase = 'point';
      expect(engine.canPlaceBet('odds')).toBe(true);
    });

    it('should always allow field bets', () => {
      expect(engine.canPlaceBet('field')).toBe(true);
      engine.phase = 'point';
      expect(engine.canPlaceBet('field')).toBe(true);
    });
  });

  describe('come-out roll', () => {
    it('should win pass line on 7', () => {
      engine.bets.passLine = 25;
      const outcomes = engine.evaluateComeOutRoll(7);
      const passResult = outcomes.find(o => o.bet === 'passLine');
      expect(passResult.result).toBe('win');
      expect(passResult.payout).toBe(50); // 25 * 2
      expect(engine.bets.passLine).toBe(0);
    });

    it('should win pass line on 11', () => {
      engine.bets.passLine = 25;
      const outcomes = engine.evaluateComeOutRoll(11);
      const passResult = outcomes.find(o => o.bet === 'passLine');
      expect(passResult.result).toBe('win');
      expect(passResult.payout).toBe(50);
    });

    it('should lose pass line on craps (2, 3, 12)', () => {
      for (const craps of [2, 3, 12]) {
        engine.bets.passLine = 25;
        const outcomes = engine.evaluateComeOutRoll(craps);
        const passResult = outcomes.find(o => o.bet === 'passLine');
        expect(passResult.result).toBe('lose');
        expect(passResult.payout).toBe(0);
      }
    });

    it('should establish point on 4, 5, 6, 8, 9, 10', () => {
      for (const point of [4, 5, 6, 8, 9, 10]) {
        engine.phase = 'comeOut';
        engine.point = null;
        engine.bets.passLine = 25;
        const outcomes = engine.evaluateComeOutRoll(point);
        const passResult = outcomes.find(o => o.bet === 'passLine');
        expect(passResult.result).toBe('pointEstablished');
        expect(engine.point).toBe(point);
        expect(engine.phase).toBe('point');
        expect(engine.puckPosition).toBe(point);
      }
    });

    it('should win dontPass on 2 or 3', () => {
      engine.bets.dontPass = 25;
      const outcomes = engine.evaluateComeOutRoll(2);
      const result = outcomes.find(o => o.bet === 'dontPass');
      expect(result.result).toBe('win');
      expect(result.payout).toBe(50);
    });

    it('should lose dontPass on 7 or 11', () => {
      engine.bets.dontPass = 25;
      const outcomes = engine.evaluateComeOutRoll(7);
      const result = outcomes.find(o => o.bet === 'dontPass');
      expect(result.result).toBe('lose');
    });

    it('should push dontPass on 12', () => {
      engine.bets.dontPass = 25;
      const outcomes = engine.evaluateComeOutRoll(12);
      const result = outcomes.find(o => o.bet === 'dontPass');
      expect(result.result).toBe('push');
      expect(result.payout).toBe(25);
    });
  });

  describe('point roll', () => {
    beforeEach(() => {
      engine.phase = 'point';
      engine.point = 6;
      engine.puckPosition = 6;
    });

    it('should win pass line when point is made', () => {
      engine.bets.passLine = 25;
      const outcomes = engine.evaluatePointRoll(6);
      const result = outcomes.find(o => o.bet === 'passLine');
      expect(result.result).toBe('win');
      expect(result.payout).toBe(50);
      expect(engine.phase).toBe('comeOut');
      expect(engine.point).toBeNull();
    });

    it('should lose pass line on seven-out', () => {
      engine.bets.passLine = 25;
      const outcomes = engine.evaluatePointRoll(7);
      const result = outcomes.find(o => o.bet === 'passLine');
      expect(result.result).toBe('lose');
      expect(result.payout).toBe(0);
      expect(engine.phase).toBe('comeOut');
    });

    it('should win dontPass on seven-out', () => {
      engine.bets.dontPass = 25;
      const outcomes = engine.evaluatePointRoll(7);
      const result = outcomes.find(o => o.bet === 'dontPass');
      expect(result.result).toBe('win');
      expect(result.payout).toBe(50);
    });

    it('should lose dontPass when point is made', () => {
      engine.bets.dontPass = 25;
      const outcomes = engine.evaluatePointRoll(6);
      const result = outcomes.find(o => o.bet === 'dontPass');
      expect(result.result).toBe('lose');
    });

    it('should pay odds at true odds on point made', () => {
      engine.bets.passLine = 25;
      engine.bets.odds = 50;
      const outcomes = engine.evaluatePointRoll(6);
      const oddsResult = outcomes.find(o => o.bet === 'odds');
      expect(oddsResult.result).toBe('win');
      // Point 6: 6:5 odds, so 50 * 1.2 = 60 winnings, payout = 50 + 60 = 110
      expect(oddsResult.payout).toBe(110);
    });

    it('should lose odds on seven-out', () => {
      engine.bets.passLine = 25;
      engine.bets.odds = 50;
      const outcomes = engine.evaluatePointRoll(7);
      const oddsResult = outcomes.find(o => o.bet === 'odds');
      expect(oddsResult.result).toBe('lose');
      expect(oddsResult.payout).toBe(0);
    });

    it('should clear all come-number bets on seven-out', () => {
      engine.bets.comeNumbers[4].amount = 25;
      engine.bets.comeNumbers[8].amount = 15;
      const outcomes = engine.evaluatePointRoll(7);
      const comeLosses = outcomes.filter(o => o.bet && o.bet.startsWith('come') && o.result === 'lose');
      expect(comeLosses.length).toBe(2);
      expect(engine.bets.comeNumbers[4].amount).toBe(0);
      expect(engine.bets.comeNumbers[8].amount).toBe(0);
    });
  });

  describe('field bets', () => {
    it('should win on field numbers (3, 4, 9, 10, 11)', () => {
      for (const num of [3, 4, 9, 10, 11]) {
        engine.bets.field = 10;
        const outcomes = engine.evaluateFieldBet(num);
        expect(outcomes[0].result).toBe('win');
        expect(outcomes[0].payout).toBe(20); // 1:1
      }
    });

    it('should pay double on 2', () => {
      engine.bets.field = 10;
      const outcomes = engine.evaluateFieldBet(2);
      expect(outcomes[0].result).toBe('win');
      expect(outcomes[0].payout).toBe(30); // 2:1
    });

    it('should pay double on 12', () => {
      engine.bets.field = 10;
      const outcomes = engine.evaluateFieldBet(12);
      expect(outcomes[0].result).toBe('win');
      expect(outcomes[0].payout).toBe(30);
    });

    it('should lose on 5, 6, 7, 8', () => {
      for (const num of [5, 6, 7, 8]) {
        engine.bets.field = 10;
        const outcomes = engine.evaluateFieldBet(num);
        expect(outcomes[0].result).toBe('lose');
        expect(outcomes[0].payout).toBe(0);
      }
    });

    it('should clear field bet after evaluation', () => {
      engine.bets.field = 10;
      engine.evaluateFieldBet(9);
      expect(engine.bets.field).toBe(0);
    });
  });

  describe('place bets', () => {
    it('should pay place bet on hit (bet stays up)', () => {
      engine.bets.place[6] = 30;
      const outcomes = engine.evaluatePlaceBets(6, 'point');
      const result = outcomes.find(o => o.bet === 'place6');
      expect(result.result).toBe('win');
      // Place 6 pays 7:6, so 30 * 7/6 = 35
      expect(result.payout).toBe(35);
      // Bet stays up
      expect(engine.bets.place[6]).toBe(30);
    });

    it('should clear all place bets on seven during point phase', () => {
      engine.bets.place[4] = 20;
      engine.bets.place[6] = 30;
      engine.bets.place[8] = 25;
      const outcomes = engine.evaluatePlaceBets(7, 'point');
      const losses = outcomes.filter(o => o.result === 'lose');
      expect(losses.length).toBe(3);
      expect(engine.bets.place[4]).toBe(0);
      expect(engine.bets.place[6]).toBe(0);
      expect(engine.bets.place[8]).toBe(0);
    });

    it('should NOT clear place bets on seven during comeOut phase', () => {
      engine.bets.place[6] = 30;
      const outcomes = engine.evaluatePlaceBets(7, 'comeOut');
      const losses = outcomes.filter(o => o.result === 'lose');
      expect(losses.length).toBe(0);
      expect(engine.bets.place[6]).toBe(30); // Still there
    });
  });

  describe('place bet payouts', () => {
    it('should pay 9:5 on 4 and 10', () => {
      expect(engine.calculatePlacePayout(4, 50)).toBe(90);  // 50 * 9/5
      expect(engine.calculatePlacePayout(10, 50)).toBe(90);
    });

    it('should pay 7:5 on 5 and 9', () => {
      expect(engine.calculatePlacePayout(5, 50)).toBe(70);  // 50 * 7/5
      expect(engine.calculatePlacePayout(9, 50)).toBe(70);
    });

    it('should pay 7:6 on 6 and 8', () => {
      expect(engine.calculatePlacePayout(6, 30)).toBe(35);  // 30 * 7/6
      expect(engine.calculatePlacePayout(8, 30)).toBe(35);
    });
  });

  describe('odds payouts (true odds)', () => {
    it('should pay 2:1 on 4 and 10', () => {
      expect(engine.calculateOddsPayout(4, 50)).toBe(100);
      expect(engine.calculateOddsPayout(10, 50)).toBe(100);
    });

    it('should pay 3:2 on 5 and 9', () => {
      expect(engine.calculateOddsPayout(5, 50)).toBe(75);
      expect(engine.calculateOddsPayout(9, 50)).toBe(75);
    });

    it('should pay 6:5 on 6 and 8', () => {
      expect(engine.calculateOddsPayout(6, 50)).toBe(60);
      expect(engine.calculateOddsPayout(8, 50)).toBe(60);
    });
  });

  describe('hardways', () => {
    it('should win hardway on hard roll', () => {
      engine.bets.hardways[8] = 10;
      const outcomes = engine.evaluateHardways(8, 4, 4); // hard 8
      const result = outcomes.find(o => o.bet === 'hard8');
      expect(result.result).toBe('win');
      // Hard 8 pays 9:1, so 10 * (9+1) = 100
      expect(result.payout).toBe(100);
    });

    it('should lose hardway on easy roll', () => {
      engine.bets.hardways[8] = 10;
      const outcomes = engine.evaluateHardways(8, 5, 3); // easy 8
      const result = outcomes.find(o => o.bet === 'hard8');
      expect(result.result).toBe('lose');
    });

    it('should lose all hardways on seven', () => {
      engine.bets.hardways[4] = 5;
      engine.bets.hardways[6] = 5;
      engine.bets.hardways[8] = 5;
      engine.bets.hardways[10] = 5;
      const outcomes = engine.evaluateHardways(7, 4, 3);
      expect(outcomes.filter(o => o.result === 'lose').length).toBe(4);
    });

    it('should pay 7:1 on hard 4 and hard 10', () => {
      engine.bets.hardways[4] = 10;
      const outcomes = engine.evaluateHardways(4, 2, 2);
      expect(outcomes[0].payout).toBe(80); // 10 * (7+1)

      engine.bets.hardways[10] = 10;
      const outcomes2 = engine.evaluateHardways(10, 5, 5);
      expect(outcomes2[0].payout).toBe(80);
    });

    it('should pay 9:1 on hard 6 and hard 8', () => {
      engine.bets.hardways[6] = 10;
      const outcomes = engine.evaluateHardways(6, 3, 3);
      expect(outcomes[0].payout).toBe(100); // 10 * (9+1)
    });
  });

  describe('one-roll bets', () => {
    it('should win anySeven on 7', () => {
      engine.bets.anySeven = 10;
      const outcomes = engine.evaluateOneRollBets(7);
      const result = outcomes.find(o => o.bet === 'anySeven');
      expect(result.result).toBe('win');
      expect(result.payout).toBe(50); // 4:1
    });

    it('should lose anySeven on non-7', () => {
      engine.bets.anySeven = 10;
      const outcomes = engine.evaluateOneRollBets(8);
      expect(outcomes[0].result).toBe('lose');
    });

    it('should win anyCraps on 2, 3, 12', () => {
      for (const craps of [2, 3, 12]) {
        engine.bets.anyCraps = 10;
        const outcomes = engine.evaluateOneRollBets(craps);
        const result = outcomes.find(o => o.bet === 'anyCraps');
        expect(result.result).toBe('win');
        expect(result.payout).toBe(80); // 7:1
      }
    });

    it('should win horn 2 on 2 (pays 30:1)', () => {
      engine.bets.horn[2] = 5;
      const outcomes = engine.evaluateOneRollBets(2);
      const result = outcomes.find(o => o.bet === 'horn2');
      expect(result.result).toBe('win');
      expect(result.payout).toBe(155); // 5 * (30+1)
    });

    it('should win horn 3 on 3 (pays 15:1)', () => {
      engine.bets.horn[3] = 5;
      const outcomes = engine.evaluateOneRollBets(3);
      const result = outcomes.find(o => o.bet === 'horn3');
      expect(result.result).toBe('win');
      expect(result.payout).toBe(80); // 5 * (15+1)
    });

    it('should lose horn bets on wrong number', () => {
      engine.bets.horn[2] = 5;
      engine.bets.horn[12] = 5;
      const outcomes = engine.evaluateOneRollBets(7);
      expect(outcomes.every(o => o.result === 'lose')).toBe(true);
    });
  });

  describe('come bets', () => {
    it('should win come bet on 7', () => {
      engine.bets.come = 25;
      const outcomes = engine.evaluateComeBets(7);
      const result = outcomes.find(o => o.bet === 'come');
      expect(result.result).toBe('win');
      expect(result.payout).toBe(50);
    });

    it('should win come bet on 11', () => {
      engine.bets.come = 25;
      const outcomes = engine.evaluateComeBets(11);
      const result = outcomes.find(o => o.bet === 'come');
      expect(result.result).toBe('win');
    });

    it('should lose come bet on 2, 3, 12', () => {
      for (const craps of [2, 3, 12]) {
        engine.bets.come = 25;
        const outcomes = engine.evaluateComeBets(craps);
        const result = outcomes.find(o => o.bet === 'come');
        expect(result.result).toBe('lose');
      }
    });

    it('should move come bet to number on 4-10', () => {
      engine.bets.come = 25;
      const outcomes = engine.evaluateComeBets(6);
      const result = outcomes.find(o => o.bet === 'come');
      expect(result.result).toBe('moved');
      expect(engine.bets.comeNumbers[6].amount).toBe(25);
      expect(engine.bets.come).toBe(0);
    });

    it('should win come-number bet when number hits', () => {
      engine.bets.comeNumbers[8].amount = 25;
      const outcomes = engine.evaluateComeBets(8);
      const result = outcomes.find(o => o.bet === 'come8');
      expect(result.result).toBe('win');
      expect(result.payout).toBe(50);
    });

    it('should NOT win a just-moved come bet on same roll', () => {
      // If come bet moves to 6, and the roll is 6, it shouldn't immediately win
      engine.bets.come = 25;
      const outcomes = engine.evaluateComeBets(6);
      // Should only have the 'moved' result, not a win
      const wins = outcomes.filter(o => o.result === 'win');
      expect(wins.length).toBe(0);
    });
  });

  describe('dont come bets', () => {
    it('should win dontCome on 2 or 3', () => {
      engine.bets.dontCome = 25;
      const outcomes = engine.evaluateComeBets(2);
      const result = outcomes.find(o => o.bet === 'dontCome');
      expect(result.result).toBe('win');
    });

    it('should lose dontCome on 7 or 11', () => {
      engine.bets.dontCome = 25;
      const outcomes = engine.evaluateComeBets(7);
      const result = outcomes.find(o => o.bet === 'dontCome');
      expect(result.result).toBe('lose');
    });

    it('should push dontCome on 12', () => {
      engine.bets.dontCome = 25;
      const outcomes = engine.evaluateComeBets(12);
      const result = outcomes.find(o => o.bet === 'dontCome');
      expect(result.result).toBe('push');
      expect(result.payout).toBe(25);
    });

    it('should move dontCome to number', () => {
      engine.bets.dontCome = 25;
      const outcomes = engine.evaluateComeBets(6);
      const result = outcomes.find(o => o.bet === 'dontCome');
      expect(result.result).toBe('moved');
      expect(engine.bets.dontComeNumbers[6].amount).toBe(25);
    });
  });

  describe('evaluateRoll integration (phase capture fix)', () => {
    it('should clear place bets on seven-out (phase captured before change)', () => {
      engine.phase = 'point';
      engine.point = 6;
      engine.puckPosition = 6;
      engine.bets.passLine = 25;
      engine.bets.place[8] = 30;
      engine.bets.place[4] = 20;

      const outcomes = engine.evaluateRoll(7, 4, 3);

      // Place bets should be lost (phase was 'point' when roll started)
      const place8Loss = outcomes.find(o => o.bet === 'place8' && o.result === 'lose');
      const place4Loss = outcomes.find(o => o.bet === 'place4' && o.result === 'lose');
      expect(place8Loss).toBeDefined();
      expect(place4Loss).toBeDefined();
      expect(engine.bets.place[8]).toBe(0);
      expect(engine.bets.place[4]).toBe(0);
    });
  });

  describe('resetBets', () => {
    it('should clear all bets and return old bets', () => {
      engine.bets.passLine = 25;
      engine.bets.place[6] = 30;
      engine.bets.hardways[8] = 10;
      engine.bets.horn[2] = 5;

      const old = engine.resetBets();
      expect(old.passLine).toBe(25);
      expect(old.place[6]).toBe(30);

      expect(engine.bets.passLine).toBe(0);
      expect(engine.bets.place[6]).toBe(0);
      expect(engine.bets.hardways[8]).toBe(0);
      expect(engine.bets.horn[2]).toBe(0);
    });
  });

  describe('getGameState', () => {
    it('should return a shallow clone of bets', () => {
      engine.bets.passLine = 50;
      engine.bets.place[6] = 30;
      const state = engine.getGameState();

      // Mutate state copy
      state.bets.passLine = 999;
      state.bets.place[6] = 999;

      // Original should be unchanged
      expect(engine.bets.passLine).toBe(50);
      expect(engine.bets.place[6]).toBe(30);
    });

    it('should return all expected fields', () => {
      const state = engine.getGameState();
      expect(state).toHaveProperty('phase');
      expect(state).toHaveProperty('point');
      expect(state).toHaveProperty('puckPosition');
      expect(state).toHaveProperty('bets');
      expect(state).toHaveProperty('lastRoll');
      expect(state).toHaveProperty('rollHistory');
      expect(state).toHaveProperty('nonce');
    });
  });
});
