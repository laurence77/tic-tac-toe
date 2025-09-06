# Tic-Tac-Toe Classic

A classic Tic-Tac-Toe game built with Phaser 3 and TypeScript.

## Features
- Classic 3x3 grid gameplay
- Player vs Player mode
- Clean, minimalist design
- Responsive game board
- Win detection and game state management
- Reset functionality

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
This starts a development server with hot reloading at `http://localhost:3000`

### Build
```bash
npm run build
```
Creates a production build in the `public` folder.

### Scripts
- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production

## Game Rules
1. The game is played on a 3x3 grid
2. Players take turns placing X's and O's
3. The first player to get 3 marks in a row (horizontal, vertical, or diagonal) wins
4. If all 9 squares are filled and no player has won, the game is a draw

## Technology Stack
- **Phaser 3** - Game framework
- **TypeScript** - Programming language
- **ESBuild** - Build tool and development server

## Project Structure
```
tic-tac-toe/
├── src/
│   ├── main.ts          # Game entry point
│   ├── scenes/          # Game scenes
│   └── game/            # Game logic
├── public/
│   ├── index.html       # HTML template
│   └── assets/          # Game assets
└── package.json         # Project configuration
```