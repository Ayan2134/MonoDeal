import React from 'react';
import type { PropertyCard } from '../../types';

export const colorClassMap: Record<string, string> = {
  brown: 'bg-[#8B4513]', // Fallbacks if tailwind config missing
  'light-blue': 'bg-[#87CEEB]',
  pink: 'bg-[#FF69B4]',
  orange: 'bg-[#FF8C00]',
  red: 'bg-[#FF0000]',
  yellow: 'bg-[#FFD700]',
  green: 'bg-[#228B22]',
  'dark-blue': 'bg-[#00008B]',
  rail: 'bg-[#111111]',
  utility: 'bg-[#D2E2B8]',
};

export const tailwindColorClassMap: Record<string, string> = {
  brown: 'bg-prop-brown',
  'light-blue': 'bg-prop-lightblue',
  pink: 'bg-prop-pink',
  orange: 'bg-prop-orange',
  red: 'bg-prop-red',
  yellow: 'bg-prop-yellow',
  green: 'bg-prop-green',
  'dark-blue': 'bg-prop-darkblue',
  rail: 'bg-prop-rail',
  utility: 'bg-prop-utility',
};

export const colorNameMap: Record<string, string> = {
  brown: 'Brown',
  'light-blue': 'Light Blue',
  pink: 'Pink',
  orange: 'Orange',
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  'dark-blue': 'Dark Blue',
  rail: 'Railroad',
  utility: 'Utility',
};

export function PropertyCardFace({ card }: { card: PropertyCard }) {
  const colorClass = tailwindColorClassMap[card.color] || colorClassMap[card.color];
  const rentProgression = card.metadata?.rentProgression || [];
  const setSize = card.metadata?.setSize || 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#0F1115] text-white border-[8px] border-zinc-800 rounded-[24px] overflow-hidden shadow-2xl relative">
      
      {/* Top Value Circle */}
      <div className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full border-2 border-brass bg-zinc-900 flex items-center justify-center font-black text-2xl text-brass shadow-[0_0_15px_rgba(216,166,87,0.3)]">
        {card.value}M
      </div>

      {/* Color Header */}
      <div className={`w-full pt-16 pb-6 px-6 flex flex-col items-center justify-center border-b border-white/10 ${colorClass} text-white shadow-lg`}>
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-center drop-shadow-lg leading-tight">
          {card.name}
        </h2>
      </div>

      {/* Middle Rent Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-8 space-y-6">
        <div className="text-center w-full flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-brass/40" />
          <span className="uppercase text-lg font-black tracking-[0.4em] text-brass">Rent Value</span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-brass/40" />
        </div>
        
        <div className="w-full space-y-4">
          {rentProgression.map((rent, idx) => (
            <div key={idx} className="flex items-center justify-between font-bold text-xl p-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border border-white/20 ${colorClass}`} />
                <span className="text-sm uppercase tracking-widest text-white/60">
                  {idx + 1} {idx === 0 ? 'property' : 'properties'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-brass font-black">{rent}M</span>
                {idx === rentProgression.length - 1 && (
                  <span className="px-2 py-0.5 bg-brass/20 border border-brass/40 text-[10px] uppercase rounded font-black tracking-widest text-brass">
                    Full Set
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* House and Hotel Bonus Rows */}
          {card.metadata?.houseBonusEligible && (
            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between font-bold text-xl text-emerald-400">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-emerald-500/40 bg-emerald-600" />
                  <span className="text-sm uppercase tracking-widest">With House</span>
                </div>
                <span className="font-black">+3M</span>
              </div>
              <div className="flex items-center justify-between font-bold text-xl text-teal-400">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-teal-500/40 bg-teal-600" />
                  <span className="text-sm uppercase tracking-widest">With Hotel</span>
                </div>
                <span className="font-black">+4M</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Set Info */}
      <div className="w-full bg-zinc-900/80 p-6 flex items-center justify-center border-t border-white/10">
        <p className="text-sm font-black text-white/40 uppercase tracking-[0.3em]">
          {card.metadata?.propertyInfo || `Needs ${setSize} cards for full set`}
        </p>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
    </div>
  );
}
