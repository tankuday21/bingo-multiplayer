import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface BingoCardProps {
  grid: number[][];
  markedCells: boolean[][];
  calledNumbers: number[];
  onCellClick: (row: number, col: number) => void;
  isCurrentTurn: boolean;
  disabled: boolean;
}

export const BingoCard: React.FC<BingoCardProps> = ({
  grid,
  markedCells,
  calledNumbers,
  onCellClick,
  isCurrentTurn,
  disabled,
}) => {
  const isMobile = useIsMobile();
  const gridSize = grid.length;

  return (
    <div className="w-full max-w-2xl mx-auto px-2 md:px-4">
      <div 
        className={cn(
          "grid gap-1.5 md:gap-2 w-full aspect-square mx-auto", 
          isMobile ? "max-w-[calc(100vw-36px)]" : "max-w-lg"
        )}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`
        }}
      >
        <AnimatePresence>
          {grid.map((row, rowIndex) => (
            row.map((number, colIndex) => {
              const isMarked = markedCells[rowIndex][colIndex];
              const isCalled = calledNumbers.includes(number);
              
              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: (rowIndex * gridSize + colIndex) * 0.02 }}
                  className={cn(
                    "number-cell aspect-square flex items-center justify-center relative rounded-lg",
                    isMarked && "bg-primary/20",
                    isCalled && !isMarked && "bg-secondary/50",
                    !disabled && isCalled && !isMarked && isCurrentTurn && "cursor-pointer hover:bg-primary/10",
                    !isCalled && "bg-card"
                  )}
                  onClick={() => !disabled && isCalled && !isMarked && onCellClick(rowIndex, colIndex)}
                >
                  <span className={cn(
                    "text-base md:text-lg font-semibold",
                    isMobile && "text-sm",
                    isMarked && "text-primary",
                    !isMarked && isCalled && "text-secondary-foreground",
                    !isCalled && "text-foreground"
                  )}>
                    {number}
                  </span>
                  {isMarked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-3/4 h-3/4 rounded-full border-2 border-primary opacity-50"></div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}; 