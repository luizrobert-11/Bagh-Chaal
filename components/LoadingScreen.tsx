import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-in">
      <h1 className="text-6xl md:text-8xl font-black text-white text-stroke tracking-wider animate-glow">
        Bagh Chaal
      </h1>
    </div>
  );
};

export default LoadingScreen;