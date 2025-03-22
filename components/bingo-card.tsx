"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BingoCardProps {
  grid: number[][]
  markedCells: boolean[][]
  onCellClick: (row: number, col: number) => void
  isCurrentTurn: boolean
  disabled: boolean
}

export function BingoCard({
  grid,
  markedCells,
  onCellClick,
  isCurrentTurn,
  disabled,
}: BingoCardProps) {
  return (
    <div className="grid grid-cols-5 gap-2 p-4 bg-card rounded-lg border shadow-lg">
      {grid.map((row, rowIndex) =>
        row.map((value, colIndex) => (
          <motion.button
            key={`${rowIndex}-${colIndex}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={() => onCellClick(rowIndex, colIndex)}
            disabled={disabled}
            className={cn(
              "aspect-square rounded-lg border-2 text-lg font-bold transition-colors",
              "flex items-center justify-center",
              "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              markedCells[rowIndex][colIndex]
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border",
              isCurrentTurn && !disabled && "hover:border-primary"
            )}
          >
            {value}
          </motion.button>
        ))
      )}
    </div>
  )
} 