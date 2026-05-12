import { PropertySet, PropertyColor, Card } from '../types';

type PropertyMoveSelectorProps = {
  card: Card;
  currentSet: PropertySet;
  allSets: PropertySet[];
  onConfirm: (targetColor: string, targetSetId: string) => void;
  onCancel: () => void;
};

export function PropertyMoveSelector({
  card,
  currentSet,
  allSets,
  onConfirm,
  onCancel,
}: PropertyMoveSelectorProps) {
  const isWildcard = card.type === 'wildcard';
  const wildcardColors = isWildcard ? (card as any).colors as PropertyColor[] : [];

  const handleSelectSet = (setId: string, color: string) => {
      onConfirm(color, setId);
  };

  const handleCreateNew = (color: string) => {
      onConfirm(color, 'new');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-brass/30 bg-[#181c20] p-6 shadow-2xl">
        <h3 className="mb-2 text-xl font-black text-brass uppercase tracking-wider">
          Move {card.name}
        </h3>
        <p className="mb-6 text-sm text-white/40">
          Select a destination set or create a new row.
        </p>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
           {/* Color options if it's a wildcard */}
           {isWildcard && (
               <div>
                   <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">Select Color</h4>
                   <div className="grid grid-cols-2 gap-2">
                       {wildcardColors.map(color => (
                           <div key={color} className="space-y-1">
                               <button
                                   onClick={() => handleCreateNew(color)}
                                   className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-left transition hover:bg-brass hover:text-ink"
                               >
                                   <div className="flex items-center gap-2">
                                       <div className={`h-2 w-2 rounded-full bg-prop-${color}`} />
                                       <span className="text-xs font-bold capitalize">New {color} set</span>
                                   </div>
                               </button>
                               {/* Show existing sets of this color */}
                               {allSets.filter(s => s.color === color).map(s => (
                                   <button
                                       key={s.setId}
                                       onClick={() => handleSelectSet(s.setId, color)}
                                       className="w-full rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2 text-left transition hover:bg-emerald-500 hover:text-white"
                                   >
                                       <span className="text-[10px] font-medium">Add to existing {color} set ({s.cards.length} cards)</span>
                                   </button>
                               ))}
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {/* If it's a normal property, only show its own color sets */}
           {!isWildcard && (
               <div>
                   <button
                       onClick={() => handleCreateNew((card as any).color)}
                       className="mb-2 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-left transition hover:bg-brass hover:text-ink"
                   >
                       <div className="flex items-center gap-2">
                           <div className={`h-3 w-3 rounded-full bg-prop-${(card as any).color}`} />
                           <span className="font-bold capitalize">Start new {(card as any).color} set</span>
                       </div>
                   </button>
                   {allSets.filter(s => s.color === (card as any).color && s.setId !== currentSet.setId).map(s => (
                       <button
                           key={s.setId}
                           onClick={() => handleSelectSet(s.setId, (card as any).color)}
                           className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-left transition hover:bg-emerald-500 hover:text-white"
                       >
                           <span className="font-bold">Add to existing set ({s.cards.length} cards)</span>
                       </button>
                   ))}
               </div>
           )}
        </div>

        <button
          onClick={onCancel}
          className="mt-6 w-full rounded-xl border border-white/10 py-3 font-bold text-white/60 transition hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
