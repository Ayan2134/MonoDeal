import type { Card } from './types';
import { useGameStore } from '../store/gameStore';

const colorMap: Record<string, string> = {
  brown: 'bg-prop-brown border-white/20',
  'light-blue': 'bg-prop-lightblue border-white/20',
  pink: 'bg-prop-pink border-white/20',
  orange: 'bg-prop-orange border-white/20',
  red: 'bg-prop-red border-white/20',
  yellow: 'bg-prop-yellow border-white/20',
  green: 'bg-prop-green border-white/20',
  'dark-blue': 'bg-prop-darkblue border-white/20',
  railroad: 'bg-prop-rail border-white/20',
  utility: 'bg-prop-utility border-white/20',
  wild: 'bg-gradient-to-br from-violet-500 to-indigo-600 border-white/30',
};

const actionColorMap: Record<string, string> = {
  'rent': 'from-amber-600 via-amber-700 to-amber-900 border-amber-400/40',
  'debt-collector': 'from-orange-600 via-orange-700 to-orange-900 border-orange-500/40',
  'birthday': 'from-pink-600 via-pink-700 to-pink-900 border-pink-500/40',
  'deal-breaker': 'from-rose-700 via-rose-800 to-rose-950 border-rose-500/40',
  'sly-deal': 'from-sky-600 via-sky-700 to-sky-900 border-sky-400/40',
  'forced-deal': 'from-indigo-600 via-indigo-700 to-indigo-900 border-indigo-400/40',
  'just-say-no': 'from-red-600 via-red-700 to-red-900 border-red-500/40',
  'pass-go': 'from-yellow-500 via-yellow-600 to-yellow-800 border-yellow-400/40',
  'house': 'from-emerald-600 via-emerald-700 to-emerald-900 border-emerald-400/40',
  'hotel': 'from-teal-600 via-teal-700 to-teal-900 border-teal-500/40',
  'double-the-rent': 'from-amber-500 via-amber-600 to-amber-800 border-amber-300/40',
};

const defaultActionStyle = 'from-slate-700 via-slate-800 to-slate-900 border-slate-500/40';

export function CardView({ 
  card, 
  isSelected, 
  onClick,
  onInspect,
  compact = false 
}: { 
  card: Card; 
  isSelected?: boolean; 
  onClick?: () => void;
  onInspect?: () => void;
  compact?: boolean;
}) {
  const isProperty = card.type === 'property';
  const isWildcard = card.type === 'wildcard';
  const isMoney = card.type === 'money';
  const isAction = card.type === 'action';
  
  const assignedColor = (card as any).assignedColor;
  const colorKey = isProperty ? (card as any).color : isWildcard ? (assignedColor || 'wild') : null;
  const headerColor = (colorKey && colorMap[colorKey]) || '';

  const { highlightState } = useGameStore();
  const isHighlighted = highlightState.cardIds.includes(card.id);

  // Dynamic Background and Border based on category
  let cardClass = '';
  if (isProperty) {
    cardClass = 'bg-[#121417] border-brass/30';
  } else if (isMoney) {
    cardClass = 'bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 border-emerald-500/40';
  } else if (isAction) {
    const actionId = (card as any).actionId || '';
    cardClass = `bg-gradient-to-br ${actionColorMap[actionId] || defaultActionStyle}`;
  } else if (isWildcard) {
    cardClass = 'bg-[#121417] border-violet-500/40 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]';
  }

  if (compact) {
    return (
      <div 
        className={`w-8 h-12 rounded shadow-md border ${headerColor || cardClass} flex items-center justify-center text-[10px] font-bold text-white`}
        title={card.name}
      >
        {isMoney ? `$${card.value}` : card.name.charAt(0)}
      </div>
    );
  }

  return (
    <div
      className={`group relative flex h-36 w-24 flex-col overflow-hidden rounded-xl border shadow-xl transition-all duration-300 ${
        cardClass
      } ${isSelected ? 'z-10 scale-110 ring-4 ring-brass' : 'md:hover:-translate-y-2 md:hover:shadow-2xl'} ${
        isHighlighted ? 'z-20 scale-105 animate-pulse ring-4 ring-brass shadow-[0_0_20px_rgba(216,166,87,0.5)]' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      {/* Property Header (Color Strip) */}
      {(isProperty || isWildcard) && (
        <div className={`h-8 w-full border-b ${headerColor}`} />
      )}

      {/* Money Aesthetic: Center Denomination if Money */}
      {isMoney && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <span className="text-4xl font-black text-white/50">${card.value}</span>
        </div>
      )}

      {/* Value Badge */}
      <div className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-lg z-10 ${
        isMoney ? 'bg-emerald-400 text-emerald-950' : 'bg-black/60 text-white border border-white/10'
      }`}>
        {card.value}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-2.5 z-10 relative text-left">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${
            isMoney ? 'text-emerald-300' : isAction ? 'text-white/60' : 'text-brass/60'
          }`}>
            {isAction ? (card as any).actionId?.replace('-', ' ') : card.type}
          </span>
        </div>
        
        <h3 className={`text-[10px] font-black leading-[1.2] uppercase tracking-tight ${
          isMoney ? 'text-white' : 'text-white'
        }`}>
          {card.name}
        </h3>
        
        <div className="mt-auto flex flex-col gap-1">
          {isProperty && (
             <div className="flex items-center gap-1">
               <div className={`w-1.5 h-1.5 rounded-full ${(headerColor || '').split(' ')[0]}`} />
               <span className="text-[8px] font-bold uppercase tracking-wider text-white/60">{(card as any).color}</span>
             </div>
          )}
          {isWildcard && (
             <span className="text-[8px] font-bold uppercase tracking-wider text-violet-300/80">
               {assignedColor ? `AS ${assignedColor}` : 'Wildcard'}
             </span>
          )}
          {isAction && (
             <div className="h-0.5 w-4 bg-white/20 rounded-full" />
          )}
        </div>
      </div>

      {/* Subtle Premium Texture/Overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-tr from-white/5 via-transparent to-black/20" />
      
      {/* Opaque Matte finish for Money/Action */}
      {(isMoney || isAction) && (
        <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      )}

      {/* Selection Glow */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-inset ring-white/20" />
      )}

      {/* Inspection Trigger */}
      {onInspect && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInspect();
          }}
          className="absolute -left-1 -top-1 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-brass/40 bg-zinc-900 text-brass opacity-100 shadow-xl transition-all duration-200 hover:scale-110 hover:bg-brass hover:text-ink md:opacity-0 md:group-hover:opacity-100"
          title="Inspect Card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>
      )}
    </div>
  );
}
