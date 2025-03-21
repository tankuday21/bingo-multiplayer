export interface WinningLine {
  type: 'row' | 'col' | 'diag';
  index: number;
}

export const checkWinningLines = (markedCells: boolean[][]) => {
  const size = markedCells.length;
  const winningLines: WinningLine[] = [];

  // Check rows
  for (let i = 0; i < size; i++) {
    if (markedCells[i].every(cell => cell)) {
      winningLines.push({ type: 'row', index: i });
    }
  }

  // Check columns
  for (let j = 0; j < size; j++) {
    if (markedCells.every(row => row[j])) {
      winningLines.push({ type: 'col', index: j });
    }
  }

  // Check main diagonal
  if (markedCells.every((row, i) => row[i])) {
    winningLines.push({ type: 'diag', index: 0 });
  }

  // Check anti-diagonal
  if (markedCells.every((row, i) => row[size - 1 - i])) {
    winningLines.push({ type: 'diag', index: 1 });
  }

  return { winningLines };
};

export const isCellInWinningLine = (
  row: number,
  col: number,
  winningLines: WinningLine[],
  gridSize: number
) => {
  return winningLines.some(line => {
    if (line.type === 'row' && line.index === row) return true;
    if (line.type === 'col' && line.index === col) return true;
    if (line.type === 'diag' && line.index === 0 && row === col) return true;
    if (line.type === 'diag' && line.index === 1 && row === gridSize - 1 - col) return true;
    return false;
  });
}; 