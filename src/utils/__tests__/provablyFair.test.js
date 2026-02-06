import { describe, it, expect } from 'vitest';
import {
  generateSeed,
  sha256,
  generateGameResult,
  hashToNumber,
  generateDiceRoll,
  generateShuffledDeck,
  verifyGameResult
} from '../provablyFair';

describe('provablyFair', () => {
  describe('generateSeed', () => {
    it('should generate a 64-character hex string', () => {
      const seed = generateSeed();
      expect(seed).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique seeds', () => {
      const seeds = new Set(Array.from({ length: 20 }, () => generateSeed()));
      expect(seeds.size).toBe(20);
    });
  });

  describe('sha256', () => {
    it('should produce a 64-character hex hash', async () => {
      const hash = await sha256('hello');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should be deterministic', async () => {
      const h1 = await sha256('test-input');
      const h2 = await sha256('test-input');
      expect(h1).toBe(h2);
    });

    it('should produce different hashes for different inputs', async () => {
      const h1 = await sha256('input-a');
      const h2 = await sha256('input-b');
      expect(h1).not.toBe(h2);
    });
  });

  describe('generateGameResult', () => {
    it('should be deterministic with same seeds and nonce', async () => {
      const r1 = await generateGameResult('server', 'client', 0);
      const r2 = await generateGameResult('server', 'client', 0);
      expect(r1).toBe(r2);
    });

    it('should produce different results with different nonces', async () => {
      const r1 = await generateGameResult('server', 'client', 0);
      const r2 = await generateGameResult('server', 'client', 1);
      expect(r1).not.toBe(r2);
    });

    it('should produce different results with different seeds', async () => {
      const r1 = await generateGameResult('server-a', 'client', 0);
      const r2 = await generateGameResult('server-b', 'client', 0);
      expect(r1).not.toBe(r2);
    });
  });

  describe('hashToNumber', () => {
    it('should return a number in range [0, max)', () => {
      const hash = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
      const num = hashToNumber(hash, 52);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThan(52);
    });

    it('should use first 8 hex characters', () => {
      // "00000001" = 1 in hex
      const hash = '00000001' + '0'.repeat(56);
      expect(hashToNumber(hash, 100)).toBe(1);
    });

    it('should handle max boundary', () => {
      const hash = 'ffffffff' + '0'.repeat(56);
      const num = hashToNumber(hash, 6);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThan(6);
    });
  });

  describe('generateDiceRoll', () => {
    it('should produce two dice values between 1 and 6', async () => {
      const result = await generateDiceRoll('server', 'client', 0);
      expect(result.die1).toBeGreaterThanOrEqual(1);
      expect(result.die1).toBeLessThanOrEqual(6);
      expect(result.die2).toBeGreaterThanOrEqual(1);
      expect(result.die2).toBeLessThanOrEqual(6);
    });

    it('should have total equal to sum of dice', async () => {
      const result = await generateDiceRoll('server', 'client', 0);
      expect(result.total).toBe(result.die1 + result.die2);
    });

    it('should be deterministic', async () => {
      const r1 = await generateDiceRoll('s', 'c', 42);
      const r2 = await generateDiceRoll('s', 'c', 42);
      expect(r1.die1).toBe(r2.die1);
      expect(r1.die2).toBe(r2.die2);
    });

    it('should produce varying results across nonces', async () => {
      const results = [];
      for (let i = 0; i < 50; i++) {
        results.push(await generateDiceRoll('server', 'client', i));
      }
      const totals = new Set(results.map(r => r.total));
      // Should produce at least a few different totals out of 50 rolls
      expect(totals.size).toBeGreaterThan(3);
    });
  });

  describe('generateShuffledDeck', () => {
    it('should produce a 312-card deck (6 decks)', async () => {
      const deck = await generateShuffledDeck('server', 'client', 0);
      expect(deck.length).toBe(312);
    });

    it('should contain correct card distribution', async () => {
      const deck = await generateShuffledDeck('server', 'client', 0);
      // 6 decks * 4 suits * 13 ranks = 312
      const aces = deck.filter(c => c.rank === 'A');
      expect(aces.length).toBe(24); // 6 decks * 4 suits

      const kings = deck.filter(c => c.rank === 'K');
      expect(kings.length).toBe(24);
    });

    it('should have proper card values', async () => {
      const deck = await generateShuffledDeck('server', 'client', 0);
      for (const card of deck) {
        if (card.rank === 'A') expect(card.value).toBe(11);
        else if (['J', 'Q', 'K'].includes(card.rank)) expect(card.value).toBe(10);
        else expect(card.value).toBe(parseInt(card.rank));
      }
    });

    it('should be deterministic with same seeds', async () => {
      const d1 = await generateShuffledDeck('s', 'c', 0);
      const d2 = await generateShuffledDeck('s', 'c', 0);
      for (let i = 0; i < d1.length; i++) {
        expect(d1[i].rank).toBe(d2[i].rank);
        expect(d1[i].suit).toBe(d2[i].suit);
      }
    });

    it('should produce different order with different seeds', async () => {
      const d1 = await generateShuffledDeck('server-a', 'client', 0);
      const d2 = await generateShuffledDeck('server-b', 'client', 0);
      // At least some cards should be in different positions
      let differences = 0;
      for (let i = 0; i < d1.length; i++) {
        if (d1[i].rank !== d2[i].rank || d1[i].suit !== d2[i].suit) differences++;
      }
      expect(differences).toBeGreaterThan(0);
    });
  });

  describe('verifyGameResult', () => {
    it('should verify a correct hash', async () => {
      const hash = await generateGameResult('server', 'client', 0);
      const verified = await verifyGameResult('server', 'client', 0, hash);
      expect(verified).toBe(true);
    });

    it('should reject an incorrect hash', async () => {
      const verified = await verifyGameResult('server', 'client', 0, 'wronghash');
      expect(verified).toBe(false);
    });
  });
});
