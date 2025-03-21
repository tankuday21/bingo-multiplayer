"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Check } from "lucide-react"

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
  const { theme } = useTheme()
  
  return (
    <div className="relative">
      <div
        className={cn(
          "grid gap-2 p-4 rounded-xl border shadow-lg",
          "glass",
          theme === "neon" && "bg-background/30 border-primary/30",
          theme === "galaxy" && "bg-gradient-to-br from-background/50 to-background/20 border-secondary/30",
          theme === "retro" && "border-2 border-primary",
          theme === "candy" && "bg-gradient-to-r from-background/80 via-background/50 to-background/80 border-accent/30"
        )}
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
                transition={{ 
                  duration: 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 15
                }}
                onClick={() => onCellClick(rowIndex, colIndex)}
                disabled={disabled || !isCalled || isMarked}
                className={cn(
                  "number-cell",
                  isMarked && "number-cell-marked",
                  isCurrentTurn && !isMarked && isCalled && "ring-2 ring-primary animate-pulse",
                  theme === "neon" && isMarked && "animate-float",
                  theme === "galaxy" && isMarked && "animate-pulse-glow",
                  disabled && "cursor-not-allowed opacity-75"
                )}
              >
                <AnimatePresence>
                  {isMarked && (
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className={cn(
                        "absolute inset-0 flex items-center justify-center rounded-md",
                        theme === "neon" && "bg-primary/20",
                        theme === "galaxy" && "bg-transparent",
                        theme === "retro" && "bg-primary/30",
                        theme === "candy" && "shimmer"
                      )}
                    >
                      <Check className="h-6 w-6 text-background" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className={cn(
                  "relative z-10",
                  isMarked && theme === "neon" && "text-primary-foreground drop-shadow-glow",
                  isMarked && theme === "galaxy" && "text-primary-foreground",
                  isMarked && theme === "retro" && "text-primary-foreground",
                  isMarked && theme === "candy" && "text-primary-foreground"
                )}>{cell}</span>
              </motion.button>
            )
          })
        )}
      </div>
    </div>
  )
} 