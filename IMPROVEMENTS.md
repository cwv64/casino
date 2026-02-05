# Premium Vegas Casino - Improvement Recommendations

A comprehensive audit of the codebase identified the following areas for improvement, organized by category and priority.

---

## 1. Bugs & Correctness Issues

### 1.1 Blackjack push pays $0 instead of returning the bet
**File:** `src/lib/blackjack.js:76`
When both player and dealer have blackjack, `result.payout` is `0` but the player's bet was already withdrawn. The player loses their bet on a push.
```js
// Current (broken)
this.result = { outcome: 'push', payout: 0 };
// Fix: return the original bet
this.result = { outcome: 'push', payout: this.bet };
```

### 1.2 Double down doubles `this.bet` globally, corrupting split payouts
**File:** `src/lib/blackjack.js:124`
`this.bet *= 2` mutates the shared bet field. If the player split first and then doubles on one hand, `determineWinner()` at line 207 divides `this.bet` evenly across all hands — so the non-doubled hand also pays out at the doubled rate.

### 1.3 `handleGameEnd` used before it's defined in the `useCallback` dependency chain
**File:** `src/hooks/useBlackjack.js:42`
`startHand` references `handleGameEnd` but `handleGameEnd` is declared after `startHand`. Since both are `useCallback`s, `handleGameEnd` will be the stale initial closure on first render. This can cause the first hand's payout to silently fail.

### 1.4 `doubleDown` in `useBlackjack` ignores the `faceDown` parameter
**File:** `src/hooks/useBlackjack.js:69`
The hook's `doubleDown` callback takes no arguments, so the `faceDown` parameter from `BlackjackTable` (line 53) is never forwarded to the engine.

### 1.5 Wallet balance can go negative
**File:** `src/utils/localStorage.js:43`
`updateWalletBalance` does not check for negative results. If two rapid operations interleave (e.g., placing a craps bet while a blackjack hand resolves), the balance can go below zero.

### 1.6 Craps: Place bets don't reset on win
**File:** `src/lib/craps.js:536`
The comment says "Place bets stay up unless taken down," which is correct casino behavior. However, the payout calculation at line 532 includes the original bet (`betAmount + payout`), effectively both paying and returning the bet — but the bet is never removed, creating a double-credit situation on the next win.

### 1.7 `dealCard` calls async `shuffleShoe` synchronously
**File:** `src/lib/blackjack.js:46-49`
`dealCard()` is synchronous but calls `this.shuffleShoe()` which is async. The shuffle promise is never awaited, meaning cards can be dealt from the old depleted shoe.

### 1.8 Craps Don't Come push on 12 doesn't refund
**File:** `src/lib/craps.js:420-425`
On a push, `payout` is set to `this.bets.dontCome` but the bet is zeroed out. The push payout is included in the outcomes array, but the CrapsTable component only calls `deposit()` for outcomes with `result === 'win'` (line 226-238). The push refund is lost.

---

## 2. Accessibility (A11y)

### 2.1 No ARIA labels on interactive elements
All game action buttons (`Hit`, `Stand`, `Roll Dice`, bet areas) lack `aria-label` attributes. Screen readers cannot communicate the meaning of these controls.

### 2.2 Color-only state indication
Win/loss/push outcomes and bet states are communicated entirely through color (green/red/gold). Users with color vision deficiency cannot distinguish these states. Add icons or text labels.

### 2.3 No keyboard navigation for craps table
The craps table relies on mouse click and right-click interactions. There's no keyboard support for placing/removing bets, making the game unusable without a mouse.

### 2.4 No focus management after state changes
After dealing cards or rolling dice, focus isn't moved to the result area. Screen reader users have no indication that something changed.

### 2.5 Right-click to remove bets is undiscoverable
The only instruction is a small text at the bottom. Mobile users on touch devices have no way to remove individual bets (long-press is not implemented).

### 2.6 Missing `<title>` and landmark elements
The page has no `<main>`, `<nav>`, or `<section>` landmark roles beyond the raw HTML. The document `<title>` is likely the default Vite title.

---

## 3. Mobile & Responsive Design

### 3.1 Chip selector overflows on small screens
**File:** `src/components/ui/Chip.jsx:40`
Six 64px chips in a row (384px + gaps) overflow viewports under 430px. The container has no `flex-wrap` or horizontal scroll.

### 3.2 Card size is fixed at `w-20 h-28`
**File:** `src/components/ui/Card.jsx:29`
Cards don't scale down on mobile. With split hands, 4+ cards overflow the screen horizontally.

### 3.3 Header layout breaks on narrow screens
**File:** `src/components/layout/Header.jsx:12`
The header uses `justify-between` with no wrap, causing the title and wallet/buttons to overlap below ~500px.

### 3.4 Craps table requires horizontal scroll on mobile
The 7-column grid at `CrapsTable.jsx:401` with `gap-3` and border-8 is too wide for mobile viewports, even with the responsive adjustments.

### 3.5 No touch-friendly bet removal on craps
Right-click is not available on mobile. Need long-press or a dedicated "Remove" button per bet area.

---

## 4. Performance

### 4.1 Provably fair deck shuffle is O(n) SHA-256 hashes
**File:** `src/utils/provablyFair.js:54-58`
The Fisher-Yates shuffle awaits a SHA-256 hash for each of 312 cards. That's 312 sequential async crypto operations on every shuffle. This should be batched or use a single seed to generate a PRNG stream.

### 4.2 `Modal` component is re-created every render
**File:** `src/App.jsx:17`
The `Modal` component is defined inline inside `App()`. React creates a new component type each render, causing full unmount/remount of modal DOM on every App state change.

### 4.3 `getGameState()` deep-clones bets on every call
**File:** `src/lib/craps.js:750`
`JSON.parse(JSON.stringify(this.bets))` is called every time state is read. In the craps flow, `getGameState()` is called after every `placeBet`, `removeBet`, and `roll` — meaning frequent full deep-clones of a large nested object.

### 4.4 `getTotalBets` recalculates on every render
**File:** `src/hooks/useCraps.js:78`
`getTotalBets` is a `useCallback` that's called directly in the render body of `CrapsTable` (line 23: `const totalBets = getTotalBets()`). This recalculates on every render. Should be a derived value from state, ideally with `useMemo`.

### 4.5 Game history writes to localStorage on every craps roll
**File:** `src/lib/craps.js:108`
Every single dice roll writes to localStorage. With rapid rolls, this can cause jank on low-end devices.

---

## 5. User Experience (UX)

### 5.1 No hand value display
The blackjack table shows cards but doesn't display the current hand value to the player. The `getHandValue` function exists in `BlackjackTable.jsx` (line 56) but is never called in the render output. Players must mentally count card values.

### 5.2 No "New Hand" / "Play Again" button after a hand ends
After a blackjack hand finishes, the player must manually adjust their bet and click "Deal Cards" again. A quick "Rebet & Deal" button would speed up play.

### 5.3 No game history UI
Game history is stored (last 100 games) but there's no UI to view it. The `gameStore` tracks history that players can never see.

### 5.4 No sound effects
The settings store has `soundEnabled: true` as a default, but no audio is implemented anywhere. The setting is misleading.

### 5.5 No balance validation feedback
When a player tries to bet more than their balance, nothing visible happens. There's no error toast, shake animation, or disabled state explanation.

### 5.6 Craps bet minimum/maximum not enforced
Players can bet any amount with no table minimum or maximum. Real craps tables have limits that affect strategy.

### 5.7 No undo for the last bet placed
Once a chip is added to the bet in blackjack, the only option is "Clear Bet" which removes everything. An undo-last-chip feature would help.

### 5.8 Confetti fires on small wins
The win celebration fires identically for a $5 field bet win and a $1000 blackjack. Celebration intensity should scale with payout.

### 5.9 No tutorial or rules explanation
New players have no onboarding. Craps in particular is notoriously complex, and the UI assumes full knowledge of all bet types.

### 5.10 "Clear Last Bet" in craps actually clears ALL bets
**File:** `src/components/craps/CrapsTable.jsx:271-288`
Despite the label, `handleClearLastBet` calls `resetBets()` which removes every bet, then sets `lastBetSnapshot` to null. It's functionally identical to "Clear All Bets."

---

## 6. Code Quality & Architecture

### 6.1 Game engines mix business logic with side effects
`CrapsEngine.roll()` (line 108) directly writes to localStorage via `addGameToHistory`. Game engines should be pure — persistence should be handled by the hooks or stores.

### 6.2 Duplicated hand value calculation
Hand value is computed in both `BlackjackEngine.getHandValue()` and `BlackjackTable.getHandValue()` with slightly different implementations. This violates DRY and risks divergence.

### 6.3 Inconsistent error handling patterns
- `walletStore.withdraw` returns `{ success, balance, error }`
- `useBlackjack.startHand` returns `{ success, error }` or `{ success, state }`
- `useCraps.placeBet` returns `{ success, error }` or `{ success, state }`
- `engine.hit()` returns the game state directly with no error wrapper

There's no consistent result type across the codebase.

### 6.4 `BetArea` and `NumberBox` defined inside `CrapsTable` render
**File:** `src/components/craps/CrapsTable.jsx:34,80`
These are full components with props, hooks (`motion`), and conditional logic, but they're defined inside the parent component function. They are re-created on every render, which defeats React's reconciliation and causes unnecessary DOM churn.

### 6.5 No TypeScript
The entire project is plain JavaScript with JSX. There are `@types/react` devDependencies installed but unused. TypeScript would catch many of the bugs listed above at compile time (null access, wrong argument types, missing parameters).

### 6.6 No linting or formatting config
No ESLint, Prettier, or any other code quality tooling configured. Inconsistencies like mixed quote styles and varied spacing patterns exist throughout.

---

## 7. Testing

### 7.1 Zero test coverage
There are no test files, no test runner (Jest/Vitest), and no testing libraries in dependencies. For a project with complex game logic and financial calculations (payouts, odds), this is a significant risk.

**Priority tests to add:**
- `BlackjackEngine`: hand value calculation, blackjack detection, split/double down payout math, shoe reshuffling
- `CrapsEngine`: every bet type's win/loss/push conditions, odds payout calculations, phase transitions
- `walletStore`: deposit/withdraw race conditions, negative balance prevention
- `provablyFair`: deterministic output for same seeds, uniform distribution of deck shuffle

---

## 8. Security & Integrity

### 8.1 Client-side "provably fair" has no server component
The server seed and client seed are both generated in the browser. A user can open DevTools, read both seeds, and predict every future outcome. The provably fair system provides no actual integrity guarantee without a real server.

### 8.2 Wallet balance stored in plaintext localStorage
Users can open DevTools and run `localStorage.setItem('casino_wallet', JSON.stringify({balance: 999999}))` to give themselves unlimited chips. If this is for entertainment only, that's fine — but it should be documented as such.

### 8.3 No rate limiting on bet placement
A script could place bets and roll dice programmatically at high speed. For a client-only app this isn't critical, but if any backend is ever added, this becomes exploitable.

---

## 9. Build, Deployment & DevOps

### 9.1 No environment-based configuration
The base path `/casino/` is hardcoded in `vite.config.js`. If deployed anywhere other than GitHub Pages at that exact path, it breaks. Should use an environment variable.

### 9.2 No CI checks beyond deployment
The GitHub Actions workflow only builds and deploys. No linting, type checking, or test execution step. Broken code can deploy to production.

### 9.3 No source maps in production
The Vite config doesn't configure source maps. Production errors will be undebuggable.

### 9.4 No PWA support
A casino app is a good candidate for a Progressive Web App — installable, works offline (already fully client-side), with push notifications for "daily bonus" features.

### 9.5 External font loaded without fallback
**File:** `src/index.css:1`
The Google Fonts import for Inter is render-blocking. If the CDN is slow or unavailable, the page appears blank until timeout. Use `font-display: swap` or self-host the font.

---

## 10. Missing Features That Would Add Significant Value

| Feature | Impact | Effort |
|---------|--------|--------|
| **Roulette game** | High — most requested casino game | Medium |
| **Poker (Texas Hold'em)** | High — deep gameplay | High |
| **Statistics dashboard** | Medium — track win rate, biggest win, session P&L | Low |
| **Bet history panel** | Medium — shows recent bets and outcomes | Low |
| **Sound effects** | Medium — drastically improves immersion | Low |
| **Keyboard shortcuts** | Medium — H for hit, S for stand, D for double | Low |
| **Animation speed settings** | Low — the setting exists in storage but does nothing | Low |
| **Dark/light theme toggle** | Low — the setting exists in storage but does nothing | Medium |
| **Multiplayer (WebSocket)** | High — social craps is the real experience | Very High |
| **Daily bonus chips** | Medium — increases return visits | Low |
| **Achievement system** | Medium — gamification of the gamification | Medium |
| **Seed verification UI** | Low — let players actually verify past hands | Low |

---

## Summary

| Category | Issues Found |
|----------|-------------|
| Bugs & Correctness | 8 |
| Accessibility | 6 |
| Mobile & Responsive | 5 |
| Performance | 5 |
| User Experience | 10 |
| Code Quality | 6 |
| Testing | 1 (critical) |
| Security | 3 |
| Build & DevOps | 5 |
| Missing Features | 12 |
| **Total** | **61** |

The highest-priority items are the **payout bugs** (sections 1.1, 1.2, 1.6, 1.8), **missing hand value display** (5.1), and **adding a test suite** (7.1). These directly affect game correctness and player trust.
