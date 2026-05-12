import { Card } from '../types';
import { CardView } from '../CardView';

type CenterTableProps = {
  deckCount: number;
  discardPile: Card[];
  statusMessage?: string;
  waitingForResponse?: boolean;
};

export function CenterTable({ deckCount, discardPile, statusMessage, waitingForResponse }: CenterTableProps) {
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      {/* Piles Container */}
      <div className="flex items-center gap-12">
        {/* Deck Pile */}
        <div className="group relative">
          {/* Deck Stacking Effect */}
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
      <div className="flex flex-col items-center gap-2">
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
