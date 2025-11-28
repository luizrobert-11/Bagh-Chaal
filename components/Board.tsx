import React from 'react';
import { Position, CellContent, BOARD_SIZE } from '../types';

interface BoardProps {
  board: CellContent[][];
  validMoves: Position[]; // Moves for the selected piece
  selectedPiece: Position | null;
  onCellClick: (r: number, c: number) => void;
}

const CELL_SIZE = 80; 
const PADDING = 40;
const BOARD_PIXEL_SIZE = (BOARD_SIZE - 1) * CELL_SIZE + 2 * PADDING;

// --- Cartoon SVG Components ---

const TigerHead = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl filter">
    {/* Ears */}
    <circle cx="20" cy="25" r="12" fill="#f97316" stroke="#9a3412" strokeWidth="3" />
    <circle cx="80" cy="25" r="12" fill="#f97316" stroke="#9a3412" strokeWidth="3" />
    <circle cx="20" cy="25" r="6" fill="#7c2d12" />
    <circle cx="80" cy="25" r="6" fill="#7c2d12" />
    
    {/* Main Face */}
    <circle cx="50" cy="50" r="42" fill="#fb923c" stroke="#9a3412" strokeWidth="3" />
    
    {/* Stripes Top */}
    <path d="M50 10 L45 25 L55 25 Z" fill="#3f3f46" />
    <path d="M30 15 L25 30 L35 28 Z" fill="#3f3f46" transform="rotate(-20 30 15)" />
    <path d="M70 15 L65 28 L75 30 Z" fill="#3f3f46" transform="rotate(20 70 15)" />

    {/* Stripes Side */}
    <path d="M8 50 L18 45 L18 55 Z" fill="#3f3f46" />
    <path d="M92 50 L82 45 L82 55 Z" fill="#3f3f46" />

    {/* Snout Area */}
    <ellipse cx="50" cy="65" rx="18" ry="14" fill="#ffedd5" />
    
    {/* Nose */}
    <path d="M44 60 L56 60 L50 68 Z" fill="#1f2937" />
    
    {/* Mouth */}
    <path d="M50 68 L50 75 M40 70 Q50 80 60 70" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />

    {/* Eyes */}
    <ellipse cx="35" cy="45" rx="6" ry="8" fill="white" />
    <ellipse cx="65" cy="45" rx="6" ry="8" fill="white" />
    <circle cx="35" cy="45" r="3" fill="black" />
    <circle cx="65" cy="45" r="3" fill="black" />
  </svg>
);

const GoatHead = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg filter">
    {/* Ears */}
    <ellipse cx="15" cy="45" rx="12" ry="6" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" transform="rotate(20 15 45)" />
    <ellipse cx="85" cy="45" rx="12" ry="6" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" transform="rotate(-20 85 45)" />

    {/* Horns */}
    <path d="M35 30 Q20 10 10 25" fill="none" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
    <path d="M65 30 Q80 10 90 25" fill="none" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />

    {/* Face */}
    <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#e5e7eb" strokeWidth="3" />
    
    {/* Fluff Top */}
    <path d="M40 20 Q50 10 60 20" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" />

    {/* Eyes */}
    <circle cx="35" cy="48" r="5" fill="#1f2937" />
    <circle cx="65" cy="48" r="5" fill="#1f2937" />
    <circle cx="37" cy="46" r="1.5" fill="white" />
    <circle cx="67" cy="46" r="1.5" fill="white" />

    {/* Snout */}
    <ellipse cx="50" cy="65" rx="12" ry="10" fill="#fce7f3" />
    <path d="M46 65 Q50 68 54 65" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Board: React.FC<BoardProps> = ({ board, validMoves, selectedPiece, onCellClick }) => {
  // Generate the SVG Lines
  const lines = [];
  
  // Horizontal & Vertical Lines
  for (let i = 0; i < BOARD_SIZE; i++) {
    const pos = PADDING + i * CELL_SIZE;
    const limit = PADDING + (BOARD_SIZE - 1) * CELL_SIZE;
    
    // Horizontal
    lines.push(
      <line 
        key={`h-${i}`} x1={PADDING} y1={pos} x2={limit} y2={pos} 
        stroke="currentColor" strokeWidth="4" strokeLinecap="round" 
        className="text-amber-800 dark:text-amber-500"
      />
    );
    // Vertical
    lines.push(
      <line 
        key={`v-${i}`} x1={pos} y1={PADDING} x2={pos} y2={limit} 
        stroke="currentColor" strokeWidth="4" strokeLinecap="round"
        className="text-amber-800 dark:text-amber-500"
      />
    );
  }

  // Diagonals for the small squares
  // In Bagh Chaal, every 1x1 square has diagonals.
  for (let r = 0; r < BOARD_SIZE - 1; r++) {
    for (let c = 0; c < BOARD_SIZE - 1; c++) {
        const x1 = PADDING + c * CELL_SIZE;
        const y1 = PADDING + r * CELL_SIZE;
        const x2 = PADDING + (c + 1) * CELL_SIZE;
        const y2 = PADDING + (r + 1) * CELL_SIZE;

        // Top-Left to Bottom-Right
        lines.push(
            <line 
                key={`d1-${r}-${c}`} x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke="currentColor" strokeWidth="2" 
                className="text-amber-800 dark:text-amber-500 opacity-60"
            />
        );
        // Top-Right to Bottom-Left
        lines.push(
            <line 
                key={`d2-${r}-${c}`} x1={x2} y1={y1} x2={x1} y2={y2} 
                stroke="currentColor" strokeWidth="2" 
                className="text-amber-800 dark:text-amber-500 opacity-60"
            />
        );
    }
  }

  // Helper to convert board index to pixel coordinate
  const getCoord = (idx: number) => PADDING + idx * CELL_SIZE;

  return (
    <div className="relative select-none flex justify-center items-center my-4">
      {/* SVG Background Layer */}
      <svg 
        width={BOARD_PIXEL_SIZE} 
        height={BOARD_PIXEL_SIZE} 
        className="bg-amber-600 dark:bg-amber-900 rounded-xl shadow-2xl transition-colors duration-300"
      >
        <defs>
            <pattern id="woodPattern" patternUnits="userSpaceOnUse" width="100" height="100">
               {/* Could add wood grain here, but solid color is cleaner for now */}
            </pattern>
        </defs>
        {lines}
      </svg>

      {/* Interactive Layer (HTML Overlay) */}
      <div 
        className="absolute inset-0"
        style={{ width: BOARD_PIXEL_SIZE, height: BOARD_PIXEL_SIZE }}
      >
        {board.map((row, r) => (
          row.map((cell, c) => {
            const isSelected = selectedPiece?.r === r && selectedPiece?.c === c;
            const isValidMove = validMoves.some(m => m.r === r && m.c === c);
            
            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => onCellClick(r, c)}
                className="absolute flex items-center justify-center cursor-pointer hover:bg-white/10 rounded-full transition-colors"
                style={{
                  left: getCoord(c),
                  top: getCoord(r),
                  width: '60px',
                  height: '60px',
                  transform: 'translate(-50%, -50%)', // Centers the container on the node
                  zIndex: isSelected ? 20 : (cell ? 10 : 5)
                }}
              >
                {/* Click Target / Highlight for Valid Move */}
                {isValidMove && (
                    <div className="w-6 h-6 rounded-full bg-green-500/50 animate-pulse ring-4 ring-green-400/30" />
                )}

                {/* Piece Rendering */}
                {cell && (
                    <div 
                        className="w-full h-full transition-transform duration-300 ease-out"
                        style={{
                            // Scale up if selected, but pivot is center so it grows in place
                            transform: isSelected ? 'scale(1.5)' : 'scale(1)',
                            transformOrigin: 'center center',
                        }}
                    >
                        {cell === 'TIGER' ? <TigerHead /> : <GoatHead />}
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
