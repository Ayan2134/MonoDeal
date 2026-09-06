import { PropertySet, PropertyColor } from '../types';

function isHouseBonusEligible(color: PropertySet['color']) {
  return color !== 'wild' && color !== PropertyColor.Rail && color !== PropertyColor.Utility;
}

type BuildingTargetSelectorProps = {
  type: 'house' | 'hotel';
  propertySets: PropertySet[];
  onConfirm: (setId: string) => void;
  onCancel: () => void;
};

export function BuildingTargetSelector({
  type,
  propertySets,
  onConfirm,
  onCancel,
}: BuildingTargetSelectorProps) {
  const eligibleSets = propertySets.filter(set => {
    if (!set.isComplete || !isHouseBonusEligible(set.color)) return false;
    if (type === 'house') {
      return !set.houseCard;
    } else {
      return set.houseCard && !set.hotelCard;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-brass/30 bg-[#181c20] p-6 shadow-2xl">
        <h3 className="mb-2 text-xl font-black text-brass uppercase tracking-wider">
          Apply {type}
        </h3>
        <p className="mb-6 text-sm text-white/40">
          Select a complete set to add your {type}. Railroads and utilities cannot take buildings.
        </p>

        {eligibleSets.length === 0 ? (
          <div className="mb-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm font-bold text-white/20 uppercase tracking-widest">
              No eligible sets found
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {eligibleSets.map(set => (
              <button
                key={set.setId}
                onClick={() => onConfirm(set.setId)}
                className="group relative w-full overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 text-left transition hover:border-brass/50 hover:bg-brass/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                      style={{ backgroundColor: `var(--prop-${set.color})` }}
                    />
                    <span className="font-black uppercase tracking-widest text-white/80 group-hover:text-brass transition">
                      {set.color.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-white/40">
                    {set.cards.length} Cards
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full rounded-xl border border-white/10 py-3 font-bold text-white/60 transition hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
