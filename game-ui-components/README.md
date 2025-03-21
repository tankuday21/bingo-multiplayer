# Bingo Game UI Components

A collection of React components for building a Bingo game interface.

## Installation

```bash
npm install game-ui-components
# or
yarn add game-ui-components
# or
pnpm add game-ui-components
```

## Dependencies

This package requires the following peer dependencies:

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "framer-motion": "^12.5.0",
  "sonner": "^1.5.0",
  "tailwindcss": "^3.4.11"
}
```

## Setup

1. Add the required Tailwind CSS configuration:

```js
// tailwind.config.js
module.exports = {
  content: [
    // ... your content configuration
    "./node_modules/game-ui-components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'bingo-green': '#22c55e',
        'bingo-blue': '#3b82f6'
      }
    }
  }
}
```

2. Wrap your app with the GameProvider:

```jsx
import { GameProvider } from 'game-ui-components';

function App() {
  return (
    <GameProvider>
      {/* Your app content */}
    </GameProvider>
  );
}
```

## Usage

```jsx
import { BingoGrid, useGame } from 'game-ui-components';

function BingoGame() {
  return (
    <div>
      <BingoGrid />
    </div>
  );
}
```

## Components

### BingoGrid

The main Bingo game board component that displays the grid of numbers and handles player interactions.

### GameProvider

Context provider that manages the game state and provides game-related functions.

## Hooks

### useGame

A hook to access the game state and functions:

```jsx
const { state, markNumber, endGame } = useGame();
```

### useIsMobile

A hook to detect if the current device is mobile:

```jsx
const isMobile = useIsMobile();
```

## Styling

The components use Tailwind CSS for styling. Make sure to include the necessary Tailwind CSS setup in your project.

## License

MIT 