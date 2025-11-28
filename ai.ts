import { Position, CellContent, Player, Difficulty, BOARD_SIZE } from './types';
import { getValidNeighbors, checkTigerTrapWin } from './constants';

interface Move {
  from: Position | null; // null for placement
  to: Position;
  score?: number;
}

// Heuristic weights
const WEIGHTS = {
  TIGER_CAPTURE: 1000,
  TIGER_TRAPPED: -500,
  TIGER_MOBILITY: 10,
  GOAT_SAFE: 20,
  GOAT_VULNERABLE: -50,
  GOAT_BLOCKING: 30,
};

// Check if a tiger at 'pos' can capture a goat at 'goatPos' by jumping to 'landingPos'
function canCapture(board: CellContent[][], tigerPos: Position, goatPos: Position): Position | null {
  const dr = goatPos.r - tigerPos.r;
  const dc = goatPos.c - tigerPos.c;
  const landR = goatPos.r + dr;
  const landC = goatPos.c + dc;

  if (landR >= 0 && landR < BOARD_SIZE && landC >= 0 && landC < BOARD_SIZE) {
    if (board[landR][landC] === null) {
      return { r: landR, c: landC };
    }
  }
  return null;
}

// Get all possible moves for a player
function getAllMoves(board: CellContent[][], player: Player, phase: 'PLACEMENT' | 'MOVEMENT'): Move[] {
  const moves: Move[] = [];

  if (player === 'GOAT' && phase === 'PLACEMENT') {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === null) {
          moves.push({ from: null, to: { r, c } });
        }
      }
    }
  } else {
    // Movement phase (or Tiger phase)
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === player) {
          const neighbors = getValidNeighbors({ r, c });
          
          for (const n of neighbors) {
            // Normal move
            if (board[n.r][n.c] === null) {
              moves.push({ from: { r, c }, to: n });
            }
            
            // Tiger Capture move
            if (player === 'TIGER' && board[n.r][n.c] === 'GOAT') {
              const landing = canCapture(board, { r, c }, n);
              if (landing) {
                moves.push({ from: { r, c }, to: landing });
              }
            }
          }
        }
      }
    }
  }
  return moves;
}

// Evaluate board state
function evaluateBoard(board: CellContent[][], activePlayer: Player, goatsCaptured: number): number {
  let score = 0;

  // Basic material score (High priority)
  if (activePlayer === 'TIGER') {
    score += goatsCaptured * WEIGHTS.TIGER_CAPTURE;
  } else {
    score -= goatsCaptured * WEIGHTS.TIGER_CAPTURE;
  }

  // Mobility and Traps
  let tigerMobility = 0;
  let trappedTigers = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell === 'TIGER') {
        const moves = getValidNeighbors({ r, c });
        let canMove = false;
        let localMobility = 0;
        
        for (const m of moves) {
            if (board[m.r][m.c] === null) {
                canMove = true;
                localMobility++;
            } else if (board[m.r][m.c] === 'GOAT') {
                if (canCapture(board, {r,c}, m)) {
                    canMove = true;
                    localMobility += 2; // Captures are good mobility
                }
            }
        }
        tigerMobility += localMobility;
        if (!canMove) trappedTigers++;
      }
    }
  }

  // Adjust score based on perspective
  const trapScore = trappedTigers * WEIGHTS.TIGER_TRAPPED; // Negative for tiger
  const mobilityScore = tigerMobility * WEIGHTS.TIGER_MOBILITY;

  if (activePlayer === 'TIGER') {
    score += trapScore + mobilityScore;
  } else {
    score -= trapScore + mobilityScore;
  }

  // Random small factor to break ties and make AI less robotic
  score += Math.random() * 5;

  return score;
}

// Apply a move to a temporary board
function applyMove(board: CellContent[][], move: Move, player: Player): { newBoard: CellContent[][], captured: boolean } {
  const newBoard = board.map(row => [...row]);
  let captured = false;

  if (move.from) {
    newBoard[move.from.r][move.from.c] = null;
    
    // Check capture
    if (player === 'TIGER') {
      const dr = Math.abs(move.to.r - move.from.r);
      const dc = Math.abs(move.to.c - move.from.c);
      if (dr === 2 || dc === 2) {
        const midR = (move.from.r + move.to.r) / 2;
        const midC = (move.from.c + move.to.c) / 2;
        if (newBoard[midR][midC] === 'GOAT') {
          newBoard[midR][midC] = null;
          captured = true;
        }
      }
    }
  }
  
  newBoard[move.to.r][move.to.c] = player;
  return { newBoard, captured };
}

// Main AI function
export const getBestMove = async (
  board: CellContent[][],
  player: Player,
  phase: 'PLACEMENT' | 'MOVEMENT',
  difficulty: Difficulty,
  goatsCaptured: number
): Promise<Move | null> => {
  
  const moves = getAllMoves(board, player, phase);
  if (moves.length === 0) return null;

  // Easy: Random valid move (maybe slightly biased towards capture if Tiger)
  if (difficulty === 'EASY') {
    // Even easy AI should take a free capture if available, otherwise it's too frustratingly dumb
    if (player === 'TIGER') {
        const captureMoves = moves.filter(m => m.from && (Math.abs(m.to.r - m.from.r) === 2 || Math.abs(m.to.c - m.from.c) === 2));
        if (captureMoves.length > 0) {
            return captureMoves[Math.floor(Math.random() * captureMoves.length)];
        }
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Medium/Hard: Use Minimax
  // Medium = Depth 2, Hard = Depth 3 or 4
  const depth = difficulty === 'MEDIUM' ? 2 : 4;
  
  let bestScore = -Infinity;
  let bestMove: Move | null = null;
  const alpha = -Infinity;
  const beta = Infinity;

  for (const move of moves) {
    const { newBoard, captured } = applyMove(board, move, player);
    const newCapturedCount = goatsCaptured + (captured ? 1 : 0);
    
    // Opponent is minimizing player
    const score = minimax(newBoard, depth - 1, alpha, beta, false, player === 'TIGER' ? 'GOAT' : 'TIGER', phase === 'PLACEMENT' && player === 'GOAT', newCapturedCount, player);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
};

function minimax(
  board: CellContent[][], 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean, 
  currentPlayer: Player, 
  isPlacementPhase: boolean,
  goatsCaptured: number,
  rootPlayer: Player // The player the AI started as
): number {
  
  // Terminal conditions
  if (checkTigerTrapWin(board)) return rootPlayer === 'GOAT' ? 10000 : -10000;
  // Note: We don't strictly check exact capture count win here because it varies, 
  // but we assume high capture count is winning for Tiger.
  if (goatsCaptured >= 5) return rootPlayer === 'TIGER' ? 10000 : -10000;
  
  if (depth === 0) {
    return evaluateBoard(board, rootPlayer, goatsCaptured);
  }

  const moves = getAllMoves(board, currentPlayer, isPlacementPhase ? 'PLACEMENT' : 'MOVEMENT');
  
  // If no moves available
  if (moves.length === 0) {
      // If Tiger has no moves, Goat wins.
      if (currentPlayer === 'TIGER') return rootPlayer === 'GOAT' ? 10000 : -10000;
      // If Goat has no moves (rare/impossible in standard play if placement done?), treat as neutral or loss
      return 0;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const { newBoard, captured } = applyMove(board, move, currentPlayer);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, currentPlayer === 'TIGER' ? 'GOAT' : 'TIGER', isPlacementPhase, goatsCaptured + (captured ? 1 : 0), rootPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const { newBoard, captured } = applyMove(board, move, currentPlayer);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, currentPlayer === 'TIGER' ? 'GOAT' : 'TIGER', isPlacementPhase, goatsCaptured + (captured ? 1 : 0), rootPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
