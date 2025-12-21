
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Position, Player, TOTAL_GOATS, BOARD_SIZE, GameConfig, GameHistorySnapshot } from '../types';
import { createInitialBoard, getValidNeighbors, checkTigerTrapWin, getWinCaptureCount, calculateExpGain, getUndoLimit, playSound } from '../constants';
import { getBestMove } from '../ai';
import Board from './Board';

interface GameProps {
  onBack: () => void;
  config: GameConfig;
  onGameEnd: (exp: number) => void;
  isMuted: boolean;
}

const Game: React.FC<GameProps> = ({ onBack, config, onGameEnd, isMuted }) => {
  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    turn: 'GOAT',
    goatsPlaced: 0,
    goatsCaptured: 0,
    winner: null,
    phase: 'PLACEMENT',
    selectedPiece: null,
    message: 'Place a Goat to start',
    history: [],
    undoCount: getUndoLimit(config.difficulty),
  });
  
  const [isAiThinking, setIsAiThinking] = useState(false);
  const winCaptureCount = getWinCaptureCount(config.difficulty, config.playerRole, config.gameMode);
  
  const { board, turn, goatsPlaced, goatsCaptured, winner, phase, selectedPiece, message, history, undoCount } = gameState;

  // AI Turn Handler
  useEffect(() => {
    if (config.gameMode === 'PVP' || winner) return;

    if (turn !== config.playerRole && !isAiThinking) {
      const performAiMove = async () => {
        setIsAiThinking(true);
        await new Promise(resolve => setTimeout(resolve, 800)); 
        
        const move = await getBestMove(board, turn, phase, config.difficulty, goatsCaptured);
        
        if (move) {
            handleMoveExecution(move.from, move.to);
        }
        setIsAiThinking(false);
      };
      performAiMove();
    }
  }, [turn, winner, phase, board, config, goatsCaptured]);

  // Handle Game End EXP Awarding
  useEffect(() => {
    if (winner) {
        if (config.gameMode === 'AI') {
            const isWin = winner === config.playerRole;
            const exp = calculateExpGain(config.difficulty, isWin ? 'WIN' : 'LOSS', config.playerRole);
            onGameEnd(exp);
            playSound(isWin ? 'win' : 'lose', isMuted);
        } else {
            playSound('win', isMuted);
        }
    }
  }, [winner]);

  const getValidMovesForSelection = useCallback((pos: Position): Position[] => {
    if (!pos) return [];
    const piece = board[pos.r][pos.c];
    if (piece !== turn) return [];

    const moves: Position[] = [];
    const neighbors = getValidNeighbors(pos);

    if (piece === 'GOAT') {
      for (const n of neighbors) {
        if (board[n.r][n.c] === null) {
          moves.push(n);
        }
      }
    } else if (piece === 'TIGER') {
      for (const n of neighbors) {
        if (board[n.r][n.c] === null) {
          moves.push(n);
        } 
        else if (board[n.r][n.c] === 'GOAT') {
          const dr = n.r - pos.r;
          const dc = n.c - pos.c;
          const jumpR = n.r + dr;
          const jumpC = n.c + dc;
          if (
            jumpR >= 0 && jumpR < BOARD_SIZE &&
            jumpC >= 0 && jumpC < BOARD_SIZE &&
            board[jumpR][jumpC] === null
          ) {
            moves.push({ r: jumpR, c: jumpC });
          }
        }
      }
    }
    return moves;
  }, [board, turn]);

  const handleCellClick = (r: number, c: number) => {
    if (winner || isAiThinking) return;
    if (config.gameMode === 'AI' && turn !== config.playerRole) return;

    const clickedContent = board[r][c];
    const isMyPiece = clickedContent === turn;

    if (turn === 'GOAT' && phase === 'PLACEMENT') {
      if (clickedContent === null) {
        handleMoveExecution(null, { r, c });
      }
      return;
    }

    if (isMyPiece) {
      if (turn === 'GOAT' && phase === 'PLACEMENT') return; 
      
      setGameState(prev => ({
        ...prev,
        selectedPiece: { r, c },
        message: 'Choose destination'
      }));
      return;
    }

    if (selectedPiece && clickedContent === null) {
      const validMoves = getValidMovesForSelection(selectedPiece);
      const isMoveValid = validMoves.some(m => m.r === r && m.c === c);

      if (isMoveValid) {
        handleMoveExecution(selectedPiece, { r, c });
      } else {
        setGameState(prev => ({ ...prev, selectedPiece: null, message: 'Invalid position' }));
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || undoCount <= 0) return;
    const lastState = history[history.length - 1];
    setGameState(prev => ({
      ...prev,
      board: lastState.board,
      turn: lastState.turn,
      goatsPlaced: lastState.goatsPlaced,
      goatsCaptured: lastState.goatsCaptured,
      phase: lastState.phase,
      history: prev.history.slice(0, -1),
      undoCount: prev.undoCount - 1,
      selectedPiece: null,
      message: 'Undo successful'
    }));
  };

  const handleMoveExecution = (from: Position | null, to: Position) => {
    const historySnapshot: GameHistorySnapshot = {
        board: board.map(r => [...r]),
        turn,
        goatsPlaced,
        goatsCaptured,
        phase
    };

    const newBoard = board.map(row => [...row]);
    let currentPiece = turn;
    let captured = false;

    if (from) {
        currentPiece = newBoard[from.r][from.c] as Player;
        newBoard[from.r][from.c] = null;
        if (currentPiece === 'TIGER') {
            const dr = Math.abs(to.r - from.r);
            const dc = Math.abs(to.c - from.c);
            if (dr === 2 || dc === 2) {
                const midR = (from.r + to.r) / 2;
                const midC = (from.c + to.c) / 2;
                if (newBoard[midR][midC] === 'GOAT') {
                    newBoard[midR][midC] = null;
                    captured = true;
                }
            }
        }
    } else {
        currentPiece = 'GOAT';
    }

    newBoard[to.r][to.c] = currentPiece;

    // SFX
    if (captured) {
        playSound('capture', isMuted);
    } else {
        playSound('place', isMuted);
    }

    let newGoatsPlaced = goatsPlaced;
    if (phase === 'PLACEMENT' && turn === 'GOAT') {
        newGoatsPlaced++;
    }

    let newGoatsCaptured = goatsCaptured + (captured ? 1 : 0);
    let newWinner: Player | null = null;
    let newMessage = '';

    if (newGoatsCaptured >= winCaptureCount) {
        newWinner = 'TIGER';
        newMessage = `Tigers Win! ${newGoatsCaptured} eaten.`;
    } else if (checkTigerTrapWin(newBoard)) {
        newWinner = 'GOAT';
        newMessage = 'Goats Win! Tigers trapped.';
    }

    const nextPhase = newGoatsPlaced >= TOTAL_GOATS ? 'MOVEMENT' : 'PLACEMENT';
    const nextTurn = turn === 'GOAT' ? 'TIGER' : 'GOAT';

    if (!newWinner) {
        if (config.gameMode === 'PVP') {
             newMessage = nextTurn === 'GOAT' ? "Sheep's Turn" : "Tiger's Turn";
        } else {
            newMessage = nextTurn === config.playerRole ? "Your Turn" : "CPU Thinking...";
        }
    }

    setGameState(prev => ({
        board: newBoard,
        turn: newWinner ? turn : nextTurn,
        goatsPlaced: newGoatsPlaced,
        goatsCaptured: newGoatsCaptured,
        winner: newWinner,
        phase: nextPhase,
        selectedPiece: null,
        message: newMessage,
        history: [...prev.history, historySnapshot],
        undoCount: prev.undoCount 
    }));
  };

  const restartGame = () => {
    setGameState({
        board: createInitialBoard(),
        turn: 'GOAT',
        goatsPlaced: 0,
        goatsCaptured: 0,
        winner: null,
        phase: 'PLACEMENT',
        selectedPiece: null,
        message: 'Place a Goat to start',
        history: [],
        undoCount: getUndoLimit(config.difficulty),
    });
  };

  const currentValidMoves = selectedPiece ? getValidMovesForSelection(selectedPiece) : [];

  return (
    <div className="w-full h-full min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 overflow-y-auto px-4 py-8">
      
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 z-10">
         <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">
            <span className="text-lg">←</span>
         </button>
         <div className="flex flex-col items-center">
             <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest">Arena</h2>
             <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{config.gameMode === 'PVP' ? 'Local PVP' : `${config.difficulty} CPU`}</span>
         </div>
         <button onClick={restartGame} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">
            <span className="text-lg">↺</span>
         </button>
      </div>

      {/* Stats Board */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col space-y-4 mb-6 z-10">
         <div className="flex justify-between items-center px-2">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Casualties</span>
                <div className="flex items-center space-x-1">
                    <span className="text-2xl font-black text-red-500">{goatsCaptured}</span>
                    <span className="text-xs text-gray-400 font-bold">/ {winCaptureCount}</span>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Herd Size</span>
                <div className="flex items-center space-x-1">
                    <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{goatsPlaced - goatsCaptured}</span>
                    <span className="text-xs text-gray-400 font-bold">In Play</span>
                </div>
            </div>
         </div>

         <div className="h-px bg-gray-100 dark:bg-gray-700 w-full" />

         <div className="flex justify-between items-center px-2">
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${turn === 'TIGER' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {winner ? 'Over' : 'Tiger'}
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${turn === 'GOAT' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {winner ? 'Over' : 'Sheep'}
            </div>
         </div>
      </div>

      {/* Status & Actions */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 z-10 px-2">
        <p className={`text-sm font-black uppercase tracking-widest ${winner ? 'text-blue-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`}>
            {message}
        </p>
        {config.gameMode === 'PVP' && !winner && (
            <button 
                onClick={handleUndo} 
                disabled={undoCount <= 0 || history.length === 0}
                className={`px-4 py-2 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest ${
                    undoCount > 0 && history.length > 0
                    ? 'border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10' 
                    : 'border-gray-200 text-gray-300 cursor-not-allowed'
                }`}
            >
                Undo ({undoCount})
            </button>
        )}
      </div>

      {/* Board */}
      <div className="w-full flex-grow flex items-center justify-center relative z-10 max-h-[60vh]">
        <Board 
            board={board} 
            validMoves={currentValidMoves} 
            selectedPiece={selectedPiece}
            onCellClick={handleCellClick}
        />
        
        {isAiThinking && !winner && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl flex items-center space-x-4 border border-white/20">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest">CPU Thinking</span>
                </div>
            </div>
        )}
      </div>

      {/* Win Modal */}
      {winner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-xl p-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center w-full max-w-sm border border-white/10">
                <div className="text-6xl mb-6 transform hover:scale-110 transition-transform cursor-default">
                    {winner === 'TIGER' ? '🐯' : '🐑'}
                </div>
                <h3 className="text-3xl font-black mb-2 text-gray-900 dark:text-white uppercase tracking-tighter">
                    {winner === 'TIGER' ? 'Tigers Rule' : 'Goats Rule'}
                </h3>
                <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 font-medium text-center uppercase tracking-widest">
                    {winner === 'TIGER' ? 'Predators have feasted.' : 'Clever blocking traps them.'}
                    {config.gameMode === 'AI' && (
                        <span className={`block mt-4 font-black text-lg ${winner === config.playerRole ? 'text-blue-500' : 'text-red-400'}`}>
                            {winner === config.playerRole 
                                ? `+${calculateExpGain(config.difficulty, 'WIN', config.playerRole)} EXP` 
                                : `+0 EXP`
                            }
                        </span>
                    )}
                </p>
                <button 
                    onClick={restartGame}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                    Rematch
                </button>
                <button 
                    onClick={onBack}
                    className="w-full mt-3 py-4 text-gray-400 dark:text-gray-500 font-bold hover:text-gray-600 transition-colors uppercase text-[10px] tracking-[0.3em]"
                >
                    Main Menu
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default Game;
