import React from 'react';
import type { MoneyCard } from '../../types';

export function MoneyCardFace({ card }: { card: MoneyCard }) {
  return (
    <div className="w-full h-full flex flex-col bg-[#0F1115] text-white border-[8px] border-emerald-900/50 rounded-[24px] overflow-hidden shadow-2xl relative">
      
      {/* Top Value Circles */}
      <div className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full border-2 border-emerald-400 bg-zinc-900 flex items-center justify-center font-black text-2xl text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
        {card.value}
      </div>
      <div className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full border-2 border-emerald-400 bg-zinc-900 flex items-center justify-center font-black text-2xl text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
        {card.value}
      </div>

      {/* Header with Emerald Gradient */}
      <div className="w-full pt-16 pb-10 px-6 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-600/20 to-transparent border-b border-white/5">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-center text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
          Money Card
        </h2>
        <div className="h-1 w-12 bg-emerald-500/40 rounded-full mt-4" />
      </div>

      {/* Center Value with Watermark Effect */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
           <span className="text-[15rem] font-black text-emerald-500">${card.value}</span>
        </div>
        
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-[1px] border-emerald-500/20 flex items-center justify-center relative">
          <div className="absolute inset-4 rounded-full border-[8px] border-emerald-500/5 shadow-[inset_0_0_50px_rgba(16,185,129,0.1)]" />
          <span className="text-7xl md:text-9xl font-black text-white drop-shadow-2xl">
            {card.value}M
          </span>
        </div>
      </div>

      {/* Official Rules Box at Bottom */}
      <div className="w-full bg-zinc-900/80 p-6 flex items-center justify-center border-t border-white/10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 text-center">
          Deposit into bank to pay debts
        </p>
      </div>

      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
    </div>
  );
}
