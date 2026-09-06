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
    <div className="flex flex-col items-center justify-center gap-6 py-4 md:gap-10 md:py-16">
      {/* Piles Container */}
      <div className="flex items-center gap-4 md:gap-12">
        {/* Deck Pile */}
        <div className="group relative scale-90 md:scale-100">
          <div className="absolute -left-1 -top-1 hidden h-36 w-24 rounded-xl border border-white/5 bg-zinc-800 md:block" />
          <div className="absolute -left-0.5 -top-0.5 hidden h-36 w-24 rounded-xl border border-white/5 bg-zinc-800 md:block" />
          
          <div className="relative flex h-28 w-20 flex-col items-center justify-center rounded-xl border-2 border-brass/30 bg-[#1a1d22] shadow-2xl transition-transform md:h-36 md:w-24 md:group-hover:scale-105">
            <div className="mb-2 h-12 w-8 rounded-md border-2 border-brass/20 bg-brass/5 md:h-16 md:w-10" />
            <span className="text-[9px] font-black tracking-widest text-brass/60 uppercase md:text-[10px]">Monodeal</span>
            <div className="absolute bottom-2 rounded-full bg-brass/20 px-2 py-0.5 text-[10px] font-bold text-brass">
              {deckCount}
            </div>
          </div>
          <span className="mt-2 block text-center text-[9px] font-bold uppercase tracking-widest text-white/30 md:text-[10px]">Draw</span>
        </div>

        {/* Turn Action Center */}
        <div className="flex min-w-[100px] flex-col items-center justify-center gap-3 md:min-w-[200px] md:gap-4">
           {canStartTurn && (
             <button
               onClick={onStartTurn}
               className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-brass shadow-[0_0_30px_rgba(216,166,87,0.3)] transition-all hover:scale-110 active:scale-95 md:h-16 md:w-16"
               type="button"
             >
                <div className="absolute inset-0 animate-ping rounded-full bg-brass opacity-20" />
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-ink"><path d="m12 19 7-7-7-7"/><path d="M5 19l7-7-7-7"/></svg>
                <span className="absolute -bottom-7 whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-brass md:-bottom-8 md:text-[10px]">Start Turn</span>
             </button>
           )}

           {canEndTurn && (
             <button
               onClick={onEndTurn}
               className="group relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-brass/40 bg-ink shadow-xl transition-all hover:scale-105 hover:bg-brass/10 active:scale-95 md:h-14 md:w-14"
               type="button"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brass"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                <span className="absolute -bottom-7 whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-brass md:-bottom-8 md:text-[10px]">End Turn</span>
             </button>
           )}
           
           {!canStartTurn && !canEndTurn && !waitingForResponse && (
             <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/5 opacity-20 md:h-14 md:w-14">
                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
             </div>
           )}
        </div>

        {/* Discard Pile */}
        <div className="relative scale-90 md:scale-100">
          {topDiscard ? (
            <div className="transition-all hover:rotate-3">
               <CardView card={topDiscard} />
            </div>
          ) : (
            <div className="flex h-28 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 md:h-36 md:w-24">
               <span className="text-[10px] font-bold text-white/20">Empty</span>
            </div>
          )}
          <span className="mt-2 block text-center text-[9px] font-bold uppercase tracking-widest text-white/30 md:text-[10px]">Discard</span>
        </div>
      </div>

      {/* Status Messages */}
      <div className="flex h-10 flex-col items-center gap-2 md:h-12">
        {waitingForResponse && (
          <div className="flex animate-pulse items-center gap-2 rounded-full border border-brass/20 bg-brass/10 px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-brass" />
            <span className="text-xs font-bold uppercase tracking-wide text-brass">Waiting for response...</span>
          </div>
        )}
        
        {statusMessage && (
          <div className="rounded-lg border border-white/5 bg-black/40 px-4 py-2 shadow-xl backdrop-blur-sm md:px-6">
            <p className="text-sm font-medium text-white/80">{statusMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
