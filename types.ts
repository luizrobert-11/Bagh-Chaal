
export type Player = 'TIGER' | 'GOAT';
export type CellContent = Player | null;
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type GameMode = 'AI' | 'PVP';

export type Rank = 
  | 'BRONZE' 
  | 'COPPER' 
  | 'SILVER' 
  | 'GOLD' 
  | 'DIAMOND' 
  | 'MASTER_I' 
  | 'MASTER_II' 
  | 'MASTER_III' 
  | 'PROFESSIONAL';

export interface PlayerStats {
  rank: Rank;
  currentExp: number;
}

export interface Position {
  r: number;
  c: number;
}

export interface GameConfig {
  gameMode: GameMode;
  playerRole: Player;
  difficulty: Difficulty;
}

// Minimal state needed to restore a turn
export interface GameHistorySnapshot {
  board: CellContent[][];
  turn: Player;
  goatsPlaced: number;
  goatsCaptured: number;
  phase: 'PLACEMENT' | 'MOVEMENT';
}

export interface GameState {
  board: CellContent[][];
  turn: Player;
  goatsPlaced: number;
  goatsCaptured: number;
  winner: Player | null;
  phase: 'PLACEMENT' | 'MOVEMENT';
  selectedPiece: Position | null;
  message: string;
  history: GameHistorySnapshot[];
  undoCount: number;
}

export type View = 'LOADING' | 'MENU' | 'GAME';

export const TOTAL_GOATS = 20;
export const BOARD_SIZE = 5;
