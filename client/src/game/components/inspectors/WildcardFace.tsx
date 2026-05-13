import React from 'react';
import type { WildcardCard } from '../../types';
import { colorClassMap, tailwindColorClassMap } from './PropertyCardFace';

export function WildcardFace({ card }: { card: WildcardCard }) {
  const isMulti = card.colors.length > 2;

  // Determine background header style based on colors
  let headerStyle = {};
  if (isMulti) {
    headerStyle = {
      background: 'linear-gradient(90deg, #8B4513 0%, #FF8C00 25%, #228B22 50%, #00008B 75%, #FF0000 100%)'
    };
  } else if (card.colors.length === 2) {
    const color1 = getHexForColor(card.colors[0]);
    const color2 = getHexForColor(card.colors[1]);
    headerStyle = {
      background: `linear-gradient(90deg, ${color1} 50%, ${color2} 50%)`
    };
  } else {
    headerStyle = { backgroundColor: '#1E1B4B' }; // Deep indigo
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0F1115] text-white border-[8px] border-zinc-800 rounded-[24px] overflow-hidden shadow-2xl relative">
      
      {/* Top Value Circle */}
      {card.value > 0 && (
        <div className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full border-2 border-brass bg-zinc-900 flex items-center justify-center font-black text-2xl text-brass shadow-xl">
          {card.value}M
        </div>
      )}

      {/* Color Header */}
      <div className="w-full pt-16 pb-8 px-8 flex flex-col items-center justify-center text-white border-b border-white/10 shadow-lg" style={headerStyle}>
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] leading-tight">
          Property Wild Card
        </h2>
      </div>

      {/* Center Description */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
        <div className="absolute inset-8 rounded-[20px] border border-white/5 bg-white/[0.02]" />
        
        <div className="relative z-10 max-w-sm">
          <p className="text-xl md:text-2xl font-black leading-tight text-white mb-8">
            {card.metadata?.description || (isMulti ? 'Use as any property color.' : 'Use as either property color shown.')}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {card.colors.map(color => (
              <div key={color} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div 
                  className="w-5 h-5 rounded-full shadow-lg" 
                  style={{ backgroundColor: getHexForColor(color) }}
                />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {color}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Official Rules Box at Bottom */}
      <div className="w-full bg-zinc-900/80 p-8 border-t border-white/10 text-center">
        <p className="text-xs md:text-sm font-black leading-relaxed uppercase tracking-[0.2em] text-violet-400">
          Switch colors during your turn.
        </p>
      </div>

      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
    </div>
  );
}

// Helper to map color enum to hex for gradients
function getHexForColor(color: string): string {
  const map: Record<string, string> = {
    brown: '#8B4513',
    'light-blue': '#87CEEB',
    pink: '#FF69B4',
    orange: '#FF8C00',
    red: '#FF0000',
    yellow: '#FFD700',
    green: '#228B22',
    'dark-blue': '#00008B',
    rail: '#111111',
    utility: '#D2E2B8',
  };
  return map[color] || '#333333';
}
