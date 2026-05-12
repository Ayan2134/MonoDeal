import React from 'react';
import type { MoneyCard } from '../../types';

export function MoneyCardFace({ card }: { card: MoneyCard }) {
  return (
    <div className="w-full h-full flex flex-col bg-[#F5F5DC] text-black border-[12px] border-white rounded-[20px] overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] relative">
      
      {/* Top Value Circles */}
      <div className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xl text-black shadow-md">
        {card.value}
      </div>
      <div className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xl text-black shadow-md">
        {card.value}
      </div>

      {/* Header */}
      <div className="w-full pt-16 pb-6 px-6 flex flex-col items-center justify-center bg-[#8FBC8F] text-white">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-center drop-shadow-md leading-tight">
          Money Card
        </h2>
      </div>

      {/* Center Value */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F5F5DC]">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-[8px] border-[#8FBC8F] flex items-center justify-center shadow-inner">
          <span className="text-6xl md:text-8xl font-black text-[#2E8B57] drop-shadow-sm">
            {card.value}M
          </span>
        </div>
      </div>

      {/* Official Rules Box at Bottom */}
      <div className="w-full bg-white text-black p-5 border-t-[8px] border-black/20">
        <p className="text-sm font-bold leading-relaxed text-center">
          Deposit into your bank to pay rent or fees.
        </p>
      </div>

    </div>
  );
}
