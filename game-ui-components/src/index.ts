// Components
export { default as BingoGrid } from './components/BingoGrid';

// Context
export { GameProvider, useGame } from './context/GameContext';

// Hooks
export { useIsMobile } from './hooks/use-mobile';

// Utils
export { cn } from './lib/utils';
export { checkWinningLines, isCellInWinningLine } from './utils/gameLogic';
export type { WinningLine } from './utils/gameLogic'; 