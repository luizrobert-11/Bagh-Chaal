
import React, { useState, useEffect, useRef } from 'react';
import { Position, CellContent, Player } from '../types';

interface BoardProps {
  board: CellContent[][];
  validMoves: Position[];
  selectedPiece: Position | null;
  onCellClick: (r: number, c: number) => void;
}

const BOARD_SIZE = 5;
const GRID_START = 10;
const GRID_STEP = 20;
const GRID_END = 90;

const TigerHead = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
    <circle cx="20" cy="25" r="12" fill="#f97316" stroke="#9a3412" strokeWidth="3" />
    <circle cx="80" cy="25" r="12" fill="#f97316" stroke="#9a3412" strokeWidth="3" />
    <circle cx="20" cy="25" r="6" fill="#7c2d12" />
    <circle cx="80" cy="25" r="6" fill="#7c2d12" />
    <circle cx="50" cy="50" r="42" fill="#fb923c" stroke="#9a3412" strokeWidth="3" />
    <path d="M50 10 L45 25 L55 25 Z" fill="#3f3f46" />
    <path d="M30 15 L25 30 L35 28 Z" fill="#3f3f46" transform="rotate(-20 30 15)" />
    <path d="M70 15 L65 28 L75 30 Z" fill="#3f3f46" transform="rotate(20 70 15)" />
    <path d="M8 50 L18 45 L18 55 Z" fill="#3f3f46" />
    <path d="M92 50 L82 45 L82 55 Z" fill="#3f3f46" />
    <ellipse cx="50" cy="65" rx="18" ry="14" fill="#ffedd5" />
    <path d="M44 60 L56 60 L50 68 Z" fill="#1f2937" />
    <path d="M50 68 L50 75 M40 70 Q50 80 60 70" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="35" cy="45" rx="6" ry="8" fill="white" />
    <ellipse cx="65" cy="45" rx="6" ry="8" fill="white" />
    <circle cx="35" cy="45" r="3" fill="black" />
    <circle cx="65" cy="45" r="3" fill="black" />
  </svg>
);

const GoatHead = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
    <ellipse cx="15" cy="45" rx="12" ry="6" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" transform="rotate(20 15 45)" />
    <ellipse cx="85" cy="45" rx="12" ry="6" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" transform="rotate(-20 85 45)" />
    <path d="M35 30 Q20 10 10 25" fill="none" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
    <path d="M65 30 Q80 10 90 25" fill="none" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
    <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#e5e7eb" strokeWidth="3" />
    <circle cx="35" cy="48" r="5" fill="#1f2937" />
    <circle cx="65" cy="48" r="5" fill="#1f2937" />
    <ellipse cx="50" cy="65" rx="12" ry="10" fill="#fce7f3" />
    <path d="M46 65 Q50 68 54 65" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface VisualPiece {
  id: number;
  type: Player;
  r: number;
  c: number;
}

const Board: React.FC<BoardProps> = ({ board, validMoves, selectedPiece, onCellClick }) => {
  const lines = [];
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    const pos = GRID_START + i * GRID_STEP;
    lines.push(
      <line 
        key={`h-${i}`} x1={GRID_START} y1={pos} x2={GRID_END} y2={pos} 
        stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" 
        className="text-amber-900/40 dark:text-amber-200/20"
      />
    );
    lines.push(
      <line 
        key={`v-${i}`} x1={pos} y1={GRID_START} x2={pos} y2={GRID_END} 
        stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"
        className="text-amber-900/40 dark:text-amber-200/20"
      />
    );
  }

  for (let r = 0; r < BOARD_SIZE - 1; r++) {
    for (let c = 0; c < BOARD_SIZE - 1; c++) {
        const x1 = GRID_START + c * GRID_STEP;
        const y1 = GRID_START + r * GRID_STEP;
        const x2 = GRID_START + (c + 1) * GRID_STEP;
        const y2 = GRID_START + (r + 1) * GRID_STEP;
        lines.push(
            <line 
                key={`d1-${r}-${c}`} x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke="currentColor" strokeWidth="0.4" 
                className="text-amber-900/20 dark:text-amber-200/10"
            />
        );
        lines.push(
            <line 
                key={`d2-${r}-${c}`} x1={x2} y1={y1} x2={x1} y2={y2} 
                stroke="currentColor" strokeWidth="0.4" 
                className="text-amber-900/20 dark:text-amber-200/10"
            />
        );
    }
  }

  const getPercent = (idx: number) => `${GRID_START + idx * GRID_STEP}%`;

  const [visualPieces, setVisualPieces] = useState<VisualPiece[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    const newBoardPieces: {r: number, c: number, type: Player}[] = [];
    board.forEach((row, r) => row.forEach((cell, c) => {
      if (cell) newBoardPieces.push({ r, c, type: cell });
    }));

    setVisualPieces(prev => {
       const nextVisuals: VisualPiece[] = [];
       const usedNewIndices = new Set<number>();
       prev.forEach(p => {
         const matchIndex = newBoardPieces.findIndex((n, idx) => 
            !usedNewIndices.has(idx) && n.r === p.r && n.c === p.c && n.type === p.type
         );
         if (matchIndex !== -1) {
           usedNewIndices.add(matchIndex);
           nextVisuals.push(p); 
         }
       });
       const leftoversPrev = prev.filter(p => !nextVisuals.includes(p));
       leftoversPrev.forEach(p => {
          const matchIndex = newBoardPieces.findIndex((n, idx) => 
            !usedNewIndices.has(idx) && n.type === p.type
          );
          if (matchIndex !== -1) {
            usedNewIndices.add(matchIndex);
            const dest = newBoardPieces[matchIndex];
            nextVisuals.push({ ...p, r: dest.r, c: dest.c });
          }
       });
       newBoardPieces.forEach((n, idx) => {
         if (!usedNewIndices.has(idx)) {
           nextVisuals.push({ id: nextId.current++, type: n.type, r: n.r, c: n.c });
         }
       });
       return nextVisuals;
    });
  }, [board]);

  return (
    <div className="w-full max-w-[min(90vw,60vh)] aspect-square relative select-none flex justify-center items-center">
      <svg 
        viewBox="0 0 100 100"
        className="w-full h-full bg-amber-600 dark:bg-amber-900/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-colors duration-500 absolute top-0 left-0 z-0 border-8 border-amber-700/50 dark:border-amber-900/80"
      >
        {lines}
      </svg>
      
      <div className="w-full h-full relative z-10">
        {visualPieces.map(p => {
            const isSelected = selectedPiece?.r === p.r && selectedPiece?.c === p.c;
            return (
                <div
                    key={p.id}
                    className="absolute flex items-center justify-center pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{
                        left: getPercent(p.c),
                        top: getPercent(p.r),
                        width: '12%', 
                        height: '12%',
                        transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.4)' : 'scale(1)'}`,
                        zIndex: isSelected ? 30 : 20,
                    }}
                >
                    {p.type === 'TIGER' ? <TigerHead /> : <GoatHead />}
                </div>
            );
        })}

        {board.map((row, r) => (
            row.map((_, c) => {
                const isValidMove = validMoves.some(m => m.r === r && m.c === c);
                return (
                    <div 
                        key={`cell-${r}-${c}`}
                        onClick={() => onCellClick(r, c)}
                        className="absolute cursor-pointer rounded-full transition-colors z-10"
                        style={{
                            left: getPercent(c),
                            top: getPercent(r),
                            width: '18%',
                            height: '18%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {isValidMove && (
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-pulse" />
                            </div>
                        )}
                    </div>
                );
            })
        ))}
      </div>
    </div>
  );
};

export default Board;
