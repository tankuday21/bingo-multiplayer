import React, { createContext, useContext, useReducer } from 'react';

interface Player {
  id: string;
  username: string;
  grid: number[][];
  markedCells: boolean[][];
}

interface GameState {
  players: Player[];
  currentPlayer: string;
  gameStarted: boolean;
  winner: string | null;
  gridSize: number;
  calledNumbers: number[];
}

interface GameContextType {
  state: GameState;
  markNumber: (number: number) => void;
  endGame: (winner: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const markNumber = (number: number) => {
    dispatch({ type: 'MARK_NUMBER', payload: { number } });
  };

  const endGame = (winner: string) => {
    dispatch({ type: 'END_GAME', payload: { winner } });
  };

  return (
    <GameContext.Provider value={{ state, markNumber, endGame }}>
      {children}
    </GameContext.Provider>
  );
};

// Initial state and reducer implementation
const initialState: GameState = {
  players: [],
  currentPlayer: '',
  gameStarted: false,
  winner: null,
  gridSize: 5,
  calledNumbers: [],
};

type GameAction =
  | { type: 'MARK_NUMBER'; payload: { number: number } }
  | { type: 'END_GAME'; payload: { winner: string } };

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'MARK_NUMBER':
      return {
        ...state,
        calledNumbers: [...state.calledNumbers, action.payload.number],
        currentPlayer: state.players[(state.players.findIndex(p => p.id === state.currentPlayer) + 1) % state.players.length].id,
      };
    case 'END_GAME':
      return {
        ...state,
        gameStarted: false,
        winner: action.payload.winner,
      };
    default:
      return state;
  }
}; 