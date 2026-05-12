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
    <div className="w-full h-full flex flex-col bg-[#F5F5DC] text-black border-[12px] border-white rounded-[20px] overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] relative">
      
      {/* Top Value Circle */}
      <div className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xl shadow-md">
        {card.value}M
      </div>

      {/* Color Header */}
      <div className={`w-full pt-14 pb-4 px-4 flex flex-col items-center justify-center border-b-2 border-black ${colorClass} text-white`}>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-center drop-shadow-md leading-tight">
          {card.name}
        </h2>
      </div>

      {/* Middle Rent Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 space-y-4">
        <div className="text-center mb-4">
          <span className="uppercase text-xl font-black tracking-[0.2em] text-black block">Rent</span>
        </div>
        
        <div className="w-full space-y-3">
          {rentProgression.map((rent, idx) => (
            <div key={idx} className="flex items-center justify-between font-bold text-lg">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-sm border border-black/20 ${colorClass}`} />
                <span className="text-sm">
                  {idx + 1} {idx === 0 ? 'property' : 'properties'} =
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span>{rent}M</span>
                {idx === rentProgression.length - 1 && (
                  <span className="px-2 py-0.5 border border-black/40 text-[10px] uppercase rounded-sm font-black tracking-wider text-black/60">
                    Full Set
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* House and Hotel Bonus Rows for Eligible Properties */}
          {card.metadata?.houseBonusEligible && (
            <div className="pt-2 mt-2 border-t border-black/20 space-y-2">
              <div className="flex items-center justify-between font-bold text-lg text-black/70">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border border-black/20 bg-[#8E24AA]" />
                  <span className="text-sm">House</span>
                </div>
                <span>+3M</span>
              </div>
              <div className="flex items-center justify-between font-bold text-lg text-black/70">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border border-black/20 bg-[#8E24AA]" />
                  <span className="text-sm">Hotel</span>
                </div>
                <span>+4M</span>
              </div>
            </div>
          )}

          <div className="pt-4 text-center">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Full Set</span>
          </div>
        </div>
      </div>

      {/* Bottom Set Info */}
      <div className={`w-full py-3 ${colorClass} text-white text-center font-bold text-sm tracking-widest uppercase border-t-2 border-black`}>
        {card.metadata?.propertyInfo || `Needs ${setSize} for full set`}
      </div>

    </div>
  );
}
