import React from 'react';
import type { ActionCard } from '../../types';

export function ActionCardFace({ card }: { card: ActionCard }) {
  const isBuilding = card.actionCategory === 'building';
  const isModifier = card.actionCategory === 'modifier';

  // Choose a base color based on category
  let bgColorClass = 'bg-[#1E88E5]'; // Default action blue
  let textColorClass = 'text-white';
  
  if (isBuilding) {
    bgColorClass = 'bg-[#8E24AA]'; // Purple for buildings
  } else if (isModifier) {
    bgColorClass = 'bg-[#E53935]'; // Red for modifiers like Double Rent
  } else if (card.actionId === 'deal-breaker' || card.actionId === 'sly-deal' || card.actionId === 'forced-deal') {
    bgColorClass = 'bg-[#00897B]'; // Teal for property stealers
  }

  return (
    <div className={`w-full h-full flex flex-col ${bgColorClass} ${textColorClass} border-[12px] border-white rounded-[20px] overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] relative`}>
      
      {/* Top Value Circles */}
      <div className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xl text-black shadow-md">
        {card.value}M
      </div>
      <div className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xl text-black shadow-md">
        {card.value}M
      </div>

      {/* Header */}
      <div className="w-full pt-16 pb-6 px-6 flex flex-col items-center justify-center bg-black/20">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-center drop-shadow-md leading-tight">
          {card.name}
        </h2>
        <span className="text-xs font-bold uppercase tracking-[0.3em] mt-2 opacity-80">
          Action Card
        </span>
      </div>

      {/* Center Description Circle */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-4 rounded-full border-[8px] border-white/10" />
        <div className="relative z-10 text-center px-4">
          <p className="text-xl md:text-2xl font-black leading-snug drop-shadow-md">
            {card.metadata?.description || "Action Card"}
          </p>
        </div>
      </div>

      {/* Official Rules Box at Bottom */}
      <div className="w-full bg-white text-black p-5 border-t-[8px] border-black/20">
        <p className="text-sm font-bold leading-relaxed text-center uppercase tracking-widest text-[#B22222]">
          {card.metadata?.instructions || "Follow instructions on card."}
        </p>
      </div>

    </div>
  );
}
