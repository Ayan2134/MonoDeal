import React from 'react';
import type { WildcardCard } from '../../types';
import { colorClassMap, tailwindColorClassMap } from './PropertyCardFace';

export function WildcardFace({ card }: { card: WildcardCard }) {
  const isMulti = card.colors.length > 2;

  // Determine background based on colors
  let backgroundStyle = {};
  if (isMulti) {
    backgroundStyle = {
      background: 'linear-gradient(135deg, #FF0000 0%, #FFD700 25%, #228B22 50%, #00008B 75%, #8A2BE2 100%)'
    };
  } else if (card.colors.length === 2) {
    // We can't easily extract hex from tailwind classes at runtime, so we rely on the generic names
    // but a CSS approach using standard colors works for the authentic look.
    // For a real app, we'd map PropertyColor enum to exact hex codes.
    const color1 = getHexForColor(card.colors[0]);
    const color2 = getHexForColor(card.colors[1]);
    backgroundStyle = {
      background: `linear-gradient(135deg, ${color1} 50%, ${color2} 50%)`
    };
  } else {
    backgroundStyle = { backgroundColor: '#333' }; // Fallback
  }

  return (
    <div className="w-full h-full flex flex-col border-[12px] border-white rounded-[20px] overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] relative" style={backgroundStyle}>
      
      {/* Top Value Circle */}
      {card.value > 0 && (
        <div className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xl text-black shadow-md">
          {card.value}M
        </div>
      )}

      {/* Header Box */}
      <div className="w-full pt-16 pb-6 px-6 flex flex-col items-center justify-center bg-black/40 text-white backdrop-blur-sm">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-center drop-shadow-md leading-tight">
          Property Wild Card
        </h2>
      </div>

      {/* Center Description */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
        <p className="text-xl font-bold uppercase tracking-wide leading-snug">
          {card.metadata?.description || (isMulti ? 'Use as any property color. May be moved between sets during your turn.' : 'Use as either property color shown. May be moved between sets during your turn.')}
        </p>
      </div>

      {/* Official Rules Box at Bottom */}
      <div className="w-full bg-white text-black p-5 border-t-[8px] border-black/20">
        <p className="text-sm font-bold leading-relaxed">
          {card.metadata?.officialRulesText || card.metadata?.rulesText || "Use as a substitute property card."}
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
