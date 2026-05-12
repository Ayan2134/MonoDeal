import React, { useState, useMemo } from 'react';
import { CardType, PropertyColor, Card } from '../types';
import { CardView } from '../CardView';
import { CardInspectionModal } from './CardInspectionModal';

// Representative list of all unique Monopoly Deal cards
const ENCYCLOPEDIA_CARDS: Partial<Card>[] = [
  // Properties
  { type: CardType.Property, name: 'Mediterranean Avenue', value: 1, color: PropertyColor.Brown, metadata: { rentProgression: [1, 2], setSize: 2, description: 'Part of the brown set.' } },
  { type: CardType.Property, name: 'Connecticut Avenue', value: 1, color: PropertyColor.LightBlue, metadata: { rentProgression: [1, 2, 3], setSize: 3, description: 'Part of the light blue set.' } },
  { type: CardType.Property, name: 'St. Charles Place', value: 2, color: PropertyColor.Pink, metadata: { rentProgression: [1, 2, 4], setSize: 3, description: 'Part of the pink set.' } },
  { type: CardType.Property, name: 'New York Avenue', value: 2, color: PropertyColor.Orange, metadata: { rentProgression: [1, 3, 5], setSize: 3, description: 'Part of the orange set.' } },
  { type: CardType.Property, name: 'Illinois Avenue', value: 3, color: PropertyColor.Red, metadata: { rentProgression: [2, 3, 6], setSize: 3, description: 'Part of the red set.' } },
  { type: CardType.Property, name: 'Marvin Gardens', value: 3, color: PropertyColor.Yellow, metadata: { rentProgression: [2, 4, 6], setSize: 3, description: 'Part of the yellow set.' } },
  { type: CardType.Property, name: 'Pennsylvania Avenue', value: 4, color: PropertyColor.Green, metadata: { rentProgression: [2, 4, 7], setSize: 3, description: 'Part of the green set.' } },
  { type: CardType.Property, name: 'Boardwalk', value: 4, color: PropertyColor.DarkBlue, metadata: { rentProgression: [3, 8], setSize: 2, description: 'Part of the dark blue set.' } },
  { type: CardType.Property, name: 'Reading Railroad', value: 2, color: PropertyColor.Rail, metadata: { rentProgression: [1, 2, 3, 4], setSize: 4, description: 'Part of the railroad set.' } },
  { type: CardType.Property, name: 'Electric Company', value: 2, color: PropertyColor.Utility, metadata: { rentProgression: [1, 2], setSize: 2, description: 'Part of the utility set.' } },

  // Wildcards
  { type: CardType.Wildcard, name: 'Wild Light Blue/Brown', value: 1, colors: [PropertyColor.LightBlue, PropertyColor.Brown], metadata: { description: 'Can be used as either Light Blue or Brown.', rulesText: 'Can be rearranged during your turn.' } },
  { type: CardType.Wildcard, name: 'Wild Property', value: 0, colors: Object.values(PropertyColor), metadata: { description: 'Multicolor Wildcard. Can be used as ANY property color.', rulesText: 'Can be rearranged for free during your turn.' } },

  // Actions
  { type: CardType.Action, name: 'Deal Breaker', value: 5, actionId: 'deal-breaker', actionCategory: 'property', metadata: { description: 'Steal a complete set of properties from any player.', rulesText: 'Includes any Houses and Hotels on that set.' } },
  { type: CardType.Action, name: 'Just Say No', value: 4, actionId: 'just-say-no', actionCategory: 'counter', metadata: { description: 'Use any time an action card is played against you.', rulesText: 'Can be played even if it is not your turn.' } },
  { type: CardType.Action, name: 'Sly Deal', value: 3, actionId: 'sly-deal', actionCategory: 'property', metadata: { description: 'Steal a property from any player.', rulesText: 'Cannot be used to steal a card from a COMPLETED set.' } },
  { type: CardType.Action, name: 'Forced Deal', value: 3, actionId: 'forced-deal', actionCategory: 'property', metadata: { description: 'Swap any property with another player.', rulesText: 'Cannot be used on a card in a COMPLETED set.' } },
  { type: CardType.Action, name: 'Debt Collector', value: 3, actionId: 'debt-collector', actionCategory: 'payment', metadata: { description: 'Force any player to pay you 5M.', rulesText: 'Target player must pay using cards from their bank or properties.' } },
  { type: CardType.Action, name: "It's My Birthday", value: 2, actionId: 'birthday', actionCategory: 'payment', metadata: { description: 'All players give you 2M.', rulesText: 'Every opponent must pay you 2M.' } },
  { type: CardType.Action, name: 'Pass Go', value: 1, actionId: 'pass-go', actionCategory: 'utility', metadata: { description: 'Draw 2 extra cards.', rulesText: 'Draw two cards from the Draw Pile.' } },
  { type: CardType.Action, name: 'House', value: 3, actionId: 'house', actionCategory: 'building', attachable: true, metadata: { description: 'Add to any completed set to add 3M to the rent.', rulesText: 'Can only be played on a COMPLETED set.' } },
  { type: CardType.Action, name: 'Hotel', value: 4, actionId: 'hotel', actionCategory: 'building', attachable: true, metadata: { description: 'Add to any completed set with a House for +4M rent.', rulesText: 'Only one Hotel per set.' } },
  { type: CardType.Action, name: 'Double The Rent', value: 2, actionId: 'double-the-rent', actionCategory: 'modifier', metadata: { description: 'Double the rent amount of a Rent card.', rulesText: 'Must be played with a Rent card.' } },

  // Rents
  { type: CardType.Action, name: 'Rent (Red/Yellow)', value: 1, actionId: 'rent', actionCategory: 'payment', supportedColors: [PropertyColor.Red, PropertyColor.Yellow], affectsAllPlayers: true, metadata: { description: 'Charge all players rent for your Red or Yellow properties.' } },
  { type: CardType.Action, name: 'Wild Rent', value: 3, actionId: 'rent', actionCategory: 'payment', wildcardRent: true, affectsAllPlayers: false, metadata: { description: 'Charge any ONE player rent for any property color you own.' } },

  // Money
  { type: CardType.Money, name: '10M Money', value: 10, metadata: { description: '10 Million Dollars.' } },
  { type: CardType.Money, name: '5M Money', value: 5, metadata: { description: '5 Million Dollars.' } },
  { type: CardType.Money, name: '1M Money', value: 1, metadata: { description: '1 Million Dollars.' } },
];

type CardEncyclopediaProps = {
  onClose: () => void;
};

export function CardEncyclopedia({ onClose }: CardEncyclopediaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | CardType>('all');
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  const filteredCards = useMemo(() => {
    return ENCYCLOPEDIA_CARDS.filter(card => {
      const matchesSearch = card.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           card.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || card.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, activeFilter]);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-8 animate-in fade-in duration-500">
      <div 
        className="w-full max-w-7xl h-full flex flex-col rounded-[2.5rem] border border-white/10 bg-[#0d0f12] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brass/20 text-brass shadow-[0_0_20px_rgba(216,166,87,0.2)] border border-brass/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight">Monodeal Encyclopedia</h2>
              <p className="text-sm font-bold text-white/40 uppercase tracking-[0.3em] mt-1">Official Card Registry & Rules</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl items-center gap-4 w-full">
             <div className="relative flex-1">
               <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
               <input 
                 type="text" 
                 placeholder="Search cards, rules, or descriptions..."
                 className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-bold text-white outline-none transition focus:border-brass/40 focus:bg-white/10"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <button 
               onClick={onClose}
               className="rounded-2xl bg-white/5 p-4 text-white/60 transition hover:bg-red-500/20 hover:text-red-400"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
             </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 p-6 overflow-x-auto bg-black/20 no-scrollbar">
           {(['all', CardType.Property, CardType.Action, CardType.Wildcard, CardType.Money] as const).map(filter => (
             <button
               key={filter}
               onClick={() => setActiveFilter(filter)}
               className={`rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                 activeFilter === filter 
                   ? 'bg-brass text-ink shadow-[0_0_15px_rgba(216,166,87,0.3)]' 
                   : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
               }`}
             >
               {filter}
             </button>
           ))}
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {filteredCards.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p className="text-xl font-black uppercase tracking-widest">No cards found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-16">
              {filteredCards.map((card, i) => (
                <div 
                  key={i} 
                  className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <CardView 
                    card={card as Card} 
                    onInspect={() => setInspectedCard(card as Card)}
                  />
                  <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/20 text-center truncate w-full px-2">
                    {card.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t border-white/5 bg-white/[0.01]">
           <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">Monodeal Virtual Rulebook v1.0</p>
        </div>
      </div>

      {/* Inspection Overlay */}
      {inspectedCard && (
        <CardInspectionModal 
          card={inspectedCard} 
          onClose={() => setInspectedCard(null)} 
        />
      )}
    </div>
  );
}
