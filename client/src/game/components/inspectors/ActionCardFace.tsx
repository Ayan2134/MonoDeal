import React from 'react';
import type { ActionCard } from '../../types';

const actionThemeMap: Record<string, { bg: string; accent: string; text: string }> = {
  'rent': { bg: 'from-amber-600 via-amber-700 to-amber-900', accent: 'text-amber-400', text: 'text-amber-100' },
  'debt-collector': { bg: 'from-orange-600 via-orange-700 to-orange-900', accent: 'text-orange-400', text: 'text-orange-100' },
  'birthday': { bg: 'from-pink-600 via-pink-700 to-pink-900', accent: 'text-pink-400', text: 'text-pink-100' },
  'deal-breaker': { bg: 'from-rose-700 via-rose-800 to-rose-950', accent: 'text-rose-400', text: 'text-rose-100' },
  'sly-deal': { bg: 'from-sky-600 via-sky-700 to-sky-900', accent: 'text-sky-400', text: 'text-sky-100' },
  'forced-deal': { bg: 'from-indigo-600 via-indigo-700 to-indigo-900', accent: 'text-indigo-400', text: 'text-indigo-100' },
  'just-say-no': { bg: 'from-red-600 via-red-700 to-red-900', accent: 'text-red-400', text: 'text-red-100' },
  'pass-go': { bg: 'from-yellow-500 via-yellow-600 to-yellow-800', accent: 'text-yellow-400', text: 'text-yellow-100' },
  'house': { bg: 'from-emerald-600 via-emerald-700 to-emerald-900', accent: 'text-emerald-400', text: 'text-emerald-100' },
  'hotel': { bg: 'from-teal-600 via-teal-700 to-teal-900', accent: 'text-teal-400', text: 'text-teal-100' },
  'double-the-rent': { bg: 'from-amber-500 via-amber-600 to-amber-800', accent: 'text-amber-300', text: 'text-amber-100' },
};

const defaultTheme = { bg: 'from-slate-700 via-slate-800 to-slate-900', accent: 'text-slate-400', text: 'text-slate-100' };

export function ActionCardFace({ card }: { card: ActionCard }) {
  const theme = actionThemeMap[card.actionId || ''] || defaultTheme;

  return (
    <div className={`w-full h-full flex flex-col bg-[#0F1115] text-white border-[8px] border-zinc-800 rounded-[24px] overflow-hidden shadow-2xl relative`}>
      
      {/* Top Value Circles */}
      <div className={`absolute top-4 left-4 z-10 w-12 h-12 rounded-full border-2 border-white/20 bg-zinc-900 flex items-center justify-center font-black text-2xl shadow-xl`}>
        {card.value}M
      </div>
      <div className={`absolute top-4 right-4 z-10 w-12 h-12 rounded-full border-2 border-white/20 bg-zinc-900 flex items-center justify-center font-black text-2xl shadow-xl`}>
        {card.value}M
      </div>

      {/* Header with Categorical Gradient */}
      <div className={`w-full pt-16 pb-8 px-8 flex flex-col items-center justify-center bg-gradient-to-br ${theme.bg} text-white shadow-lg border-b border-white/10`}>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-center drop-shadow-2xl leading-tight">
          {card.name}
        </h2>
        <span className={`text-[10px] font-black uppercase tracking-[0.4em] mt-4 opacity-60 ${theme.accent}`}>
          Action Card
        </span>
      </div>

      {/* Center Description Box */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute inset-8 rounded-[20px] border border-white/5 bg-white/[0.02]" />
        <div className="relative z-10 text-center max-w-sm">
          <p className="text-xl md:text-3xl font-black leading-tight text-white drop-shadow-lg">
            {card.metadata?.description || "Action Card"}
          </p>
        </div>
      </div>

      {/* Official Instructions Box at Bottom */}
      <div className="w-full bg-zinc-900/80 p-8 border-t border-white/10 text-center">
        <p className={`text-xs md:text-sm font-black leading-relaxed uppercase tracking-[0.2em] ${theme.accent}`}>
          {card.metadata?.instructions || "Follow instructions on card."}
        </p>
      </div>

      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
    </div>
  );
}
