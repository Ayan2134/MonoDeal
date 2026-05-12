import React, { useState } from 'react';
import type { Card } from '../types';
import { MonopolyCardFace } from './inspectors/MonopolyCardFace';

type CardInspectionModalProps = {
  card: Card;
  onClose: () => void;
};

export function CardInspectionModal({ card, onClose }: CardInspectionModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8 animate-in fade-in duration-300 overflow-hidden"
      onClick={onClose}
    >
      {/* Background Lighting Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative w-full max-w-sm md:max-w-md h-[80vh] md:h-[90vh] max-h-[800px] perspective-1000" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -right-4 -top-12 md:-right-12 md:-top-0 z-50 rounded-full bg-white/10 p-3 text-white/60 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
          title="Close Inspection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {/* 3D Flip Container */}
        <div 
          className={`relative w-full h-full transition-transform duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front Face */}
          <div className="absolute inset-0 backface-hidden z-20 hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[20px]">
            <MonopolyCardFace card={card} />
          </div>

          {/* Back Face (Monopoly Deal Logo) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#E53935] rounded-[20px] border-[12px] border-white flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="w-3/4 h-3/4 border-[6px] border-white/20 rounded-xl flex flex-col items-center justify-center p-8 bg-[#C62828] transform -rotate-12">
               <h1 className="text-white font-black text-5xl md:text-6xl text-center leading-none tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,0.4)]">
                 MONOPOLY
               </h1>
               <h2 className="text-white font-black text-6xl md:text-7xl text-center leading-none tracking-tighter mt-2 drop-shadow-[4px_4px_0_rgba(0,0,0,0.4)]">
                 DEAL
               </h2>
               <div className="mt-8 text-white/60 font-bold uppercase tracking-[0.3em] text-sm text-center">
                 Card Game
               </div>
            </div>
            <div className="absolute bottom-6 text-white/40 text-[10px] font-bold uppercase tracking-widest">
              Click to flip
            </div>
          </div>
        </div>

        {/* Floating Hint */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-white/40 text-xs font-bold uppercase tracking-widest text-center animate-pulse">
          Click card to flip
        </div>

      </div>
    </div>
  );
}
