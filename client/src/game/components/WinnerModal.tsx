import { useState } from 'react';
import { Card, GamePlayer } from '../types';
import { CardView } from '../CardView';

type WinnerModalProps = {
  winnerId: string;
  players: GamePlayer[];
  onReturnToLobby: () => void;
  onPlayAgain?: () => void;
};

export function WinnerModal({ winnerId, players, onReturnToLobby, onPlayAgain }: WinnerModalProps) {
  const [isVisible, setIsVisible] = useState(true);
  const winner = players.find(p => p.id === winnerId);
  const others = players.filter(p => p.id !== winnerId);

  if (!winner || !isVisible) {
    if (!isVisible) {
      return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-12 duration-500">
           <button 
             onClick={() => setIsVisible(true)}
             className="px-6 py-3 bg-brass text-ink text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl hover:scale-105 transition-all"
           >
             Show Results
           </button>
        </div>
      );
    }
    return null;
  }

  const winningSets = winner.properties.filter(s => s.isComplete);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500 p-4 overflow-y-auto">
      {/* Confetti-like background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-brass/10 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative w-full max-w-4xl bg-zinc-900 border border-brass/30 rounded-3xl shadow-[0_0_100px_rgba(196,164,132,0.15)] flex flex-col p-6 md:p-12 animate-in zoom-in-95 duration-500">
        
        {/* Close Button to view board */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-6 top-6 text-white/20 hover:text-white transition-colors"
          title="View Final Board"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {/* Victory Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1 rounded-full bg-brass/20 border border-brass/30 text-brass text-[10px] font-black uppercase tracking-[0.4em] mb-4">
            Victory Announced
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">
            {winner.name} Wins!
          </h1>
          <p className="text-white/60 text-sm md:text-base font-medium">
            Dominated the board with {winningSets.length} complete property sets.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 md:gap-12">
          {/* Winning Sets Showcase */}
          <div className="space-y-6">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] border-b border-white/5 pb-4">
              Winning Portfolio
            </h2>
            <div className="flex flex-wrap gap-4 md:gap-8 justify-center lg:justify-start">
              {winningSets.map((set) => (
                <div key={set.setId} className="flex flex-col items-center gap-3 group">
                  <div className="relative p-2 rounded-2xl bg-brass/5 border border-brass/20 shadow-2xl transition-transform group-hover:scale-105">
                    <div className="flex -space-x-12">
                      {set.cards.map((card, i) => (
                        <div key={card.id} style={{ zIndex: i }} className="scale-75 md:scale-90">
                           <CardView card={card} />
                        </div>
                      ))}
                    </div>
                    {/* Glow effect for complete set */}
                    <div className="absolute inset-0 rounded-2xl bg-brass/5 animate-pulse pointer-events-none" />
                  </div>
                  <span className="text-[8px] md:text-[10px] font-black text-brass uppercase tracking-widest">
                    {set.color.replace('-', ' ')} SET
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard / Stats */}
          <div className="flex flex-col gap-6">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] border-b border-white/5 pb-4">
              Final Standings
            </h2>
            <div className="space-y-3">
               {/* Winner Row */}
               <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-brass/10 border border-brass/30">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">{winner.name}</span>
                    <span className="text-[10px] font-bold text-brass uppercase tracking-widest">Champion</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white">${winner.bank.reduce((sum, c) => sum + (c.value || 0), 0)}M</div>
                    <div className="text-[8px] font-bold text-white/40 uppercase">Total Value</div>
                  </div>
               </div>

               {/* Other Players */}
               {others.map(p => (
                 <div key={p.id} className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/5 border border-white/10 opacity-60">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">{p.name}</span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{p.properties.filter(s => s.isComplete).length} Sets</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">${p.bank.reduce((sum, c) => sum + (c.value || 0), 0)}M</div>
                      <div className="text-[8px] font-bold text-white/40 uppercase">Assets</div>
                    </div>
                 </div>
               ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-3 pt-6">
              <button 
                onClick={onReturnToLobby}
                className="w-full py-4 bg-brass text-ink text-xs font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brass/20"
              >
                Return to Lobby
              </button>
              <button 
                onClick={() => setIsVisible(false)}
                className="w-full py-4 bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
              >
                View Final Board
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

