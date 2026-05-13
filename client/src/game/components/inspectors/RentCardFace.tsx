import React from 'react';
import type { ActionCard } from '../../types';

import { colorNameMap } from './PropertyCardFace';

export function RentCardFace({ card }: { card: ActionCard }) {
  const isWildRent = card.wildcardRent;
  const colors = card.supportedColors || [];

  // Determine background header style based on colors
  let headerStyle = {};
  if (isWildRent || colors.length > 2) {
    headerStyle = {
      background: 'linear-gradient(90deg, #8B4513 0%, #FF8C00 25%, #228B22 50%, #00008B 75%, #FF0000 100%)'
    };
  } else if (colors.length === 2) {
    const color1 = getHexForColor(colors[0]);
    const color2 = getHexForColor(colors[1]);
    headerStyle = {
      background: `linear-gradient(90deg, ${color1} 50%, ${color2} 50%)`
    };
  } else {
    headerStyle = { background: 'linear-gradient(to bottom right, #D97706, #92400E)' }; 
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0F1115] text-white border-[8px] border-zinc-800 rounded-[24px] overflow-hidden shadow-2xl relative">
      
      {/* Top Value Circles */}
      <div className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full border-2 border-white/20 bg-zinc-900 flex items-center justify-center font-black text-2xl shadow-xl">
        {card.value}M
      </div>
      <div className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full border-2 border-white/20 bg-zinc-900 flex items-center justify-center font-black text-2xl shadow-xl">
        {card.value}M
      </div>

      {/* Split Color Header */}
      <div className="w-full pt-16 pb-8 px-8 flex flex-col items-center justify-center text-white border-b border-white/10 shadow-lg" style={headerStyle}>
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] leading-tight">
          {isWildRent ? 'WILD RENT' : 'RENT'}
        </h2>
        {colors.length === 2 && (
          <div className="mt-4 flex items-center gap-2">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-black/60 border border-white/10 px-3 py-1 rounded backdrop-blur-md">
               {colorNameMap[colors[0]]}
             </span>
             <span className="text-[10px] font-black opacity-40">/</span>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-black/60 border border-white/10 px-3 py-1 rounded backdrop-blur-md">
               {colorNameMap[colors[1]]}
             </span>
          </div>
        )}
      </div>

      {/* Center Description */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
        <div className="absolute inset-8 rounded-[20px] border border-white/5 bg-white/[0.02]" />
        <div className="relative z-10 max-w-sm">
          <p className="text-xl md:text-2xl font-black leading-tight text-white mb-6">
            {card.metadata?.description || "Force players to pay you rent."}
          </p>
          <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
              Target Scope
            </span>
            <span className="text-lg font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] uppercase tracking-wider">
              {card.affectsAllPlayers ? 'ALL PLAYERS PAY' : 'CHOOSE ONE PLAYER'}
            </span>
          </div>
        </div>
      </div>

      {/* Official Instructions Box at Bottom */}
      <div className="w-full bg-zinc-900/80 p-8 border-t border-white/10 text-center">
        <p className="text-xs md:text-sm font-black leading-relaxed uppercase tracking-[0.2em] text-amber-500">
          {card.metadata?.instructions || "Play into center to use."}
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
