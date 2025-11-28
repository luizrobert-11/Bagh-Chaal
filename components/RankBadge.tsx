
import React from 'react';
import { Rank, } from '../types';
import { getRankInfo } from '../constants';

interface RankBadgeProps {
  rank: Rank;
  size?: 'sm' | 'lg';
}

const RankBadge: React.FC<RankBadgeProps> = ({ rank, size = 'lg' }) => {
  const info = getRankInfo(rank);
  const color = info.color;
  const dimension = size === 'sm' ? 'w-8 h-8' : 'w-24 h-24';

  // Helper to generate different shapes based on rank tiers
  const getShape = () => {
    switch (rank) {
      case 'BRONZE':
      case 'COPPER':
        return <circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="4" />;
      case 'SILVER':
      case 'GOLD':
        return <rect x="15" y="15" width="70" height="70" rx="10" fill={color} stroke="white" strokeWidth="4" transform="rotate(45 50 50)" />;
      case 'DIAMOND':
        return <path d="M50 5 L95 50 L50 95 L5 50 Z" fill={color} stroke="white" strokeWidth="4" />;
      case 'MASTER_I':
      case 'MASTER_II':
      case 'MASTER_III':
        return (
            <g>
                <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill={color} stroke="white" strokeWidth="4" />
                <text x="50" y="60" fontSize="40" fill="white" textAnchor="middle" fontWeight="bold">M</text>
            </g>
        );
      case 'PROFESSIONAL':
        return (
            <g>
               <circle cx="50" cy="50" r="48" fill={color} stroke="gold" strokeWidth="4" />
               <path d="M50 20 L60 40 L82 40 L64 55 L70 75 L50 62 L30 75 L36 55 L18 40 L40 40 Z" fill="gold" />
            </g>
        );
      default:
        return <circle cx="50" cy="50" r="45" fill={color} />;
    }
  };

  return (
    <div className={`${dimension} flex items-center justify-center drop-shadow-xl relative`} title={info.name}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
                <linearGradient id={`grad-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="black" stopOpacity="0.2" />
                </linearGradient>
            </defs>
            {getShape()}
            {/* Gloss Effect */}
            <circle cx="30" cy="30" r="15" fill="white" fillOpacity="0.2" />
        </svg>
    </div>
  );
};

export default RankBadge;
