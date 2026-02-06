/**
 * Provably Fair System using Web Crypto API
 * Generates verifiable random outcomes for casino games
 */

// Generate a cryptographically secure random seed
export const generateSeed = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Hash function using SHA-256
export const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
};

// Generate a verifiable game result
export const generateGameResult = async (serverSeed, clientSeed, nonce) => {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = await sha256(combined);
  return hash;
};

// Convert hash to a number between 0 and max (exclusive)
export const hashToNumber = (hash, max) => {
  // Take first 8 characters of hash (32 bits)
  const hex = hash.substring(0, 8);
  const num = parseInt(hex, 16);
  // Normalize to range [0, max)
  return num % max;
};

// Generate shuffled deck using provably fair hash
// Fix 4.1: Batch all SHA-256 hashes in parallel instead of 312 sequential awaits
export const generateShuffledDeck = async (serverSeed, clientSeed, nonce, numDecks = 6) => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Create multiple decks
  const deck = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit, value: getCardValue(rank) });
      }
    }
  }

  // Pre-compute all hashes in parallel (instead of sequential awaits)
  const shuffled = [...deck];
  const indices = [];
  for (let i = shuffled.length - 1; i > 0; i--) {
    indices.push(i);
  }
  const hashes = await Promise.all(
    indices.map(i => generateGameResult(serverSeed, clientSeed, nonce + i))
  );

  // Fisher-Yates shuffle using pre-computed hashes
  for (let idx = 0; idx < indices.length; idx++) {
    const i = indices[idx];
    const j = hashToNumber(hashes[idx], i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

// Generate dice roll using provably fair hash
export const generateDiceRoll = async (serverSeed, clientSeed, nonce) => {
  const hash = await generateGameResult(serverSeed, clientSeed, nonce);

  // Generate two dice (1-6 each)
  const die1 = (hashToNumber(hash.substring(0, 8), 6)) + 1;
  const die2 = (hashToNumber(hash.substring(8, 16), 6)) + 1;

  return { die1, die2, total: die1 + die2 };
};

// Helper function to get card value for blackjack
const getCardValue = (rank) => {
  if (rank === 'A') return 11; // Ace value will be adjusted in game logic
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank);
};

// Create a game session with seeds
export const createGameSession = () => {
  const serverSeed = generateSeed();
  const clientSeed = generateSeed();

  return {
    serverSeed,
    serverSeedHash: null, // Will be set after hashing
    clientSeed,
    nonce: 0,
    revealed: false
  };
};

// Initialize a game session with hashed server seed
export const initializeGameSession = async () => {
  const session = createGameSession();
  session.serverSeedHash = await sha256(session.serverSeed);

  return {
    ...session,
    serverSeed: null // Hide server seed until game is revealed
  };
};

// Verify game result
export const verifyGameResult = async (serverSeed, clientSeed, nonce, expectedHash) => {
  const hash = await generateGameResult(serverSeed, clientSeed, nonce);
  return hash === expectedHash;
};
