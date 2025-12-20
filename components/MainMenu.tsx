
import React, { useState } from 'react';
import { Difficulty, GameConfig, Player, GameMode, PlayerStats } from '../types';
import { getRankInfo } from '../constants';
import RankBadge from './RankBadge';

interface MainMenuProps {
  onPlay: (config: GameConfig) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  stats: PlayerStats;
}

const MainMenu: React.FC<MainMenuProps> = ({ onPlay, isDarkMode, toggleTheme, stats }) => {
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
    <div className="w-full h-full flex flex-col items-center justify-center p-4 animate-fade-in relative z-10">
      
      {/* Rank Display (Top Right) */}
      <div className="absolute top-4 right-4 flex flex-col items-end z-20">
          <div className="flex items-center space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 pr-4 rounded-l-2xl shadow-lg border-r-4 border-r-blue-500">
              <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{rankInfo.name}</span>
                  <div className="w-32 h-2 bg-gray-300 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000" 
                        style={{ width: `${progressPercent}%` }}
                      />
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5">{stats.currentExp} / {rankInfo.maxExp} XP</span>
              </div>
              <RankBadge rank={stats.rank} size="sm" />
          </div>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 flex flex-col items-center space-y-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300 mt-12">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 text-center">Bagh Chaal</h1>
        
        {!showSettings ? (
          <>
            {/* Game Configuration Controls */}
            <div className="w-full space-y-5 mb-2">
              
              {/* Game Mode Selection */}
              <div className="flex flex-col space-y-2">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 ml-1">GAME MODE</span>
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                  <button
                    onClick={() => setGameMode('AI')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      gameMode === 'AI' 
                        ? 'bg-white dark:bg-gray-600 shadow text-purple-600 dark:text-purple-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    1 PLAYER
                  </button>
                  <button
                    onClick={() => setGameMode('PVP')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      gameMode === 'PVP' 
                        ? 'bg-white dark:bg-gray-600 shadow text-pink-600 dark:text-pink-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    2 PLAYER
                  </button>
                </div>
              </div>

              {gameMode === 'AI' ? (
                <>
                  {/* Role Selection */}
                  <div className="flex flex-col space-y-2 animate-fade-in">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 ml-1">PLAY AS</span>
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                      <button
                        onClick={() => setSelectedRole('GOAT')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                          selectedRole === 'GOAT' 
                            ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                      >
                        🐑 GOAT
                      </button>
                      <button
                        onClick={() => setSelectedRole('TIGER')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                          selectedRole === 'TIGER' 
                            ? 'bg-white dark:bg-gray-600 shadow text-red-600 dark:text-red-400' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                      >
                        🐯 TIGER
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-2 flex flex-col items-center justify-center animate-fade-in text-gray-500 dark:text-gray-400 text-center">
                   <p className="text-sm">Local Multiplayer • Goats move first</p>
                </div>
              )}

              {/* Difficulty Selection (Also used for PVP Undo Limit) */}
              <div className="flex flex-col space-y-2 animate-fade-in">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 ml-1">
                   {gameMode === 'PVP' ? 'UNDO LIMIT' : 'DIFFICULTY'}
                </span>
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                  {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedDifficulty === diff
                          ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      {diff}
                      {gameMode === 'PVP' && (
                          <span className="block text-[10px] opacity-70">
                              ({diff === 'EASY' ? '5' : diff === 'MEDIUM' ? '3' : '1'} Undo)
                          </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <button 
              onClick={handleStart}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xl shadow-lg transform transition active:scale-95"
            >
              Start Game
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="w-full py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold rounded-xl text-xl shadow-md transform transition active:scale-95"
            >
              Settings
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col space-y-6">
            <h2 className="text-2xl font-semibold text-center text-gray-700 dark:text-gray-200">Settings</h2>
            
            <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
              <span className="text-lg font-medium text-gray-800 dark:text-gray-200">Theme</span>
              <button 
                onClick={toggleTheme}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-yellow-400 text-black'
                }`}
              >
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full py-3 bg-gray-500 hover:bg-gray-400 text-white font-bold rounded-xl shadow-md"
            >
              Back
            </button>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-gray-500 dark:text-gray-400 text-sm max-w-xs text-center">
        {gameMode === 'PVP' 
           ? `PvP Mode: Tigers need 5 Captures.`
           : `Level: ${selectedDifficulty} | Win: ${selectedRole === 'TIGER' ? (selectedDifficulty === 'HARD' ? '7' : (selectedDifficulty === 'MEDIUM' ? '5' : '3')) : (selectedDifficulty === 'EASY' ? 'Tiger needs 7' : (selectedDifficulty === 'MEDIUM' ? 'Tiger needs 5' : 'Tiger needs 3'))} Captures`
        }
      </p>
    </div>
  );
};

export default MainMenu;
