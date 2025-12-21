
import React, { useState } from 'react';
import { Difficulty, GameConfig, Player, GameMode, PlayerStats } from '../types';
import { getRankInfo } from '../constants';
import RankBadge from './RankBadge';

interface MainMenuProps {
  onPlay: (config: GameConfig) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  stats: PlayerStats;
}

const FloatingIcon: React.FC<{ emoji: string, delay: string, left: string, top: string }> = ({ emoji, delay, left, top }) => (
    <div 
        className="absolute pointer-events-none opacity-10 dark:opacity-20 animate-bounce transition-all duration-1000"
        style={{ left, top, animationDelay: delay, fontSize: '3rem' }}
    >
        {emoji}
    </div>
);

const MainMenu: React.FC<MainMenuProps> = ({ onPlay, isDarkMode, toggleTheme, isMuted, toggleMute, stats }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('AI');
  const [selectedRole, setSelectedRole] = useState<Player>('GOAT');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('MEDIUM');

  const rankInfo = getRankInfo(stats.rank);
  const progressPercent = Math.min(100, (stats.currentExp / rankInfo.maxExp) * 100);

  const handleStart = () => {
    onPlay({
      gameMode,
      playerRole: selectedRole,
      difficulty: selectedDifficulty
    });
  };

  return (
    <div className="w-full h-full min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in relative z-10 overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
          <FloatingIcon emoji="🐯" delay="0s" left="10%" top="15%" />
          <FloatingIcon emoji="🐑" delay="1s" left="80%" top="20%" />
          <FloatingIcon emoji="🐯" delay="2.5s" left="20%" top="70%" />
          <FloatingIcon emoji="🐑" delay="1.8s" left="75%" top="65%" />
      </div>

      {/* Rank Display (Top Right) */}
      <div className="absolute top-4 right-4 flex flex-col items-end z-20">
          <div className="flex items-center space-x-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-2 pr-4 rounded-2xl shadow-xl border border-white/20">
              <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">{rankInfo.name} RANK</span>
                  <div className="w-32 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
                        style={{ width: `${progressPercent}%` }}
                      />
                  </div>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">{stats.currentExp} / {rankInfo.maxExp} XP</span>
              </div>
              <RankBadge rank={stats.rank} size="sm" />
          </div>
      </div>

      <div className="max-w-md w-full relative">
        {/* Decorative elements for the card */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-500/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>

        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center space-y-6 border border-white/20 dark:border-gray-700/50 transition-all duration-500">
            <div className="text-center">
                <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter transform hover:scale-105 transition-transform duration-300">
                    Bagh <span className="text-red-500">Chaal</span>
                </h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-[0.2em]">The ancient game of strategy</p>
            </div>
            
            {!showSettings ? (
            <>
                <div className="w-full space-y-6">
                
                {/* Game Mode */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-1 uppercase tracking-widest">Select Mode</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-100/50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setGameMode('AI')}
                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                            gameMode === 'AI' 
                                ? 'bg-white dark:bg-gray-700 shadow-lg text-purple-600 dark:text-purple-400 scale-100' 
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            vs CPU
                        </button>
                        <button
                            onClick={() => setGameMode('PVP')}
                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                            gameMode === 'PVP' 
                                ? 'bg-white dark:bg-gray-700 shadow-lg text-orange-600 dark:text-orange-400 scale-100' 
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            vs Friend
                        </button>
                    </div>
                </div>

                {gameMode === 'AI' && (
                    <div className="space-y-3 animate-fade-in">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-1 uppercase tracking-widest">Choose Side</label>
                        <div className="grid grid-cols-2 gap-2 bg-gray-100/50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setSelectedRole('GOAT')}
                                className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                selectedRole === 'GOAT' 
                                    ? 'bg-white dark:bg-gray-700 shadow-lg text-gray-900 dark:text-white' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}
                            >
                                🐑 Goats
                            </button>
                            <button
                                onClick={() => setSelectedRole('TIGER')}
                                className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                selectedRole === 'TIGER' 
                                    ? 'bg-white dark:bg-gray-700 shadow-lg text-red-500' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}
                            >
                                🐯 Tigers
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-3 animate-fade-in">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-1 uppercase tracking-widest">
                        {gameMode === 'PVP' ? 'Undo Limit' : 'Difficulty'}
                    </label>
                    <div className="grid grid-cols-3 gap-2 bg-gray-100/50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                    {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((diff) => (
                        <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                            selectedDifficulty === diff
                            ? 'bg-white dark:bg-gray-700 shadow-lg text-blue-500' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                        >
                        {diff}
                        </button>
                    ))}
                    </div>
                </div>

                </div>

                <div className="w-full space-y-3 pt-4">
                    <button 
                        onClick={handleStart}
                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-lg shadow-[0_10px_20px_-5px_rgba(59,130,246,0.5)] transform transition active:scale-95 uppercase tracking-tighter"
                    >
                        Enter the Arena
                    </button>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="w-full py-4 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-bold rounded-2xl text-sm border border-gray-100 dark:border-gray-600 transform transition active:scale-95"
                    >
                        Options
                    </button>
                </div>
            </>
            ) : (
            <div className="w-full flex flex-col space-y-6 animate-fade-in">
                <h2 className="text-xl font-black text-center text-gray-900 dark:text-white uppercase tracking-widest">Settings</h2>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-100/50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Dark Theme</span>
                        <button 
                            onClick={toggleTheme}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-100/50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Game Audio</span>
                        <button 
                            onClick={toggleMute}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors ${
                                !isMuted ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                            }`}
                        >
                            {!isMuted ? 'On' : 'Off'}
                        </button>
                    </div>
                </div>

                <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl shadow-md uppercase tracking-widest text-xs"
                >
                    Return
                </button>
            </div>
            )}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center space-y-1">
          <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-[0.3em]">
            Bagh Chaal Nepal • {gameMode === 'AI' ? `${selectedDifficulty} AI` : 'PvP Mode'}
          </p>
          <p className="text-[9px] text-gray-300 dark:text-gray-700 uppercase">A Strategy Classic</p>
      </div>
    </div>
  );
};

export default MainMenu;
