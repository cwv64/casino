/**
 * Enhanced Craps Game Engine
 * Full casino craps implementation with Come bet tracking, dealer puck, and proper state machine
 */

import { generateDiceRoll, generateSeed } from '../utils/provablyFair';
import { getGameHistory, addGameToHistory } from '../utils/localStorage';

export class CrapsEngine {
  constructor() {
    this.serverSeed = null;
    this.clientSeed = null;
    this.nonce = 0;
    this.phase = 'comeOut'; // 'comeOut' or 'point'
    this.point = null;
    this.puckPosition = null; // null or 4, 5, 6, 8, 9, 10

    // Active bets structure
    this.bets = {
      passLine: 0,
      dontPass: 0,
      come: 0, // Active Come bet in Come area
      dontCome: 0,
      field: 0,
      odds: 0, // Odds behind Pass Line
      // Come bets that have moved to numbers
      comeNumbers: {
        4: { amount: 0, odds: 0 },
        5: { amount: 0, odds: 0 },
        6: { amount: 0, odds: 0 },
        8: { amount: 0, odds: 0 },
        9: { amount: 0, odds: 0 },
        10: { amount: 0, odds: 0 }
      },
      // Place bets
      place: {
        4: 0,
        5: 0,
        6: 0,
        8: 0,
        9: 0,
        10: 0
      },
      // Proposition bets
      hardways: {
        4: 0,
        6: 0,
        8: 0,
        10: 0
      },
      // One roll bets
      anySeven: 0,
      anyCraps: 0,
      horn: {
        2: 0,
        3: 0,
        11: 0,
        12: 0
      }
    };

    this.lastRoll = null;
    this.rollHistory = [];
    this.lastBets = null; // For "Repeat Last Bet"
  }

  async initialize() {
    this.serverSeed = generateSeed();
    this.clientSeed = generateSeed();
    this.nonce = 0;
    this.phase = 'comeOut';
    this.point = null;
    this.puckPosition = null;
    this.lastRoll = null;
    this.rollHistory = [];
  }

  // Save current bets for repeat functionality
  saveLastBets() {
    this.lastBets = JSON.parse(JSON.stringify(this.bets));
  }

  repeatLastBets() {
    if (this.lastBets) {
      return this.lastBets;
    }
    return null;
  }

  async roll() {
    const result = await generateDiceRoll(this.serverSeed, this.clientSeed, this.nonce);
    this.nonce++;
    this.lastRoll = result;
    this.rollHistory.push(result);

    const outcomes = this.evaluateRoll(result.total, result.die1, result.die2);

    // Save to history
    addGameToHistory({
      game: 'craps',
      roll: result,
      outcomes,
      phase: this.phase,
      point: this.point
    });

    return {
      roll: result,
      outcomes,
      phase: this.phase,
      point: this.point,
      puckPosition: this.puckPosition
    };
  }

  evaluateRoll(total, die1, die2) {
    const outcomes = [];

    // Evaluate phase-specific bets
    if (this.phase === 'comeOut') {
      outcomes.push(...this.evaluateComeOutRoll(total));
    } else {
      outcomes.push(...this.evaluatePointRoll(total));
    }

    // Evaluate Come bets
    outcomes.push(...this.evaluateComeBets(total));

    // Evaluate always-active bets
    outcomes.push(...this.evaluateFieldBet(total));
    outcomes.push(...this.evaluatePlaceBets(total));
    outcomes.push(...this.evaluateHardways(total, die1, die2));
    outcomes.push(...this.evaluateOneRollBets(total));

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
          payout: this.bets.passLine * 2,
          message: total === 7 ? 'Natural Seven!' : 'Yo-leven!'
        });
        this.bets.passLine = 0;
      } else if (total === 2 || total === 3 || total === 12) {
        outcomes.push({
          bet: 'passLine',
          result: 'lose',
          amount: this.bets.passLine,
          payout: 0,
          message: 'Craps!'
        });
        this.bets.passLine = 0;
      } else {
        // Point established
        this.point = total;
        this.phase = 'point';
        this.puckPosition = total;
        outcomes.push({
          bet: 'passLine',
          result: 'pointEstablished',
          point: total,
          message: `Point is ${total}`
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
          payout: this.bets.dontPass * 2,
          message: 'Don\'t Pass wins!'
        });
        this.bets.dontPass = 0;
      } else if (total === 7 || total === 11) {
        outcomes.push({
          bet: 'dontPass',
          result: 'lose',
          amount: this.bets.dontPass,
          payout: 0,
          message: 'Don\'t Pass loses'
        });
        this.bets.dontPass = 0;
      } else if (total === 12) {
        outcomes.push({
          bet: 'dontPass',
          result: 'push',
          amount: this.bets.dontPass,
          payout: this.bets.dontPass,
          message: 'Push on 12'
        });
      } else {
        // Point established
        this.point = total;
        this.phase = 'point';
        this.puckPosition = total;
      }
    }

    return outcomes;
  }

  evaluatePointRoll(total) {
    const outcomes = [];

    // Seven out
    if (total === 7) {
      // Pass Line loses
      if (this.bets.passLine > 0) {
        outcomes.push({
          bet: 'passLine',
          result: 'lose',
          amount: this.bets.passLine,
          payout: 0,
          message: 'Seven Out!'
        });
        this.bets.passLine = 0;
      }

      // Odds lose
      if (this.bets.odds > 0) {
        outcomes.push({
          bet: 'odds',
          result: 'lose',
          amount: this.bets.odds,
          payout: 0
        });
        this.bets.odds = 0;
      }

      // Don't Pass wins
      if (this.bets.dontPass > 0) {
        outcomes.push({
          bet: 'dontPass',
          result: 'win',
          amount: this.bets.dontPass,
          payout: this.bets.dontPass * 2,
          message: 'Don\'t Pass wins!'
        });
        this.bets.dontPass = 0;
      }

      // All Come bets on numbers lose
      Object.keys(this.bets.comeNumbers).forEach(num => {
        const comeBet = this.bets.comeNumbers[num];
        if (comeBet.amount > 0) {
          const totalLost = comeBet.amount + comeBet.odds;
          outcomes.push({
            bet: `come${num}`,
            result: 'lose',
            amount: totalLost,
            payout: 0,
            number: parseInt(num)
          });
          comeBet.amount = 0;
          comeBet.odds = 0;
        }
      });

      // Reset to come out
      this.phase = 'comeOut';
      this.point = null;
      this.puckPosition = null;
      outcomes.push({ event: 'sevenOut' });
    }
    // Point made
    else if (total === this.point) {
      // Pass Line wins
      if (this.bets.passLine > 0) {
        outcomes.push({
          bet: 'passLine',
          result: 'win',
          amount: this.bets.passLine,
          payout: this.bets.passLine * 2,
          message: `Point ${total} made!`
        });
        this.bets.passLine = 0;
      }

      // Odds win with true odds
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

      // Don't Pass loses
      if (this.bets.dontPass > 0) {
        outcomes.push({
          bet: 'dontPass',
          result: 'lose',
          amount: this.bets.dontPass,
          payout: 0
        });
        this.bets.dontPass = 0;
      }

      // Reset to come out
      this.phase = 'comeOut';
      this.point = null;
      this.puckPosition = null;
      outcomes.push({ event: 'pointMade', point: total });
    }

    return outcomes;
  }

  evaluateComeBets(total) {
    const outcomes = [];

    // Active Come bet in Come area
    if (this.bets.come > 0) {
      if (total === 7 || total === 11) {
        outcomes.push({
          bet: 'come',
          result: 'win',
          amount: this.bets.come,
          payout: this.bets.come * 2,
          message: 'Come bet wins!'
        });
        this.bets.come = 0;
      } else if (total === 2 || total === 3 || total === 12) {
        outcomes.push({
          bet: 'come',
          result: 'lose',
          amount: this.bets.come,
          payout: 0,
          message: 'Come bet loses on Craps'
        });
        this.bets.come = 0;
      } else if ([4, 5, 6, 8, 9, 10].includes(total)) {
        // Move Come bet to the number
        this.bets.comeNumbers[total].amount += this.bets.come;
        outcomes.push({
          bet: 'come',
          result: 'moved',
          amount: this.bets.come,
          toNumber: total,
          message: `Come bet moved to ${total}`
        });
        this.bets.come = 0;
      }
    }

    // Check Come bets on numbers
    Object.keys(this.bets.comeNumbers).forEach(num => {
      const comeBet = this.bets.comeNumbers[num];
      if (comeBet.amount > 0 && parseInt(num) === total) {
        const oddsPayout = comeBet.odds > 0 ? this.calculateOddsPayout(parseInt(num), comeBet.odds) : 0;
        const totalPayout = comeBet.amount * 2 + comeBet.odds + oddsPayout;

        outcomes.push({
          bet: `come${num}`,
          result: 'win',
          amount: comeBet.amount + comeBet.odds,
          payout: totalPayout,
          number: parseInt(num),
          message: `Come bet on ${num} wins!`
        });

        comeBet.amount = 0;
        comeBet.odds = 0;
      }
    });

    return outcomes;
  }

  evaluateFieldBet(total) {
    const outcomes = [];

    if (this.bets.field > 0) {
      if ([2, 3, 4, 9, 10, 11, 12].includes(total)) {
        let payout = this.bets.field * 2;
        if (total === 2 || total === 12) {
          payout = this.bets.field * 3; // 2:1 on 2 and 12
        }
        outcomes.push({
          bet: 'field',
          result: 'win',
          amount: this.bets.field,
          payout,
          message: total === 2 || total === 12 ? 'Field pays double!' : 'Field wins!'
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

    // Place bet wins
    if (this.bets.place[total] > 0) {
      const betAmount = this.bets.place[total];
      const payout = this.calculatePlacePayout(total, betAmount);
      outcomes.push({
        bet: `place${total}`,
        result: 'win',
        amount: betAmount,
        payout: betAmount + payout,
        number: total,
        message: `Place ${total} wins!`
      });
      // Place bets stay up unless taken down
    }

    // Seven clears all place bets
    if (total === 7 && this.phase === 'point') {
      Object.keys(this.bets.place).forEach(num => {
        if (this.bets.place[num] > 0) {
          outcomes.push({
            bet: `place${num}`,
            result: 'lose',
            amount: this.bets.place[num],
            payout: 0,
            number: parseInt(num)
          });
          this.bets.place[num] = 0;
        }
      });
    }

    return outcomes;
  }

  evaluateHardways(total, die1, die2) {
    const outcomes = [];
    const isHard = die1 === die2;

    if ([4, 6, 8, 10].includes(total)) {
      if (this.bets.hardways[total] > 0) {
        if (isHard) {
          // Hardway wins
          const payouts = { 4: 7, 6: 9, 8: 9, 10: 7 }; // to 1
          const payout = this.bets.hardways[total] * (payouts[total] + 1);
          outcomes.push({
            bet: `hard${total}`,
            result: 'win',
            amount: this.bets.hardways[total],
            payout,
            message: `Hard ${total} wins!`
          });
          this.bets.hardways[total] = 0;
        } else {
          // Easy way - hardway loses
          outcomes.push({
            bet: `hard${total}`,
            result: 'lose',
            amount: this.bets.hardways[total],
            payout: 0,
            message: `Hard ${total} loses (easy way)`
          });
          this.bets.hardways[total] = 0;
        }
      }
    }

    // Seven out clears all hardways
    if (total === 7) {
      [4, 6, 8, 10].forEach(num => {
        if (this.bets.hardways[num] > 0) {
          outcomes.push({
            bet: `hard${num}`,
            result: 'lose',
            amount: this.bets.hardways[num],
            payout: 0
          });
          this.bets.hardways[num] = 0;
        }
      });
    }

    return outcomes;
  }

  evaluateOneRollBets(total) {
    const outcomes = [];

    // Any Seven
    if (this.bets.anySeven > 0) {
      if (total === 7) {
        outcomes.push({
          bet: 'anySeven',
          result: 'win',
          amount: this.bets.anySeven,
          payout: this.bets.anySeven * 5, // 4:1
          message: 'Any Seven wins!'
        });
      } else {
        outcomes.push({
          bet: 'anySeven',
          result: 'lose',
          amount: this.bets.anySeven,
          payout: 0
        });
      }
      this.bets.anySeven = 0;
    }

    // Any Craps
    if (this.bets.anyCraps > 0) {
      if ([2, 3, 12].includes(total)) {
        outcomes.push({
          bet: 'anyCraps',
          result: 'win',
          amount: this.bets.anyCraps,
          payout: this.bets.anyCraps * 8, // 7:1
          message: 'Any Craps wins!'
        });
      } else {
        outcomes.push({
          bet: 'anyCraps',
          result: 'lose',
          amount: this.bets.anyCraps,
          payout: 0
        });
      }
      this.bets.anyCraps = 0;
    }

    // Horn bets
    const hornPayouts = { 2: 30, 3: 15, 11: 15, 12: 30 }; // to 1
    Object.keys(this.bets.horn).forEach(num => {
      const hornNum = parseInt(num);
      if (this.bets.horn[num] > 0) {
        if (total === hornNum) {
          outcomes.push({
            bet: `horn${num}`,
            result: 'win',
            amount: this.bets.horn[num],
            payout: this.bets.horn[num] * (hornPayouts[hornNum] + 1),
            message: `Horn ${num} wins!`
          });
        } else {
          outcomes.push({
            bet: `horn${num}`,
            result: 'lose',
            amount: this.bets.horn[num],
            payout: 0
          });
        }
        this.bets.horn[num] = 0;
      }
    });

    return outcomes;
  }

  calculatePlacePayout(number, betAmount) {
    const payouts = {
      4: 9 / 5,
      5: 7 / 5,
      6: 7 / 6,
      8: 7 / 6,
      9: 7 / 5,
      10: 9 / 5
    };
    return Math.floor(betAmount * payouts[number]);
  }

  calculateOddsPayout(point, betAmount) {
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
      this.bets.place[number] = (this.bets.place[number] || 0) + amount;
    } else if (betType === 'comeOdds' && number) {
      this.bets.comeNumbers[number].odds += amount;
    } else if (betType === 'hardway' && number) {
      this.bets.hardways[number] = (this.bets.hardways[number] || 0) + amount;
    } else if (betType === 'horn' && number) {
      this.bets.horn[number] = (this.bets.horn[number] || 0) + amount;
    } else {
      this.bets[betType] = (this.bets[betType] || 0) + amount;
    }
  }

  removeBet(betType, number = null) {
    if (betType === 'place' && number) {
      const amount = this.bets.place[number];
      this.bets.place[number] = 0;
      return amount;
    } else if (betType === 'comeNumber' && number) {
      const amount = this.bets.comeNumbers[number].amount;
      this.bets.comeNumbers[number].amount = 0;
      return amount;
    } else {
      const amount = this.bets[betType] || 0;
      this.bets[betType] = 0;
      return amount;
    }
  }

  canPlaceBet(betType) {
    if ((betType === 'passLine' || betType === 'dontPass') && this.phase !== 'comeOut') {
      return false;
    }
    if (betType === 'odds' && this.phase !== 'point') {
      return false;
    }
    return true;
  }

  getGameState() {
    return {
      phase: this.phase,
      point: this.point,
      puckPosition: this.puckPosition,
      bets: JSON.parse(JSON.stringify(this.bets)),
      lastRoll: this.lastRoll,
      rollHistory: [...this.rollHistory],
      nonce: this.nonce
    };
  }

  resetBets() {
    const oldBets = JSON.parse(JSON.stringify(this.bets));
    this.bets = {
      passLine: 0,
      dontPass: 0,
      come: 0,
      dontCome: 0,
      field: 0,
      odds: 0,
      comeNumbers: {
        4: { amount: 0, odds: 0 },
        5: { amount: 0, odds: 0 },
        6: { amount: 0, odds: 0 },
        8: { amount: 0, odds: 0 },
        9: { amount: 0, odds: 0 },
        10: { amount: 0, odds: 0 }
      },
      place: {
        4: 0,
        5: 0,
        6: 0,
        8: 0,
        9: 0,
        10: 0
      },
      hardways: {
        4: 0,
        6: 0,
        8: 0,
        10: 0
      },
      anySeven: 0,
      anyCraps: 0,
      horn: {
        2: 0,
        3: 0,
        11: 0,
        12: 0
      }
    };
    return oldBets;
  }
}
