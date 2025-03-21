import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";
import { checkWinningLines, isCellInWinningLine } from '../utils/gameLogic';
import { useIsMobile } from '../hooks/use-mobile';
import { useGame } from '../context/GameContext';

const BingoGrid: React.FC = () => {
  const { state, markNumber, endGame } = useGame();
  const [winningLines, setWinningLines] = useState<{ type: 'row' | 'col' | 'diag'; index: number }[]>([]);
  const isMobile = useIsMobile();
  
  // Find the current player
  const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
  const isCurrentPlayersTurn = currentPlayer?.id === state.players[0]?.id; // For demo, first player is always the user
  
  // Get the user's grid (for demo, we'll use the first player)
  const userPlayer = state.players[0];
  
  // Check for winning lines
  useEffect(() => {
    if (userPlayer && state.gameStarted) {
      const { winningLines: lines } = checkWinningLines(userPlayer.markedCells);
      setWinningLines(lines);
      
      if (lines.length >= 5 && !state.winner) {
        // Player has won!
        toast.success("You completed 5 lines! You win!", {
          duration: 1000, // Shorter toast duration
        });
        endGame(userPlayer.username);
      }
    }
  }, [userPlayer?.markedCells, state.gameStarted, state.winner, endGame, userPlayer?.username]);
  
  // Handle cell click
  const handleCellClick = (number: number) => {
    if (!state.gameStarted) return;
    if (!isCurrentPlayersTurn) {
      toast.error("It's not your turn!", {
        duration: 1000, // Shorter toast duration
      });
      return;
    }
    
    if (state.calledNumbers.includes(number)) {
      toast.error("This number has already been called!", {
        duration: 1000, // Shorter toast duration
      });
      return;
    }
    
    markNumber(number);
  };
  
  if (!userPlayer) {
    return <div className="text-center p-10 text-foreground">Loading grid...</div>;
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto px-2 md:px-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">
          {isCurrentPlayersTurn ? (
            <span className="text-bingo-green flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-bingo-green mr-2 animate-pulse"></span>
              Your turn
            </span>
          ) : (
            <span className="text-foreground">
              {currentPlayer?.username}'s turn
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-foreground">
          Completed lines: <span className="text-bingo-blue">{winningLines.length}/5</span>
        </div>
      </div>
      
      <div 
        className={cn(
          "grid gap-1.5 md:gap-2 w-full aspect-square mx-auto", 
          isMobile ? "max-w-[calc(100vw-36px)]" : "max-w-lg"
        )}
        style={{
          gridTemplateColumns: `repeat(${state.gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${state.gridSize}, 1fr)`
        }}
      >
        <AnimatePresence>
          {userPlayer.grid.map((row, rowIndex) => (
            row.map((number, colIndex) => {
              const isMarked = userPlayer.markedCells[rowIndex][colIndex];
              const isWinningCell = isMarked && isCellInWinningLine(rowIndex, colIndex, winningLines, state.gridSize);
              
              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: (rowIndex * state.gridSize + colIndex) * 0.02 }}
                  className={cn(
                    "number-cell aspect-square flex items-center justify-center relative rounded-lg",
                    isMarked && "number-cell-marked",
                    isWinningCell && "number-cell-winning",
                    !isMarked && isCurrentPlayersTurn && "cursor-pointer hover:bg-secondary"
                  )}
                  onClick={() => !isMarked && handleCellClick(number)}
                >
                  <span className={cn("text-base md:text-lg font-semibold", isMobile && "text-sm")}>
                    {number}
                  </span>
                  {isMarked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-3/4 h-3/4 rounded-full border-2 border-white opacity-50"></div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          ))}
        </AnimatePresence>
      </div>
      
      {state.calledNumbers.length > 0 && (
        <div className="mt-4 md:mt-6 p-3 md:p-4 glass-morphism rounded-xl">
          <h3 className="text-sm font-medium mb-2 text-foreground">Called numbers</h3>
          <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
            {state.calledNumbers.map((number, index) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-primary/10 rounded-md text-xs md:text-sm font-medium text-foreground"
              >
                {number}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BingoGrid; 