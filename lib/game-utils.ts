export function checkWinningLines(markedCells: boolean[][]) {
  const size = markedCells.length;
  const winningLines: { type: 'row' | 'col' | 'diag'; index: number }[] = [];

  // Check rows
  for (let i = 0; i < size; i++) {
    if (markedCells[i].every((cell) => cell)) {
      winningLines.push({ type: 'row', index: i });
    }
  }

  // Check columns
  for (let i = 0; i < size; i++) {
    let columnComplete = true;
    for (let j = 0; j < size; j++) {
      if (!markedCells[j][i]) {
        columnComplete = false;
        break;
      }
    }
    if (columnComplete) {
      winningLines.push({ type: 'col', index: i });
    }
  }

  // Check main diagonal
  let mainDiagonalComplete = true;
  for (let i = 0; i < size; i++) {
    if (!markedCells[i][i]) {
      mainDiagonalComplete = false;
      break;
    }
  }
  if (mainDiagonalComplete) {
    winningLines.push({ type: 'diag', index: 0 });
  }

  // Check other diagonal
  let otherDiagonalComplete = true;
  for (let i = 0; i < size; i++) {
    if (!markedCells[i][size - 1 - i]) {
      otherDiagonalComplete = false;
      break;
    }
  }
  if (otherDiagonalComplete) {
    winningLines.push({ type: 'diag', index: 1 });
  }

  return { winningLines, isWinner: winningLines.length >= 5 };
}

export function isCellInWinningLine(
  row: number,
  col: number,
  winningLines: { type: 'row' | 'col' | 'diag'; index: number }[],
  gridSize: number
) {
  return winningLines.some((line) => {
    switch (line.type) {
      case 'row':
        return line.index === row;
      case 'col':
        return line.index === col;
      case 'diag':
        if (line.index === 0) {
          return row === col;
        } else {
          return row === gridSize - 1 - col;
        }
      default:
        return false;
    }
  });
} 