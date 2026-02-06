# Lucky Roll Casino — Improvement Roadmap

Fresh audit of the codebase after completing initial bug fixes, mobile improvements, performance optimizations, UX improvements, and test coverage.

---

## 1. New Games & Game Features

### 1.1 Roulette Table
Add a fully-featured roulette game with European (single-zero) and American (double-zero) variants. Inside bets (straight, split, street, corner, line) and outside bets (red/black, odd/even, dozens, columns). Animated spinning wheel with ball physics.

### 1.2 Video Poker (Jacks or Better)
Classic 5-card draw poker with hold/draw mechanic. Pay table displayed on screen. Correct strategy hints as an optional toggle.

### 1.3 Blackjack: Insurance Bet
When the dealer shows an Ace, offer the player an insurance side bet (pays 2:1 if dealer has blackjack). Standard casino feature currently missing.

### 1.4 Blackjack: Surrender Option
Add late surrender — player forfeits half their bet to fold a bad hand before the dealer checks for blackjack. Togglable in settings.

### 1.5 Blackjack: Even Money
When the player has blackjack and the dealer shows an Ace, offer "Even Money" (guaranteed 1:1 payout instead of risking a push).

### 1.6 Blackjack: Side Bets
Perfect Pairs (pays if first two cards are a pair), 21+3 (poker-style hand with player's two cards + dealer upcard). Optional side bet panel.

### 1.7 Multi-Hand Blackjack
Allow playing 1-3 hands simultaneously against the same dealer. Each hand has its own bet and decisions.

### 1.8 Craps: Lay Bets
Add lay bets (betting a 7 will come before a specific number). Currently only place bets are implemented for number betting.

### 1.9 Craps: Big 6 / Big 8
Simple even-money bet that 6 or 8 will roll before 7. Easy for beginners, visible on the table layout.

### 1.10 Slots (3-Reel Classic)
Simple 3-reel slot machine with configurable pay lines. Uses the same provably fair system for reel positions.

---

## 2. Accessibility

### 2.1 ARIA Labels on All Interactive Elements
Most buttons and interactive areas lack `aria-label` attributes. Every game action button (Hit, Stand, Double, Split, Roll, place bet areas), chip selector, modal controls, and header buttons need descriptive labels for screen readers.

### 2.2 Reduced Motion Support
Add `@media (prefers-reduced-motion: reduce)` to disable or simplify all animations: card deals, dice rolls, confetti celebrations, modal transitions, and header slide-in. Users with vestibular disorders or seizure sensitivity need this.

### 2.3 Focus Management in Modals
When a modal opens, focus should trap inside it. When it closes, focus should return to the trigger button. Currently focus can escape to background elements.

### 2.4 Semantic HTML Landmarks
Replace generic `<div>` containers with `<main>`, `<nav>`, `<section>`, `<aside>` where appropriate. Add `role` attributes to game areas.

### 2.5 Color-Blind Friendly State Indicators
Win/loss/push states are communicated primarily through color (green/red/gold). Add icons (checkmark, X, equals) alongside colors so color-blind users can distinguish outcomes.

### 2.6 Keyboard Shortcuts for Game Actions
- Blackjack: `H` = Hit, `S` = Stand, `D` = Double Down, `P` = Split
- Craps: `R` = Roll Dice, `U` = Undo Last Bet, number keys for chip selection
- Global: `Esc` = Close modal, `?` = Show rules

### 2.7 Screen Reader Announcements
Use `aria-live` regions to announce game results, dice roll outcomes, and balance changes so screen reader users get real-time updates without needing to manually re-read the page.

---

## 3. Visual & Animation Improvements

### 3.1 Bust / Win Visual Indicators on Hand
When a blackjack hand busts, flash the hand area red with a "BUST" stamp overlay. When winning, pulse the hand green. Currently only the result banner shows the outcome.

### 3.2 Chip Stacking Animation
When increasing a bet, animate chips stacking visually in the bet area instead of just updating a number. Show actual chip graphics building up.

### 3.3 Dealer Persona / Chat Bubbles
Add a simple animated dealer avatar that shows contextual quips: "Nice hand!", "Tough break", "Blackjack!", "Snake eyes!". Adds personality and engagement.

### 3.4 Card Flip Animation Improvement
Current card animations use opacity crossfade between front/back. A true 3D flip rotation (CSS `transform: rotateY`) would look more realistic. The dealer hole card reveal especially benefits from a dramatic flip.

### 3.5 Craps Dice Animation Polish
Add a more realistic dice-rolling animation with tumbling, bouncing, and settling. Current animation is functional but could feel more physical with spring physics and randomized rotation.

### 3.6 Table Felt Texture
The felt background uses a CSS gradient. A subtle SVG noise texture overlay would add realism. Could also add a slight vignette effect at the table edges.

### 3.7 Winning Bet Highlight Duration
When a bet wins or loses in craps, the visual highlight only lasts ~2 seconds. Extend to 3-4 seconds or until the next roll so players can clearly see which bets resolved.

### 3.8 Card Shadows and Depth
Add subtle drop shadows to cards that increase when cards overlap (split hands). Creates visual depth hierarchy.

---

## 4. UX Improvements

### 4.1 Session Statistics Dashboard
Track and display: total hands played, win/loss record, biggest single win, current streak, session net profit/loss, time played. Accessible from the settings modal or a dedicated stats button.

### 4.2 Provably Fair Verification UI
Currently seeds are generated but players can't verify past results. Add a panel where players can see the server seed hash (before reveal), enter/change their client seed, and after a hand, see the revealed server seed + hash verification.

### 4.3 Animation Speed Control
The settings store has an `animationSpeed` field but it's not wired to anything. Connect it to card deal delays, dice roll duration, and result display timing. Options: Slow, Normal, Fast, Instant.

### 4.4 Theme Customization
The settings store has a `theme` field that does nothing. Add at minimum: felt color (green, blue, red), card back design (classic red, blue, black), and light/dark mode.

### 4.5 Quick Bet Presets
Let players save favorite bet amounts (e.g., "My $50 bet", "Max bet") as one-tap presets. Especially useful for craps where the same bet combinations are repeated.

### 4.6 Toast Notification System
Replace inline error/success messages with a proper toast notification system. Toasts stack in a corner, auto-dismiss, and don't interfere with gameplay layout.

### 4.7 Bet Confirmation on Large Bets
When placing a bet that exceeds 25% of the player's balance, show a confirmation dialog. Prevents accidental large bets, especially on mobile where mis-taps happen.

### 4.8 Hot/Cold Number Display for Craps
Show which numbers have been rolling frequently (hot) and which haven't appeared in a while (cold). Common feature on real craps displays.

### 4.9 Running Shoe Composition (Card Counting Aid)
Optional toggle to show the remaining card composition in the shoe (how many of each rank remain). Educational tool for learning card counting concepts.

### 4.10 Auto-Rebet Toggle
Add a toggle that automatically places the same bet after each hand completes. Player just clicks "Deal" without re-selecting chips. Speeds up gameplay significantly.

---

## 5. Mobile Experience

### 5.1 Bottom Action Bar for Blackjack
On mobile, game action buttons (Hit/Stand/Double/Split) should be in a fixed bottom bar for easy thumb access, instead of mid-screen where they require reaching.

### 5.2 Swipe Gestures
Swipe left to Stand, swipe right to Hit in blackjack. Swipe up on a chip to add it to the bet. Natural mobile interactions.

### 5.3 Haptic Feedback Patterns
Currently `navigator.vibrate` is used minimally. Add distinct vibration patterns: short buzz for chip place, double buzz for win, long buzz for bust, triple for blackjack.

### 5.4 Landscape Mode Optimization
The craps table especially benefits from landscape orientation. Detect orientation and reorganize the layout: wider table grid, side-by-side bet panel and table.

### 5.5 Pinch-to-Zoom on Craps Table
The craps table is information-dense. Allow pinch-to-zoom on the table area while keeping the bet controls accessible.

### 5.6 Mobile-First Craps Layout
Reorganize the craps table for mobile as a scrollable vertical layout: Pass Line section at top, then Place Bets, then Proposition Bets. Current 7-column grid is too cramped below 768px.

---

## 6. Architecture & Code Quality

### 6.1 Separate Game Engine Side Effects
`CrapsEngine.roll()` directly writes to localStorage via `addGameToHistory()`. Game engines should be pure — persistence should be handled by the React hooks/stores layer. This improves testability and reusability.

### 6.2 Deduplicate Hand Value Calculation
`BlackjackEngine.getHandValue()` and `BlackjackTable.getHandValue()` implement the same logic differently. The table component's version handles `faceDown` cards and soft/hard display, while the engine's doesn't. Consolidate into one exported function.

### 6.3 Unified Result Types
Return types are inconsistent: `walletStore.withdraw` returns `{ success, balance, error }`, hooks return `{ success, state }` or `{ success, error }`, engine methods return raw state. Define a shared `Result<T>` pattern.

### 6.4 Extract Craps Sub-Components
`BetArea`, `NumberBox`, and chip display logic are defined inline inside `CrapsTable`. These should be extracted to separate files to improve readability, enable memoization, and reduce the 500+ line component.

### 6.5 TypeScript Migration
The project has `@types/react` installed but no TypeScript. A gradual migration starting with the game engines would catch many potential bugs at compile time (null access, wrong argument types, missing parameters).

### 6.6 ESLint + Prettier Configuration
No linting or formatting configuration exists. Add ESLint with React plugin and Prettier for consistent code style. Add as a pre-commit hook.

### 6.7 Error Boundary Component
No React Error Boundary exists. If any component throws during render, the entire app crashes. Add an error boundary that shows a recovery UI and preserves the player's balance.

### 6.8 Environment Configuration
Hard-coded values like the GitHub Pages base path (`/casino/`), default balance ($1,000), table limits ($5/$500), and reshuffle threshold (78 cards) should be extracted to a configuration file or environment variables.

---

## 7. PWA & Offline Support

### 7.1 Service Worker for Offline Play
Register a service worker to cache the app shell and enable offline gameplay. Since there's no backend, the entire app can work offline once loaded.

### 7.2 App Manifest
Add a `manifest.json` with proper icons, theme color, display mode, and start URL so the app can be installed as a PWA on mobile home screens.

### 7.3 Export / Import Save Data
Let players export their balance, history, and settings as a JSON file and import it on another device. Useful since data lives in localStorage which is device-specific.

---

## 8. Engagement Features

### 8.1 Achievement System
Award badges for milestones: "First Blackjack", "Won $1,000 in a session", "Hit a Hard 8", "10-hand win streak", "Played 100 hands". Display in a trophy case.

### 8.2 Daily Bonus
Award free chips once per day (tracked via localStorage timestamp). Encourages return visits. Bonus amount could scale with consecutive days.

### 8.3 Challenge Mode
Pre-set scenarios: "Turn $100 into $500 in 20 hands", "Win 5 craps rolls in a row with pass line bet". Adds structured gameplay goals.

### 8.4 Leaderboard (Local)
Track personal bests: highest balance reached, biggest single win, longest win streak, most profitable session. No backend needed — all localStorage.

---

## Priority Matrix

| # | Item | Impact | Effort | Priority |
|---|------|--------|--------|----------|
| 2.1 | ARIA labels | High | Low | **P0** |
| 2.2 | Reduced motion | High | Low | **P0** |
| 2.6 | Keyboard shortcuts | High | Medium | **P1** |
| 4.1 | Session statistics | High | Medium | **P1** |
| 4.2 | Provably fair verification | High | Medium | **P1** |
| 1.1 | Roulette | High | High | **P1** |
| 3.1 | Bust/win indicators | Medium | Low | **P1** |
| 4.10 | Auto-rebet | Medium | Low | **P1** |
| 5.1 | Bottom action bar | Medium | Low | **P1** |
| 6.1 | Engine side effects | Medium | Medium | **P2** |
| 6.2 | Deduplicate hand value | Medium | Low | **P2** |
| 6.4 | Extract craps components | Medium | Medium | **P2** |
| 4.3 | Animation speed | Medium | Low | **P2** |
| 8.1 | Achievements | Medium | High | **P2** |
| 7.1 | Offline PWA | Medium | Medium | **P2** |
| 1.2 | Video Poker | Medium | High | **P3** |
| 1.10 | Slots | Medium | High | **P3** |
| 6.5 | TypeScript | High | Very High | **P3** |
