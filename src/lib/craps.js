/**
 * Craps Game Engine
 * Implements standard craps rules with accurate payout multipliers
 * - Pass Line / Don't Pass
 * - Come Out Roll vs Point Phase
 * - Odds bets
 * - Place bets with correct payouts (6/8: 7:6, 5/9: 7:5, 4/10: 9:5)
 */

import { generateDiceRoll, generateSeed } from '../utils/provablyFair';

export class CrapsEngine {
  constructor() {
    this.serverSeed = null;
    this.clientSeed = null;
    this.nonce = 0;
    this.phase = 'comeOut'; // comeOut or point
    this.point = null;
    this.bets = {
      passLine: 0,
      dontPass: 0,
      odds: 0,
      come: 0,
      dontCome: 0,
      place: {
        4: 0,
        5: 0,
        6: 0,
        8: 0,
        9: 0,
        10: 0
      },
      field: 0
    };
    this.lastRoll = null;
    this.rollHistory = [];
  }

  async initialize() {
    this.serverSeed = generateSeed();
    this.clientSeed = generateSeed();
    this.nonce = 0;
    this.phase = 'comeOut';
    this.point = null;
    this.lastRoll = null;
    this.rollHistory = [];
  }

  async roll() {
    const result = await generateDiceRoll(this.serverSeed, this.clientSeed, this.nonce);
    this.nonce++;
    this.lastRoll = result;
    this.rollHistory.push(result);

    const outcomes = this.evaluateRoll(result.total);

    return {
      roll: result,
      outcomes,
      phase: this.phase,
      point: this.point
    };
  }

  evaluateRoll(total) {
    const outcomes = [];

    if (this.phase === 'comeOut') {
      outcomes.push(...this.evaluateComeOutRoll(total));
    } else {
      outcomes.push(...this.evaluatePointRoll(total));
    }

    // Evaluate other bets
    outcomes.push(...this.evaluateFieldBet(total));
    outcomes.push(...this.evaluatePlaceBets(total));

    return outcomes;
  }

  evaluateComeOutRoll(total) {
    const outcomes = [];

    // Pass Line
    if (this.bets.passLine > 0) {
      if (total === 7 || total === 11) {
        outcomes.push({
          bet: 'passLine',
          result: 'win',
          amount: this.bets.passLine,
          payout: this.bets.passLine * 2
        });
        this.bets.passLine = 0;
      } else if (total === 2 || total === 3 || total === 12) {
        outcomes.push({
          bet: 'passLine',
          result: 'lose',
          amount: this.bets.passLine,
          payout: 0
        });
        this.bets.passLine = 0;
      } else {
        // Point established
        this.point = total;
        this.phase = 'point';
        outcomes.push({
          bet: 'passLine',
          result: 'point',
          point: total
        });
      }
    }

    // Don't Pass
    if (this.bets.dontPass > 0) {
      if (total === 2 || total === 3) {
        outcomes.push({
          bet: 'dontPass',
          result: 'win',
          amount: this.bets.dontPass,
          payout: this.bets.dontPass * 2
        });
        this.bets.dontPass = 0;
      } else if (total === 7 || total === 11) {
        outcomes.push({
          bet: 'dontPass',
          result: 'lose',
          amount: this.bets.dontPass,
          payout: 0
        });
        this.bets.dontPass = 0;
      } else if (total === 12) {
        outcomes.push({
          bet: 'dontPass',
          result: 'push',
          amount: this.bets.dontPass,
          payout: this.bets.dontPass
        });
        this.bets.dontPass = 0;
      } else {
        // Point established
        this.point = total;
        this.phase = 'point';
        outcomes.push({
          bet: 'dontPass',
          result: 'point',
          point: total
        });
      }
    }

    return outcomes;
  }

  evaluatePointRoll(total) {
    const outcomes = [];

    // Seven out - all Pass Line and Odds lose
    if (total === 7) {
      if (this.bets.passLine > 0) {
        outcomes.push({
          bet: 'passLine',
          result: 'lose',
          amount: this.bets.passLine,
          payout: 0
        });
        this.bets.passLine = 0;
      }

      if (this.bets.odds > 0) {
        outcomes.push({
          bet: 'odds',
          result: 'lose',
          amount: this.bets.odds,
          payout: 0
        });
        this.bets.odds = 0;
      }

      if (this.bets.dontPass > 0) {
        outcomes.push({
          bet: 'dontPass',
          result: 'win',
          amount: this.bets.dontPass,
          payout: this.bets.dontPass * 2
        });
        this.bets.dontPass = 0;
      }

      // Reset to come out roll
      this.phase = 'comeOut';
      this.point = null;
      outcomes.push({ result: 'sevenOut' });
    }
    // Point made
    else if (total === this.point) {
      if (this.bets.passLine > 0) {
        outcomes.push({
          bet: 'passLine',
          result: 'win',
          amount: this.bets.passLine,
          payout: this.bets.passLine * 2
        });
        this.bets.passLine = 0;
      }

      if (this.bets.odds > 0) {
        const oddsPayout = this.calculateOddsPayout(this.point, this.bets.odds);
        outcomes.push({
          bet: 'odds',
          result: 'win',
          amount: this.bets.odds,
          payout: this.bets.odds + oddsPayout
        });
        this.bets.odds = 0;
      }

      if (this.bets.dontPass > 0) {
        outcomes.push({
          bet: 'dontPass',
          result: 'lose',
          amount: this.bets.dontPass,
          payout: 0
        });
        this.bets.dontPass = 0;
      }

      // Reset to come out roll
      this.phase = 'comeOut';
      this.point = null;
      outcomes.push({ result: 'pointMade', point: total });
    }

    return outcomes;
  }

  evaluateFieldBet(total) {
    const outcomes = [];

    if (this.bets.field > 0) {
      // Field bet wins on 2, 3, 4, 9, 10, 11, 12
      if ([2, 3, 4, 9, 10, 11, 12].includes(total)) {
        let payout = this.bets.field * 2;

        // Double payout on 2 and 12
        if (total === 2 || total === 12) {
          payout = this.bets.field * 3;
        }

        outcomes.push({
          bet: 'field',
          result: 'win',
          amount: this.bets.field,
          payout
        });
      } else {
        outcomes.push({
          bet: 'field',
          result: 'lose',
          amount: this.bets.field,
          payout: 0
        });
      }
      this.bets.field = 0;
    }

    return outcomes;
  }

  evaluatePlaceBets(total) {
    const outcomes = [];

    if (this.bets.place[total] > 0) {
      const betAmount = this.bets.place[total];
      const payout = this.calculatePlacePayout(total, betAmount);

      outcomes.push({
        bet: `place${total}`,
        result: 'win',
        amount: betAmount,
        payout: betAmount + payout
      });
    }

    // Seven out clears all place bets
    if (total === 7) {
      Object.keys(this.bets.place).forEach(num => {
        if (this.bets.place[num] > 0) {
          outcomes.push({
            bet: `place${num}`,
            result: 'lose',
            amount: this.bets.place[num],
            payout: 0
          });
          this.bets.place[num] = 0;
        }
      });
    }

    return outcomes;
  }

  calculatePlacePayout(number, betAmount) {
    // Place bet payouts
    const payouts = {
      4: 9 / 5,   // 9:5
      5: 7 / 5,   // 7:5
      6: 7 / 6,   // 7:6
      8: 7 / 6,   // 7:6
      9: 7 / 5,   // 7:5
      10: 9 / 5   // 9:5
    };

    return Math.floor(betAmount * payouts[number]);
  }

  calculateOddsPayout(point, betAmount) {
    // True odds payouts
    const odds = {
      4: 2,    // 2:1
      5: 1.5,  // 3:2
      6: 1.2,  // 6:5
      8: 1.2,  // 6:5
      9: 1.5,  // 3:2
      10: 2    // 2:1
    };

    return Math.floor(betAmount * odds[point]);
  }

  placeBet(betType, amount, number = null) {
    if (betType === 'place' && number) {
      this.bets.place[number] = amount;
    } else {
      this.bets[betType] = amount;
    }
  }

  removeBet(betType, number = null) {
    if (betType === 'place' && number) {
      this.bets.place[number] = 0;
    } else {
      this.bets[betType] = 0;
    }
  }

  canPlaceBet(betType) {
    // Pass/Don't Pass only on come out
    if ((betType === 'passLine' || betType === 'dontPass') && this.phase !== 'comeOut') {
      return false;
    }

    // Odds only during point phase
    if (betType === 'odds' && this.phase !== 'point') {
      return false;
    }

    return true;
  }

  getGameState() {
    return {
      phase: this.phase,
      point: this.point,
      bets: { ...this.bets },
      lastRoll: this.lastRoll,
      rollHistory: [...this.rollHistory],
      nonce: this.nonce
    };
  }

  resetBets() {
    this.bets = {
      passLine: 0,
      dontPass: 0,
      odds: 0,
      come: 0,
      dontCome: 0,
      place: {
        4: 0,
        5: 0,
        6: 0,
        8: 0,
        9: 0,
        10: 0
      },
      field: 0
    };
  }
}
