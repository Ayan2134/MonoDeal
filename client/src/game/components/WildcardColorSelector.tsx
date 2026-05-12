import { PropertyColor, type PropertySet } from '../types';

const propertyColorOptions: { label: string; value: PropertySet['color'] }[] = [
  { label: 'Brown', value: PropertyColor.Brown },
  { label: 'Light Blue', value: PropertyColor.LightBlue },
  { label: 'Pink', value: PropertyColor.Pink },
  { label: 'Orange', value: PropertyColor.Orange },
  { label: 'Red', value: PropertyColor.Red },
  { label: 'Yellow', value: PropertyColor.Yellow },
  { label: 'Green', value: PropertyColor.Green },
  { label: 'Dark Blue', value: PropertyColor.DarkBlue },
  { label: 'Rail', value: PropertyColor.Rail },
  { label: 'Utility', value: PropertyColor.Utility },
  { label: 'Wild', value: 'wild' },
];

type WildcardColorSelectorProps = {
  cardName: string;
  allowedColors: PropertySet['color'][];
  onSelect: (color: PropertySet['color']) => void;
  onCancel: () => void;
};

export function WildcardColorSelector({ cardName, allowedColors, onSelect, onCancel }: WildcardColorSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-brass/30 bg-gradient-to-br from-[#1a1f25] to-[#141820] p-8 shadow-2xl">
        <h2 className="mb-2 text-2xl font-bold text-white">Choose Property Color</h2>
        <p className="mb-6 text-sm text-white/60">{cardName}</p>

        <div className="grid grid-cols-2 gap-3">
          {propertyColorOptions
            .filter((option) => allowedColors.includes(option.value))
            .map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:border-brass/50 hover:bg-brass/10 focus:border-brass/50 focus:outline-none"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="mt-6 w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5"
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
