
import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import { View, GameConfig, PlayerStats, Rank } from './types';
import { RANKS, getRankInfo, getNextRank } from './constants';

export default function App() {
  const [view, setView] = useState<View>('LOADING');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Player Stats Persistence
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('bc_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse stats", e);
      }
    }
    return { rank: 'BRONZE', currentExp: 0 };
  });

  const [gameConfig, setGameConfig] = useState<GameConfig>({
    gameMode: 'AI',
    playerRole: 'GOAT', 
    difficulty: 'MEDIUM'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setView('MENU');
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('bc_stats', JSON.stringify(playerStats));
  }, [playerStats]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handlePlay = (config: GameConfig) => {
    setGameConfig(config);
    setView('GAME');
  };

  const handleUpdateStats = (expGain: number) => {
    setPlayerStats(prev => {
      let newExp = prev.currentExp + expGain;
      let newRank: Rank = prev.rank;
      let rankInfo = getRankInfo(newRank);
      
      // Level Up Logic
      while (newExp >= rankInfo.maxExp) {
        const nextRank = getNextRank(newRank);
        if (nextRank) {
          // Reset EXP to 0 for next rank as requested
          newExp = 0; 
          newRank = nextRank;
          rankInfo = getRankInfo(newRank);
        } else {
          // Cap at max
          newExp = rankInfo.maxExp;
          break;
        }
      }
      
      return { rank: newRank, currentExp: newExp };
    });
  };

  return (
    <div className={`w-full min-h-screen relative overflow-hidden flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      
      {view === 'LOADING' && <LoadingScreen />}
      
      {view === 'MENU' && (
        <MainMenu 
          onPlay={handlePlay} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          stats={playerStats}
        />
      )}

      {view === 'GAME' && (
        <Game 
          config={gameConfig}
          onBack={() => setView('MENU')}
          onGameEnd={handleUpdateStats}
        />
      )}

    </div>
  );
}
