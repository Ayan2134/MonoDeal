import type { Card } from './types';

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

const cardStyles: Record<Card['type'], string> = {
  property: 'border-brass/40 bg-[#1a1d22]',
  money: 'border-emerald-300/40 bg-emerald-900/40',
  action: 'border-sky-300/40 bg-sky-900/40',
  wildcard: 'border-violet-300/40 bg-violet-900/40',
};

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
  const assignedColor = (card as any).assignedColor;
  const colorKey = isProperty ? (card as any).color : isWildcard ? (assignedColor || 'wild') : null;
  const headerColor = colorKey ? colorMap[colorKey] : '';

  if (compact) {
    return (
      <div 
        className={`w-8 h-12 rounded shadow-md border ${headerColor || cardStyles[card.type]} flex items-center justify-center text-[10px] font-bold text-white`}
        title={card.name}
      >
        {card.type === 'money' ? `$${card.value}` : card.name.charAt(0)}
      </div>
    );
  }

  return (
    <div
      className={`group relative flex h-36 w-24 flex-col rounded-xl border shadow-xl transition-all duration-300 ${
        cardStyles[card.type]
      } ${isSelected ? 'ring-4 ring-brass scale-110 z-10' : 'hover:-translate-y-2 hover:shadow-2xl'}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      {/* Card Header (Color Strip) */}
      {(isProperty || isWildcard) && (
        <div className={`h-8 w-full rounded-t-lg border-b ${headerColor}`} />
      )}

      {/* Value Badge */}
      <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-[10px] font-bold text-white shadow-inner">
        ${card.value}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-2 pt-1">
        <span className="mb-1 text-[8px] font-bold uppercase tracking-widest text-white/40">{card.type}</span>
        <span className="text-[11px] font-bold leading-tight text-white line-clamp-3">{card.name}</span>
        
        <div className="mt-auto flex flex-col gap-0.5">
          {isProperty && (
             <span className="text-[9px] font-medium capitalize text-white/60">{(card as any).color.replace('-', ' ')}</span>
          )}
          {isWildcard && (
             <span className="text-[9px] font-medium text-white/60">
               {assignedColor ? `Acting as ${assignedColor}` : (card as any).colors?.join(' / ')}
             </span>
          )}
        </div>
      </div>

      {/* Gloss Effect */}
      <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-tr from-white/5 to-transparent" />

      {/* Inspection Trigger */}
      {onInspect && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInspect();
          }}
          className="absolute -left-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 border border-white/20 text-white/40 shadow-lg opacity-0 transition-opacity hover:bg-zinc-700 hover:text-white group-hover:opacity-100"
          title="Inspect Card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>
      )}
    </div>
  );
}
