"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface BingoCardProps {
  grid: number[][]
  markedCells: boolean[][]
  calledNumbers: number[]
  onCellClick: (row: number, col: number) => void
  isCurrentTurn: boolean
  disabled?: boolean
}

export function BingoCard({
  grid,
  markedCells,
  calledNumbers,
  onCellClick,
  isCurrentTurn,
  disabled = false,
}: BingoCardProps) {
  return (
    <div className="relative">
      <div
        className="grid gap-2 p-2 bg-card rounded-lg shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isMarked = markedCells[rowIndex][colIndex]
            const isCalled = calledNumbers.includes(cell)

            return (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={!disabled && isCalled && !isMarked ? { scale: 1.05 } : {}}
                whileTap={!disabled && isCalled && !isMarked ? { scale: 0.95 } : {}}
                transition={{ duration: 0.2 }}
                onClick={() => onCellClick(rowIndex, colIndex)}
                disabled={disabled || !isCalled || isMarked}
                className={cn(
                  "aspect-square flex items-center justify-center text-lg font-medium rounded-md transition-all duration-200",
                  "relative overflow-hidden",
                  isMarked
                    ? "bg-primary text-primary-foreground shadow-inner"
                    : isCalled
                      ? "bg-accent text-accent-foreground cursor-pointer hover:shadow-md"
                      : "bg-muted",
                  disabled && "cursor-not-allowed opacity-75"
                )}
              >
                <AnimatePresence>
                  {isMarked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute inset-0 bg-primary/20"
                    />
                  )}
                </AnimatePresence>
                <span className="relative z-10">{cell}</span>
                {isCurrentTurn && !isMarked && isCalled && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 border-2 border-primary rounded-md"
                  />
                )}
              </motion.button>
            )
          })
        )}
      </div>
    </div>
  )
} 