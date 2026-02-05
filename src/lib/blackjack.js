/**
 * Blackjack Game Engine
 * Implements Las Vegas Strip rules:
 * - 6-deck shoe
 * - Dealer stands on soft 17
 * - Blackjack pays 3:2
 * - Double down on any two cards
 * - Split pairs (including Aces)
 * - Reshuffle when 75% depleted
 */

import { generateShuffledDeck, generateSeed, sha256 } from '../utils/provablyFair';

export class BlackjackEngine {
  constructor() {
    this.shoe = [];
    this.serverSeed = null;
    this.clientSeed = null;
    this.nonce = 0;
    this.dealerHand = [];
    this.playerHands = [[]]; // Support for splits
    this.handBets = [0]; // Per-hand bet tracking (fix 1.2)
    this.currentHandIndex = 0;
    this.gameState = 'betting'; // betting, dealing, player-turn, dealer-turn, finished
    this.bet = 0; // Total amount wagered (sum of all hand bets)
    this.result = null;
    this.shufflePromise = null; // Track pending shuffle (fix 1.7)
  }

  async initialize() {
    this.serverSeed = generateSeed();
    this.clientSeed = generateSeed();
    this.nonce = 0;
    await this.shuffleShoe();
  }

  async shuffleShoe() {
    this.shufflePromise = generateShuffledDeck(this.serverSeed, this.clientSeed, this.nonce);
    this.shoe = await this.shufflePromise;
    this.shufflePromise = null;
    this.nonce += this.shoe.length; // Increment nonce for next shuffle
  }

  shouldReshuffle() {
    // Reshuffle when 75% of cards are used (6 decks = 312 cards, reshuffle at 78 cards remaining)
    return this.shoe.length < 78;
  }

  // Fix 1.7: dealCard is now async to properly await reshuffles
  async dealCard(faceDown = false) {
    if (this.shufflePromise) {
      await this.shufflePromise;
    }
    if (this.shouldReshuffle()) {
      await this.shuffleShoe();
    }
    const card = this.shoe.pop();
    card.faceDown = faceDown;
    return card;
  }

  async startHand(betAmount) {
    if (this.shouldReshuffle()) {
      await this.shuffleShoe();
    }

    this.bet = betAmount;
    this.dealerHand = [];
    this.playerHands = [[]];
    this.handBets = [betAmount]; // Fix 1.2: track per-hand bets
    this.currentHandIndex = 0;
    this.gameState = 'dealing';
    this.result = null;

    // Deal initial cards (player, dealer, player, dealer)
    this.playerHands[0].push(await this.dealCard());
    this.dealerHand.push(await this.dealCard());
    this.playerHands[0].push(await this.dealCard());
    this.dealerHand.push(await this.dealCard());

    // Check for blackjack
    if (this.getHandValue(this.playerHands[0]) === 21) {
      if (this.getHandValue(this.dealerHand) === 21) {
        this.gameState = 'finished';
        // Fix 1.1: push returns the original bet
        this.result = { outcome: 'push', payout: this.bet };
      } else {
        this.gameState = 'finished';
        this.result = { outcome: 'blackjack', payout: this.bet * 2.5 }; // 3:2 payout
      }
    } else {
      this.gameState = 'player-turn';
    }

    return this.getGameState();
  }

  async hit() {
    if (this.gameState !== 'player-turn') return this.getGameState();

    const currentHand = this.playerHands[this.currentHandIndex];
    currentHand.push(await this.dealCard());

    const handValue = this.getHandValue(currentHand);

    if (handValue > 21) {
      // Bust
      if (this.currentHandIndex < this.playerHands.length - 1) {
        this.currentHandIndex++;
      } else {
        this.checkAllHandsBust();
      }
    }

    return this.getGameState();
  }

  async stand() {
    if (this.gameState !== 'player-turn') return this.getGameState();

    if (this.currentHandIndex < this.playerHands.length - 1) {
      this.currentHandIndex++;
    } else {
      await this.playDealerHand();
    }

    return this.getGameState();
  }

  async doubleDown(faceDown = true) {
    if (this.gameState !== 'player-turn') return this.getGameState();
    if (this.playerHands[this.currentHandIndex].length !== 2) return this.getGameState();

    // Fix 1.2: only double the current hand's bet, not the global bet
    this.handBets[this.currentHandIndex] *= 2;
    this.bet = this.handBets.reduce((sum, b) => sum + b, 0);

    // Deal one card (optionally face down)
    const currentHand = this.playerHands[this.currentHandIndex];
    const card = await this.dealCard(faceDown);
    currentHand.push(card);

    const handValue = this.getHandValue(currentHand);

    // Check for bust
    if (handValue > 21) {
      if (this.currentHandIndex < this.playerHands.length - 1) {
        this.currentHandIndex++;
      } else {
        this.checkAllHandsBust();
      }
    } else {
      // Automatically stand after doubling
      await this.stand();
    }

    return this.getGameState();
  }

  async split() {
    if (this.gameState !== 'player-turn') return this.getGameState();

    const currentHand = this.playerHands[this.currentHandIndex];
    if (currentHand.length !== 2) return this.getGameState();
    if (currentHand[0].rank !== currentHand[1].rank) return this.getGameState();

    // Fix 1.2: split the bet - each hand gets the original hand bet
    const originalHandBet = this.handBets[this.currentHandIndex];

    // Create new hand with second card
    const newHand = [currentHand.pop()];
    this.playerHands.splice(this.currentHandIndex + 1, 0, newHand);
    this.handBets.splice(this.currentHandIndex + 1, 0, originalHandBet);
    this.bet = this.handBets.reduce((sum, b) => sum + b, 0);

    // Deal a card to each hand
    currentHand.push(await this.dealCard());
    newHand.push(await this.dealCard());

    return this.getGameState();
  }

  async playDealerHand() {
    this.gameState = 'dealer-turn';

    // Dealer hits on 16, stands on soft 17
    while (this.shouldDealerHit()) {
      this.dealerHand.push(await this.dealCard());
    }

    this.determineWinner();
    return this.getGameState();
  }

  shouldDealerHit() {
    const value = this.getHandValue(this.dealerHand);
    if (value < 17) return true;
    if (value > 17) return false;

    // Check for soft 17 (dealer stands on soft 17)
    return false; // Stand on soft 17
  }

  checkAllHandsBust() {
    const allBust = this.playerHands.every(hand => this.getHandValue(hand) > 21);
    if (allBust) {
      this.gameState = 'finished';
      this.result = { outcome: 'bust', payout: 0 };
    }
  }

  determineWinner() {
    this.gameState = 'finished';
    const dealerValue = this.getHandValue(this.dealerHand);
    const dealerBust = dealerValue > 21;

    let totalPayout = 0;
    const handResults = [];

    this.playerHands.forEach((hand, index) => {
      const playerValue = this.getHandValue(hand);
      // Fix 1.2: use per-hand bet instead of dividing global bet
      const handBet = this.handBets[index];

      if (playerValue > 21) {
        handResults.push({ hand: index, outcome: 'bust', payout: 0 });
      } else if (dealerBust) {
        const payout = handBet * 2;
        totalPayout += payout;
        handResults.push({ hand: index, outcome: 'win', payout });
      } else if (playerValue > dealerValue) {
        const payout = handBet * 2;
        totalPayout += payout;
        handResults.push({ hand: index, outcome: 'win', payout });
      } else if (playerValue === dealerValue) {
        totalPayout += handBet;
        handResults.push({ hand: index, outcome: 'push', payout: handBet });
      } else {
        handResults.push({ hand: index, outcome: 'lose', payout: 0 });
      }
    });

    this.result = {
      outcome: totalPayout > this.bet ? 'win' : totalPayout === this.bet ? 'push' : 'lose',
      payout: totalPayout,
      handResults,
      dealerValue,
      dealerBust
    };
  }

  getHandValue(hand, useAce = true) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else {
        value += card.value;
      }
    }

    // Adjust for aces
    while (value > 21 && aces > 0 && useAce) {
      value -= 10;
      aces--;
    }

    return value;
  }

  canSplit() {
    if (this.gameState !== 'player-turn') return false;
    const hand = this.playerHands[this.currentHandIndex];
    return hand.length === 2 && hand[0].rank === hand[1].rank;
  }

  canDoubleDown() {
    if (this.gameState !== 'player-turn') return false;
    const hand = this.playerHands[this.currentHandIndex];
    return hand.length === 2;
  }

  getGameState() {
    return {
      dealerHand: this.dealerHand,
      playerHands: this.playerHands,
      currentHandIndex: this.currentHandIndex,
      gameState: this.gameState,
      bet: this.bet,
      handBets: [...this.handBets],
      result: this.result,
      canSplit: this.canSplit(),
      canDoubleDown: this.canDoubleDown(),
      shoeSize: this.shoe.length
    };
  }
}
