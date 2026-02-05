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
    this.currentHandIndex = 0;
    this.gameState = 'betting'; // betting, dealing, player-turn, dealer-turn, finished
    this.bet = 0;
    this.result = null;
  }

  async initialize() {
    this.serverSeed = generateSeed();
    this.clientSeed = generateSeed();
    this.nonce = 0;
    await this.shuffleShoe();
  }

  async shuffleShoe() {
    this.shoe = await generateShuffledDeck(this.serverSeed, this.clientSeed, this.nonce);
    this.nonce += this.shoe.length; // Increment nonce for next shuffle
  }

  shouldReshuffle() {
    // Reshuffle when 75% of cards are used (6 decks = 312 cards, reshuffle at 78 cards remaining)
    return this.shoe.length < 78;
  }

  dealCard() {
    if (this.shouldReshuffle()) {
      this.shuffleShoe();
    }
    return this.shoe.pop();
  }

  async startHand(betAmount) {
    if (this.shouldReshuffle()) {
      await this.shuffleShoe();
    }

    this.bet = betAmount;
    this.dealerHand = [];
    this.playerHands = [[]];
    this.currentHandIndex = 0;
    this.gameState = 'dealing';
    this.result = null;

    // Deal initial cards (player, dealer, player, dealer)
    this.playerHands[0].push(this.dealCard());
    this.dealerHand.push(this.dealCard());
    this.playerHands[0].push(this.dealCard());
    this.dealerHand.push(this.dealCard());

    // Check for blackjack
    if (this.getHandValue(this.playerHands[0]) === 21) {
      if (this.getHandValue(this.dealerHand) === 21) {
        this.gameState = 'finished';
        this.result = { outcome: 'push', payout: 0 };
      } else {
        this.gameState = 'finished';
        this.result = { outcome: 'blackjack', payout: this.bet * 2.5 }; // 3:2 payout
      }
    } else {
      this.gameState = 'player-turn';
    }

    return this.getGameState();
  }

  hit() {
    if (this.gameState !== 'player-turn') return this.getGameState();

    const currentHand = this.playerHands[this.currentHandIndex];
    currentHand.push(this.dealCard());

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

  stand() {
    if (this.gameState !== 'player-turn') return this.getGameState();

    if (this.currentHandIndex < this.playerHands.length - 1) {
      this.currentHandIndex++;
    } else {
      this.playDealerHand();
    }

    return this.getGameState();
  }

  doubleDown() {
    if (this.gameState !== 'player-turn') return this.getGameState();
    if (this.playerHands[this.currentHandIndex].length !== 2) return this.getGameState();

    this.bet *= 2;
    this.hit();

    // Automatically stand after doubling
    if (this.gameState === 'player-turn') {
      this.stand();
    }

    return this.getGameState();
  }

  split() {
    if (this.gameState !== 'player-turn') return this.getGameState();

    const currentHand = this.playerHands[this.currentHandIndex];
    if (currentHand.length !== 2) return this.getGameState();
    if (currentHand[0].rank !== currentHand[1].rank) return this.getGameState();

    // Create new hand with second card
    const newHand = [currentHand.pop()];
    this.playerHands.splice(this.currentHandIndex + 1, 0, newHand);

    // Deal a card to each hand
    currentHand.push(this.dealCard());
    newHand.push(this.dealCard());

    return this.getGameState();
  }

  playDealerHand() {
    this.gameState = 'dealer-turn';

    // Dealer hits on 16, stands on soft 17
    while (this.shouldDealerHit()) {
      this.dealerHand.push(this.dealCard());
    }

    this.determineWinner();
    return this.getGameState();
  }

  shouldDealerHit() {
    const value = this.getHandValue(this.dealerHand);
    if (value < 17) return true;
    if (value > 17) return false;

    // Check for soft 17 (dealer stands on soft 17)
    const hasAce = this.dealerHand.some(card => card.rank === 'A');
    const hardValue = this.getHandValue(this.dealerHand, false);
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
      const handBet = this.bet / this.playerHands.length;

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
      result: this.result,
      canSplit: this.canSplit(),
      canDoubleDown: this.canDoubleDown(),
      shoeSize: this.shoe.length
    };
  }
}
