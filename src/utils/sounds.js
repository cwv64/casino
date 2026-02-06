/**
 * Sound effects using Web Audio API (no external files needed)
 * Fix 5.4: Add sound effects to replace misleading soundEnabled setting
 */

let audioCtx = null;
let soundEnabled = true;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

// Resume audio context on user interaction (required by browsers)
const ensureResumed = async () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
};

const playTone = async (frequency, duration, type = 'sine', volume = 0.15) => {
  if (!soundEnabled) return;
  try {
    const ctx = await ensureResumed();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio is not available
  }
};

const playNoise = async (duration, volume = 0.08) => {
  if (!soundEnabled) return;
  try {
    const ctx = await ensureResumed();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // Silently fail
  }
};

export const sounds = {
  chipPlace: () => playTone(800, 0.08, 'sine', 0.12),
  chipRemove: () => playTone(400, 0.1, 'sine', 0.1),
  cardDeal: () => playNoise(0.06, 0.1),
  diceRoll: () => playNoise(0.3, 0.12),
  win: async () => {
    await playTone(523, 0.15, 'sine', 0.15);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 100);
    setTimeout(() => playTone(784, 0.25, 'sine', 0.18), 200);
  },
  bigWin: async () => {
    const notes = [523, 659, 784, 1047, 784, 1047];
    for (let i = 0; i < notes.length; i++) {
      setTimeout(() => playTone(notes[i], 0.2, 'sine', 0.18), i * 120);
    }
  },
  lose: () => playTone(200, 0.3, 'sawtooth', 0.08),
  push: () => playTone(440, 0.2, 'triangle', 0.1),
  error: () => playTone(150, 0.15, 'square', 0.1),
  buttonClick: () => playTone(600, 0.05, 'sine', 0.08),
};

export const setSoundEnabled = (enabled) => {
  soundEnabled = enabled;
};

export const isSoundEnabled = () => soundEnabled;
