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
      background: 'linear-gradient(90deg, #FF0000 0%, #FFD700 25%, #228B22 50%, #00008B 75%, #8A2BE2 100%)'
    };
  } else if (colors.length === 2) {
    const color1 = getHexForColor(colors[0]);
    const color2 = getHexForColor(colors[1]);
    headerStyle = {
      background: `linear-gradient(90deg, ${color1} 50%, ${color2} 50%)`
    };
  } else {
    headerStyle = { backgroundColor: '#333' }; // Fallback
  }

  return (
    <div className="w-full h-full flex flex-col bg-zinc-100 text-black border-[12px] border-white rounded-[20px] overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] relative">
      
      {/* Top Value Circles */}
      <div className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xl text-black shadow-md">
        {card.value}M
      </div>
      <div className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xl text-black shadow-md">
        {card.value}M
      </div>

      {/* Split Color Header */}
      <div className="w-full pt-16 pb-6 px-6 flex flex-col items-center justify-center text-white" style={headerStyle}>
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight">
          {isWildRent ? 'WILD RENT' : 'RENT'}
        </h2>
        {colors.length === 2 && (
          <div className="mt-2 flex items-center gap-2">
             <span className="text-[10px] font-black uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
               {colorNameMap[colors[0]]}
             </span>
             <span className="text-[10px] font-black opacity-60">/</span>
             <span className="text-[10px] font-black uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
               {colorNameMap[colors[1]]}
             </span>
          </div>
        )}
      </div>

      {/* Center Description */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F5F5DC]">
        <div className="border-[4px] border-black p-4 w-full">
          <p className="text-sm md:text-base font-bold leading-relaxed mb-4">
            {card.metadata?.description || "Force all players to pay you rent for properties you own in these colors."}
          </p>
          <div className="pt-4 border-t border-black/10 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
              Target Scope
            </span>
            <span className="text-sm font-black text-[#B22222]">
              {card.affectsAllPlayers ? 'ALL PLAYERS PAY YOU' : 'CHOOSE ONE PLAYER TO PAY'}
            </span>
          </div>
        </div>
      </div>

      {/* Official Rules Box at Bottom */}
      <div className="w-full bg-white text-black p-5 border-t-[8px] border-black/20">
        <p className="text-sm font-bold leading-relaxed text-center uppercase tracking-widest text-[#B22222]">
          {card.metadata?.instructions || "Play into center to use."}
        </p>
      </div>

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
