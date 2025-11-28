
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, Player, TOTAL_GOATS, BOARD_SIZE, GameConfig, GameHistorySnapshot } from '../types';
import { createInitialBoard, getValidNeighbors, checkTigerTrapWin, getWinCaptureCount, calculateExpGain, getUndoLimit } from '../constants';
import { getBestMove } from '../ai';
import Board from './Board';

interface GameProps {
  onBack: () => void;
  config: GameConfig;
  onGameEnd: (exp: number) => void;
}

const Game: React.FC<GameProps> = ({ onBack, config, onGameEnd }) => {
  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    turn: 'GOAT',
    goatsPlaced: 0,
    goatsCaptured: 0,
    winner: null,
    phase: 'PLACEMENT',
    selectedPiece: null,
    message: config.gameMode === 'PVP' ? 'Place a Goat to start' : 'Place a Goat to start',
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
            if (move.from === null) {
                // Placement
                handleMoveExecution(null, move.to);
            } else {
                // Movement
                handleMoveExecution(move.from, move.to);
            }
        } else {
            console.warn("AI has no moves");
        }
        setIsAiThinking(false);
      };
      performAiMove();
    }
  }, [turn, winner, phase, board, config, goatsCaptured]);

  // Handle Game End EXP Awarding
  useEffect(() => {
    if (winner && config.gameMode === 'AI') {
        const isWin = winner === config.playerRole;
        const exp = calculateExpGain(config.difficulty, isWin ? 'WIN' : 'LOSS');
        onGameEnd(exp);
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
        // 1. Walk
        if (board[n.r][n.c] === null) {
          moves.push(n);
        } 
        // 2. Capture Jump
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
        message: 'Choose a destination'
      }));
      return;
    }

    if (selectedPiece && clickedContent === null) {
      const validMoves = getValidMovesForSelection(selectedPiece);
      const isMoveValid = validMoves.some(m => m.r === r && m.c === c);

      if (isMoveValid) {
        handleMoveExecution(selectedPiece, { r, c });
      } else {
        setGameState(prev => ({ ...prev, selectedPiece: null, message: 'Invalid Move' }));
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || undoCount <= 0) return;

    const lastState = history[history.length - 1];
    
    // In AI mode, we'd theoretically need to undo 2 moves (AI + Player), 
    // but the prompt specifically asked for this feature "when 2 player are playing".
    // So we will implement single step undo for PVP.
    
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
      message: 'Move Reversed'
    }));
  };

  const handleMoveExecution = (from: Position | null, to: Position) => {
    // 1. Save History Snapshot before modifying state
    const historySnapshot: GameHistorySnapshot = {
        board: board.map(r => [...r]), // Deep copy board
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

    let newGoatsPlaced = goatsPlaced;
    if (phase === 'PLACEMENT' && turn === 'GOAT') {
        newGoatsPlaced++;
    }

    let newGoatsCaptured = goatsCaptured + (captured ? 1 : 0);
    let newWinner: Player | null = null;
    let newMessage = '';

    if (newGoatsCaptured >= winCaptureCount) {
        newWinner = 'TIGER';
        newMessage = `Tigers Win! ${newGoatsCaptured} Goats Eaten.`;
    }

    if (!newWinner && checkTigerTrapWin(newBoard)) {
        newWinner = 'GOAT';
        newMessage = 'Goats Win! All Tigers Trapped.';
    }

    let nextPhase = phase;
    if (newGoatsPlaced >= TOTAL_GOATS) {
        nextPhase = 'MOVEMENT';
    }

    const nextTurn = turn === 'GOAT' ? 'TIGER' : 'GOAT';

    if (!newWinner) {
        if (config.gameMode === 'PVP') {
             newMessage = nextTurn === 'GOAT' ? "Goat's Turn" : "Tiger's Turn";
             if (nextTurn === 'GOAT' && nextPhase === 'PLACEMENT') {
                 newMessage += ` (Place ${newGoatsPlaced + 1}/${TOTAL_GOATS})`;
             }
        } else {
            if (nextTurn === config.playerRole) {
                newMessage = "Your Turn";
            } else {
                newMessage = "AI Thinking...";
            }
            if (nextTurn === 'GOAT' && nextPhase === 'PLACEMENT') {
                 newMessage += ` (Place ${newGoatsPlaced + 1}/${TOTAL_GOATS})`;
            }
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
        history: [...prev.history, historySnapshot], // Push snapshot
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
        message: config.gameMode === 'PVP' 
            ? 'Place a Goat to start' 
            : (config.playerRole === 'GOAT' ? 'Place a Goat to start' : 'AI is placing...'),
        history: [],
        undoCount: getUndoLimit(config.difficulty),
    });
  };

  useEffect(() => {
     if (config.gameMode === 'AI' && gameState.goatsPlaced === 0 && gameState.turn === 'GOAT' && config.playerRole === 'TIGER' && !winner && !isAiThinking) {
        // AI Effect handles this
     }
  }, []);

  const currentValidMoves = selectedPiece ? getValidMovesForSelection(selectedPiece) : [];

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-4 bg-gray-100 dark:bg-gray-900 overflow-y-auto">
      
      {/* Header */}
      <div className="w-full max-w-[500px] flex justify-between items-center mb-4">
         <button onClick={onBack} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg font-bold text-sm">
            Exit
         </button>
         <div className="flex flex-col items-center">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Bagh Chaal</h2>
             <span className="text-xs text-gray-500 uppercase">{config.gameMode === 'PVP' ? '2 Player' : `${config.difficulty} Mode`}</span>
         </div>
         <button onClick={restartGame} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm">
            Restart
         </button>
      </div>

      {/* Stats Bar */}
      <div className="w-full max-w-[500px] flex justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6 border dark:border-gray-700">
         <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">Captured</span>
            <div className="text-2xl font-black text-red-500">{goatsCaptured} / {winCaptureCount}</div>
         </div>
         <div className="flex flex-col items-center justify-center">
            <div className={`px-4 py-1 rounded-full text-sm font-bold ${turn === 'TIGER' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-700'}`}>
                {winner ? 'GAME OVER' : (turn === 'TIGER' ? 'TIGER TURN' : 'GOAT TURN')}
            </div>
            {phase === 'PLACEMENT' && !winner && <span className="text-xs mt-1 text-gray-500">Placing {goatsPlaced}/{TOTAL_GOATS}</span>}
         </div>
         <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">In Play</span>
            <div className="text-2xl font-black text-gray-700 dark:text-gray-200">{goatsPlaced - goatsCaptured}</div>
         </div>
      </div>

      {/* Info Message & Undo */}
      <div className="w-full max-w-[500px] flex justify-between items-center mb-4">
        <div className={`text-lg font-semibold animate-pulse ${winner ? (winner === 'TIGER' ? 'text-red-500' : 'text-green-500') : 'text-gray-600 dark:text-gray-300'}`}>
            {message}
        </div>
        {config.gameMode === 'PVP' && !winner && (
            <button 
                onClick={handleUndo} 
                disabled={undoCount <= 0 || history.length === 0}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                    undoCount > 0 && history.length > 0
                    ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                    : 'border-gray-300 text-gray-400 cursor-not-allowed'
                }`}
            >
                Undo ({undoCount})
            </button>
        )}
      </div>

      {/* Board */}
      <div className="relative">
        <Board 
            board={board} 
            validMoves={currentValidMoves} 
            selectedPiece={selectedPiece}
            onCellClick={handleCellClick}
        />
        {isAiThinking && !winner && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/10 rounded-xl backdrop-blur-[1px]">
                <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-xl flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-2">Thinking</span>
                </div>
            </div>
        )}
      </div>

      {!winner && (
        <div className="mt-8 text-center text-sm text-gray-400 max-w-sm">
            {turn === 'TIGER' 
                ? "Tigers can jump over Goats to capture them." 
                : (phase === 'PLACEMENT' ? "Place Goats on empty intersections." : "Move Goats to adjacent spots to block Tigers.")}
        </div>
      )}

      {/* Win Modal Overlay */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce">
                <h3 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">
                    {winner === 'TIGER' ? 'TIGERS WIN!' : 'GOATS WIN!'}
                </h3>
                <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">
                    {winner === 'TIGER' ? 'The herd has been decimated.' : 'The predators are trapped.'}
                    {config.gameMode === 'AI' && winner === config.playerRole && (
                        <span className="block mt-2 font-bold text-blue-500">
                             +{calculateExpGain(config.difficulty, 'WIN')} EXP
                        </span>
                    )}
                    {config.gameMode === 'AI' && winner !== config.playerRole && (
                        <span className="block mt-2 font-bold text-gray-400">
                             +10 EXP (Participation)
                        </span>
                    )}
                </p>
                <button 
                    onClick={restartGame}
                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg"
                >
                    Play Again
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default Game;
