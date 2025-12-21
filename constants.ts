
import { Position, BOARD_SIZE, CellContent, Difficulty, Player, GameMode, Rank } from './types';

// In Bagh Chaal, all nodes on the 5x5 grid are connected orthogonally.
// Additionally, all small squares have diagonals. 
export const getValidNeighbors = (pos: Position): Position[] => {
  const neighbors: Position[] = [];
  const { r, c } = pos;

  // Directions: Up, Down, Left, Right, Diagonals
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dr, dc] of directions) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      neighbors.push({ r: nr, c: nc });
    }
  }
  return neighbors;
};

// Check if a move is strictly valid between two adjacent points
export const isAdjacent = (p1: Position, p2: Position): boolean => {
  const dr = Math.abs(p1.r - p2.r);
  const dc = Math.abs(p1.c - p2.c);
  // Must be distance 1 in at least one direction, and <= 1 in both
  return (dr <= 1 && dc <= 1) && (dr + dc > 0);
};

export const INITIAL_TIGER_POSITIONS: Position[] = [
  { r: 0, c: 0 },
  { r: 0, c: 4 },
  { r: 4, c: 0 },
  { r: 4, c: 4 },
];

export const createInitialBoard = (): CellContent[][] => {
  const board: CellContent[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  INITIAL_TIGER_POSITIONS.forEach(pos => {
    board[pos.r][pos.c] = 'TIGER';
  });
  return board;
};

export const checkTigerTrapWin = (board: CellContent[][]): boolean => {
  let tigersCount = 0;
  let trappedTigers = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'TIGER') {
        tigersCount++;
        const currentPos = { r, c };
        const neighbors = getValidNeighbors(currentPos);
        let canMove = false;

        for (const n of neighbors) {
          if (board[n.r][n.c] === null) {
            canMove = true;
            break;
          }
          if (board[n.r][n.c] === 'GOAT') {
            const dr = n.r - r;
            const dc = n.c - c;
            const jumpR = n.r + dr;
            const jumpC = n.c + dc;
            if (
              jumpR >= 0 && jumpR < BOARD_SIZE &&
              jumpC >= 0 && jumpC < BOARD_SIZE &&
              board[jumpR][jumpC] === null
            ) {
              canMove = true;
              break;
            }
          }
        }
        if (!canMove) trappedTigers++;
      }
    }
  }
  return tigersCount > 0 && trappedTigers === tigersCount;
};

export const getWinCaptureCount = (difficulty: Difficulty, playerRole: Player, gameMode: GameMode): number => {
  if (gameMode === 'PVP') return 5;
  if (playerRole === 'GOAT') {
    switch (difficulty) {
      case 'HARD': return 3;
      case 'MEDIUM': return 5;
      case 'EASY': return 7;
    }
  } else {
    switch (difficulty) {
      case 'EASY': return 3;
      case 'MEDIUM': return 5;
      case 'HARD': return 7;
    }
  }
};

export interface RankInfo {
  id: Rank;
  name: string;
  maxExp: number;
  color: string;
}

export const RANKS: RankInfo[] = [
  { id: 'BRONZE', name: 'Bronze', maxExp: 100, color: '#cd7f32' },
  { id: 'COPPER', name: 'Copper', maxExp: 250, color: '#b87333' },
  { id: 'SILVER', name: 'Silver', maxExp: 500, color: '#c0c0c0' },
  { id: 'GOLD', name: 'Gold', maxExp: 1000, color: '#ffd700' },
  { id: 'DIAMOND', name: 'Diamond', maxExp: 2500, color: '#b9f2ff' },
  { id: 'MASTER_I', name: 'Master I', maxExp: 3500, color: '#ff4500' },
  { id: 'MASTER_II', name: 'Master II', maxExp: 5000, color: '#ff0000' },
  { id: 'MASTER_III', name: 'Master III', maxExp: 7000, color: '#8b0000' },
  { id: 'PROFESSIONAL', name: 'Professional', maxExp: 10000, color: '#1a1a1a' },
];

export const getNextRank = (current: Rank): Rank | null => {
  const idx = RANKS.findIndex(r => r.id === current);
  if (idx === -1 || idx === RANKS.length - 1) return null;
  return RANKS[idx + 1].id;
};

export const getRankInfo = (rank: Rank): RankInfo => {
  return RANKS.find(r => r.id === rank) || RANKS[0];
};

export const calculateExpGain = (difficulty: Difficulty, result: 'WIN' | 'LOSS', playerRole: Player): number => {
  if (result === 'LOSS') return 0;
  
  // Sheep (GOAT)
  if (playerRole === 'GOAT') {
    switch (difficulty) {
      case 'EASY': return 3;
      case 'MEDIUM': return 5;
      case 'HARD': return 10;
    }
  } 
  // Tiger
  else {
    switch (difficulty) {
      case 'EASY': return 1;
      case 'MEDIUM': return 3;
      case 'HARD': return 6;
    }
  }
};

export const getUndoLimit = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case 'EASY': return 5;
    case 'MEDIUM': return 3;
    case 'HARD': return 1;
  }
};

// --- SOUND SYNTHESIS UTILITIES ---

let audioCtx: AudioContext | null = null;

const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playSound = (type: 'place' | 'capture' | 'win' | 'lose', isMuted: boolean) => {
  if (isMuted) return;
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  
  if (type === 'place') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.1);
  } else if (type === 'capture') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.2);
  } else if (type === 'win') {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  } else if (type === 'lose') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.5);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.5);
  }
};
