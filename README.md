# 🎰 Premium Vegas Casino

A fully-featured, responsive casino web application with a dark "Premium Vegas" aesthetic. Built with modern web technologies for a seamless, high-performance gaming experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)

## 🎮 Features

### Games

#### 🃏 Blackjack
- **Las Vegas Strip Rules**
  - 3:2 payout for natural blackjack
  - Dealer stands on soft 17
  - 6-deck shoe with automatic reshuffle at 75% depletion
- **Full Game Actions**
  - Hit, Stand, Double Down, Split
  - Multiple hand support for splits
  - Real-time hand value calculation
- **Smooth Animations**
  - Card dealing animations with Framer Motion
  - Flip animations for dealer's hidden card

#### 🎲 Craps
- **Complete Craps Implementation**
  - Come Out Roll and Point phases
  - Pass Line / Don't Pass Line bets
  - Odds bets with true odds payouts
  - Place bets with accurate multipliers
  - Field bets with 2x payout on 2 and 12
- **Accurate Payouts**
  - 4/10 Place: 9:5
  - 5/9 Place: 7:5
  - 6/8 Place: 7:6
  - Odds: True odds based on point
- **Physics-Based Dice**
  - Animated dice rolling with 3D rotation
  - Real-time result display

### 🔒 Provably Fair System

All games use a cryptographically secure provably fair system:

- **SHA-256 Hashing**: Uses Web Crypto API for secure randomness
- **Seed System**:
  - Server Seed (hidden until reveal)
  - Client Seed (user-controlled)
  - Nonce (incrementing counter)
- **Verifiable Outcomes**: All game results can be independently verified
- **Deck Shuffling**: Provably fair Fisher-Yates shuffle for blackjack
- **Dice Generation**: Cryptographically secure dice rolls

### 💰 Wallet System

- **Local Storage Persistence**: Balance and game history saved across sessions
- **Starting Balance**: New players receive $1,000 in free chips
- **Real-time Updates**: Balance updates instantly after each game
- **Reset Functionality**: Ability to reset balance to starting amount
- **Transaction History**: Full history of all games played

### 🎨 Design & UI

- **Dark Vegas Theme**
  - Deep forest green felt (#064e3b)
  - Charcoal backgrounds (#1f2937)
  - Gold accents (#fbbf24)
  - Casino red highlights (#dc2626)
- **Responsive Design**: Optimized for all screen sizes
- **Smooth Animations**: Framer Motion for all interactions
- **Custom Components**:
  - Animated playing cards
  - 3D dice with realistic rotation
  - Casino chips with authentic styling
  - Professional betting layouts

## 🏗️ Architecture

```
casino/
├── src/
│   ├── components/         # React components
│   │   ├── blackjack/      # Blackjack game UI
│   │   ├── craps/          # Craps game UI
│   │   ├── layout/         # Header, navigation, etc.
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   │   ├── useBlackjack.js # Blackjack game logic hook
│   │   └── useCraps.js     # Craps game logic hook
│   ├── lib/                # Game engines
│   │   ├── blackjack.js    # Blackjack engine class
│   │   └── craps.js        # Craps engine class
│   ├── stores/             # Zustand state management
│   │   ├── walletStore.js  # Wallet state
│   │   └── gameStore.js    # Game history state
│   ├── utils/              # Utility functions
│   │   ├── provablyFair.js # Cryptographic fair system
│   │   └── localStorage.js # Local storage helpers
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles
├── index.html              # HTML entry point
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd casino
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🎯 Usage

### Playing Blackjack

1. Select a chip value from the chip selector
2. Click "Add" to build your bet
3. Click "Deal Cards" to start the hand
4. Use Hit, Stand, Double Down, or Split as needed
5. Dealer plays automatically after you stand
6. Winnings are automatically added to your balance

### Playing Craps

1. Select a chip value
2. Click on betting areas to place bets
3. Right-click to remove bets
4. Click "Roll Dice" to roll
5. Payouts are processed automatically
6. The game transitions between Come Out and Point phases

## 🛠️ Technology Stack

### Core
- **React 18.3** - UI library
- **Vite 6.0** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework

### State Management
- **Zustand 4.5** - Lightweight state management

### Animation
- **Framer Motion 11.0** - Animation library

### Icons
- **Lucide React** - Icon library

### Cryptography
- **Web Crypto API** - Native browser cryptography for provably fair system

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## 🔐 Security

- All randomness uses Web Crypto API
- No external API calls - fully local
- No user data collection
- All data stored locally in browser

## 🎲 Game Rules

### Blackjack Rules
- Blackjack pays 3:2
- Dealer stands on all 17s
- Split any pair
- Double down on any two cards
- One card to split Aces
- No surrender

### Craps Rules
- Standard Las Vegas rules
- Pass Line wins on 7/11, loses on 2/3/12
- Don't Pass wins on 2/3, loses on 7/11, pushes on 12
- True odds on Odds bets
- Place bets pay house odds
- Field wins on 2/3/4/9/10/11/12, doubles on 2/12

## 🚧 Future Enhancements

Potential additions for future versions:

- 🎰 Slot machines
- 🔴 Roulette
- 🃏 Poker variants
- 📊 Statistics dashboard
- 🏆 Achievement system
- 🎵 Sound effects
- 🌐 Multiplayer mode
- 📱 Progressive Web App (PWA)

## 📄 License

MIT License - feel free to use this project for learning or building your own casino application.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This is a demonstration/educational project. No real money is involved. This application is for entertainment purposes only.

## 🙏 Acknowledgments

- Card designs inspired by classic Vegas casinos
- Provably fair algorithm based on industry standards
- Built with modern React best practices

---

**Enjoy responsibly!** 🎰🎲🃏
