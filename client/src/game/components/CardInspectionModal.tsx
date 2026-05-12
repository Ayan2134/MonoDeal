import React from 'react';
import type { Card, PropertyCard, ActionCard, WildcardCard, PropertyColor } from '../types';
import { CardView } from '../CardView';

type CardInspectionModalProps = {
  card: Card;
  onClose: () => void;
};

const colorNameMap: Record<string, string> = {
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

const colorClassMap: Record<string, string> = {
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

export function CardInspectionModal({ card, onClose }: CardInspectionModalProps) {
  const isProperty = card.type === 'property';
  const isAction = card.type === 'action';
  const isWildcard = card.type === 'wildcard';
  const isMoney = card.type === 'money';

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#121417] shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-white/5 p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {/* Card Visual Side */}
        <div className="flex w-full items-center justify-center bg-white/[0.02] p-12 md:w-1/2">
           <div className="scale-150 transform transition-transform duration-500 hover:scale-[1.55]">
             <CardView card={card} />
           </div>
        </div>

        {/* Details Side */}
        <div className="flex w-full flex-col p-8 md:w-1/2 md:p-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
               <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border border-white/5">
                 {card.type}
               </span>
               <span className="text-sm font-black text-emerald-400">
                 VALUE ${card.value}M
               </span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white">{card.name}</h2>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
            {/* Description Section */}
            {card.metadata?.description && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Description</h4>
                <p className="text-lg font-medium leading-relaxed text-white/80">{card.metadata.description}</p>
              </div>
            )}

            {/* Rules Section */}
            {card.metadata?.rulesText && (
              <div className="rounded-2xl border border-brass/20 bg-brass/5 p-6 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brass"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brass">Gameplay Rules</h4>
                </div>
                <p className="text-sm font-medium leading-relaxed text-brass/80 italic">"{card.metadata.rulesText}"</p>
              </div>
            )}

            {/* Property Specifics: Rent Table */}
            {isProperty && (card as PropertyCard).metadata?.rentProgression && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Rent Progression</h4>
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-white/40">Cards Owned</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-white/40">Rent Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(card as PropertyCard).metadata?.rentProgression?.map((rent, i) => (
                        <tr key={i} className={i === (card as PropertyCard).metadata!.rentProgression!.length - 1 ? 'bg-brass/10' : ''}>
                          <td className="px-4 py-3 text-sm font-bold text-white/60">
                            {i + 1} {i === 0 ? 'Card' : 'Cards'}
                            {i === (card as PropertyCard).metadata!.rentProgression!.length - 1 && (
                              <span className="ml-2 rounded bg-brass px-1.5 py-0.5 text-[8px] font-black text-ink">FULL SET</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm font-black ${i === (card as PropertyCard).metadata!.rentProgression!.length - 1 ? 'text-brass' : 'text-emerald-400'}`}>
                            ${rent}M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] font-bold text-white/20 italic">
                  * Rent is doubled if you play a "Double The Rent" card.
                </p>
              </div>
            )}

            {/* Wildcard Specifics: Colors */}
            {isWildcard && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Compatible Sets</h4>
                <div className="flex flex-wrap gap-2">
                  {(card as WildcardCard).colors.map((color) => (
                    <div key={color} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <div className={`h-2 w-2 rounded-full ${colorClassMap[color]}`} />
                      <span className="text-xs font-bold text-white/80">{colorNameMap[color]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Specifics: Targets */}
            {isAction && (card as ActionCard).actionId === 'rent' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Target Scope</h4>
                <div className="flex items-center gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{(card as ActionCard).affectsAllPlayers ? 'All Opponents' : 'Single Target'}</p>
                    <p className="text-[10px] font-medium text-white/40">{(card as ActionCard).affectsAllPlayers ? 'Everyone pays you rent simultaneously.' : 'Choose one player to pay you rent.'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="mt-8 w-full rounded-2xl bg-white/5 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
          >
            Back to Table
          </button>
        </div>
      </div>
    </div>
  );
}
