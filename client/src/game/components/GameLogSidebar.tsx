import React, { useEffect, useRef, useState } from 'react';
import { GameLogEntry, Card } from '../types';
import { ChevronLeft, ChevronRight, ScrollText, Clock, ExternalLink } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface GameLogSidebarProps {
  logs: GameLogEntry[];
  onInspectCard?: (card: Card) => void;
}

export function GameLogSidebar({ logs, onInspectCard }: GameLogSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, shouldAutoScroll, isOpen]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If user scrolls up, disable auto-scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  const { setHighlight, gameState } = useGameStore();

  const handleLogClick = (log: GameLogEntry) => {
    const playerIds: string[] = [];
    if (log.actorPlayerId) playerIds.push(log.actorPlayerId);
    if (log.targetPlayerId) playerIds.push(log.targetPlayerId);

    const cardIds: string[] = [];
    if (log.metadata?.cardId) cardIds.push(log.metadata.cardId);
    if (log.metadata?.stolenCardId) cardIds.push(log.metadata.stolenCardId);
    if (log.metadata?.initiatorCardId) cardIds.push(log.metadata.initiatorCardId);
    if (log.metadata?.targetCardId) cardIds.push(log.metadata.targetCardId);
    if (log.metadata?.cards) {
      (log.metadata.cards as any[]).forEach((c) => cardIds.push(c.id));
    }

    const setId = log.metadata?.stolenSetId || log.metadata?.targetSetId || null;

    // Trigger UI highlights
    setHighlight({ playerIds, cardIds, setId });

    // Try to find the first referenced card to inspect if applicable
    if (onInspectCard && gameState) {
      const firstCardId = cardIds[0];
      if (firstCardId) {
        // Look through all players' hands, bank, and properties to find the card object
        for (const player of gameState.players) {
          const card = 
            player.hand.find(c => c.id === firstCardId) ||
            player.bank.find(c => c.id === firstCardId) ||
            player.properties.flatMap(s => s.cards).find(c => c.id === firstCardId);
          
          if (card) {
            onInspectCard(card);
            break;
          }
        }
      }
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Toggle Button - Floating on the right edge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-[110] flex items-center justify-center w-10 h-24 bg-ink/90 border border-brass/30 border-r-0 rounded-l-xl transition-all duration-300 hover:bg-brass/20 group ${
          isOpen ? 'right-80' : 'right-0'
        }`}
        aria-label={isOpen ? "Close Logs" : "Open Logs"}
      >
        <div className="flex flex-col items-center gap-2">
          {isOpen ? <ChevronRight className="w-5 h-5 text-brass" /> : <ChevronLeft className="w-5 h-5 text-brass" />}
          <ScrollText className="w-5 h-5 text-brass/70 group-hover:text-brass" />
        </div>
      </button>

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[105] w-80 bg-ink/95 border-l border-brass/20 backdrop-blur-md transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-brass/10 flex items-center justify-between bg-brass/5">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-brass" />
            <h2 className="font-bold text-brass uppercase tracking-widest text-sm">Game History</h2>
          </div>
          <span className="text-[10px] text-brass/40 font-mono uppercase">
            {logs.length} Entries
          </span>
        </div>

        {/* Logs Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
        >
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-6">
              <ScrollText className="w-12 h-12 mb-4" />
              <p className="text-sm italic">Waiting for events...</p>
            </div>
          ) : (
            logs.map((log) => (
              <button 
                key={log.id} 
                onClick={() => handleLogClick(log)}
                className="group flex flex-col w-full text-left gap-1 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-brass/20 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Clock className="w-3 h-3 text-brass/60" />
                    <span className="text-[10px] font-mono">{formatTime(log.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.metadata && (
                      <ExternalLink className="w-3 h-3 text-brass/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${getLogBadgeColor(log.type)}`}>
                      {log.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-snug">
                  {log.message}
                </p>
              </button>
            ))
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-3 border-t border-brass/10 bg-black/40 text-[10px] text-center text-brass/30 italic">
          Authorized gameplay history
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[102] lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function getLogBadgeColor(type: string): string {
  switch (type) {
    case 'turn_start': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'turn_end': return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    case 'card_played': return 'bg-brass/10 text-brass border border-brass/20';
    case 'payment': return 'bg-red-500/10 text-red-400 border border-red-500/20';
    case 'winner': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 animate-pulse';
    default: return 'bg-white/5 text-gray-400 border border-white/10';
  }
}
