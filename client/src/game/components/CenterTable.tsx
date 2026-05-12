import { Card } from '../types';
import { CardView } from '../CardView';

type CenterTableProps = {
  deckCount: number;
  discardPile: Card[];
  statusMessage?: string;
  waitingForResponse?: boolean;
  canStartTurn?: boolean;
  canEndTurn?: boolean;
  onStartTurn?: () => void;
  onEndTurn?: () => void;
};

export function CenterTable({ 
  deckCount, 
  discardPile, 
  statusMessage, 
  waitingForResponse,
  canStartTurn,
  canEndTurn,
  onStartTurn,
  onEndTurn
}: CenterTableProps) {
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div className="flex flex-col items-center justify-center gap-10 py-8">
      {/* Piles Container */}
      <div className="flex items-center gap-12">
        {/* Deck Pile */}
        <div className="group relative">
          <div className="absolute -left-1 -top-1 h-36 w-24 rounded-xl border border-white/5 bg-zinc-800" />
          <div className="absolute -left-0.5 -top-0.5 h-36 w-24 rounded-xl border border-white/5 bg-zinc-800" />
          
          <div className="relative flex h-36 w-24 flex-col items-center justify-center rounded-xl border-2 border-brass/30 bg-[#1a1d22] shadow-2xl transition-transform group-hover:scale-105">
            <div className="mb-2 h-16 w-10 rounded-md border-2 border-brass/20 bg-brass/5" />
            <span className="text-[10px] font-black tracking-widest text-brass/60 uppercase">Monodeal</span>
            <div className="absolute bottom-2 rounded-full bg-brass/20 px-2 py-0.5 text-[10px] font-bold text-brass">
              {deckCount}
            </div>
          </div>
          <span className="mt-2 block text-center text-[10px] font-bold uppercase tracking-widest text-white/30">Draw Pile</span>
        </div>

        {/* Turn Action Center */}
        <div className="flex flex-col items-center justify-center gap-4 min-w-[200px]">
           {canStartTurn && (
             <button
               onClick={onStartTurn}
               className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-brass shadow-[0_0_30px_rgba(216,166,87,0.3)] transition-all hover:scale-110 active:scale-95"
             >
                <div className="absolute inset-0 animate-ping rounded-full bg-brass opacity-20" />
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-ink"><path d="m12 19 7-7-7-7"/><path d="M5 19l7-7-7-7"/></svg>
                <span className="absolute -bottom-8 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-brass">Start Turn</span>
             </button>
           )}

           {canEndTurn && (
             <button
               onClick={onEndTurn}
               className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-brass/40 bg-ink shadow-xl transition-all hover:scale-105 hover:bg-brass/10 active:scale-95"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brass"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                <span className="absolute -bottom-8 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-brass">End Turn</span>
             </button>
           )}
           
           {!canStartTurn && !canEndTurn && !waitingForResponse && (
             <div className="h-14 w-14 rounded-full border border-white/5 bg-white/5 flex items-center justify-center opacity-20">
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
             </div>
           )}
        </div>

        {/* Discard Pile */}
        <div className="relative">
          {topDiscard ? (
            <div className="transition-all hover:rotate-3">
               <CardView card={topDiscard} />
            </div>
          ) : (
            <div className="flex h-36 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5">
               <span className="text-[10px] font-bold text-white/20">Empty</span>
            </div>
          )}
          <span className="mt-2 block text-center text-[10px] font-bold uppercase tracking-widest text-white/30">Discard</span>
        </div>
      </div>

      {/* Status Messages */}
      <div className="flex flex-col items-center gap-2 h-12">
        {waitingForResponse && (
          <div className="flex items-center gap-2 rounded-full bg-brass/10 border border-brass/20 px-4 py-1.5 animate-pulse">
            <div className="h-2 w-2 rounded-full bg-brass" />
            <span className="text-xs font-bold text-brass uppercase tracking-wide">Waiting for response...</span>
          </div>
        )}
        
        {statusMessage && (
          <div className="rounded-lg bg-black/40 px-6 py-2 border border-white/5 backdrop-blur-sm shadow-xl">
            <p className="text-sm font-medium text-white/80">{statusMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
