import { type Card, CardType } from '../types';

type CardContextMenuProps = {
  card: Card;
  onPlayAsProperty?: () => void;
  onPlayAsAction?: () => void;
  onBankAsMoney?: () => void;
  onDiscard?: () => void;
  onSelectWildcardColor?: () => void;
  onSelectRentColor?: () => void;
  isPlayersTurn: boolean;
  isLoading: boolean;
  gameEnded: boolean;
};

export function CardContextMenu({
  card,
  onPlayAsProperty,
  onPlayAsAction,
  onBankAsMoney,
  onDiscard,
  onSelectWildcardColor,
  onSelectRentColor,
  isPlayersTurn,
  isLoading,
  gameEnded,
}: CardContextMenuProps) {
  const isDisabled = !isPlayersTurn || isLoading || gameEnded;

  // Property cards: only show "Play Property"
  if (card.type === CardType.Property) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={onPlayAsProperty}
          disabled={isDisabled}
          className="rounded-md bg-brass/20 px-3 py-2 text-xs font-semibold text-brass transition hover:bg-brass/30 disabled:opacity-50"
          type="button"
        >
          Play Property
        </button>
      </div>
    );
  }

  // Wildcard property cards: show "Play Property" with color selection
  if (card.type === CardType.Wildcard) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={onSelectWildcardColor}
          disabled={isDisabled}
          className="rounded-md bg-brass/20 px-3 py-2 text-xs font-semibold text-brass transition hover:bg-brass/30 disabled:opacity-50"
          type="button"
        >
          Play Property
        </button>
      </div>
    );
  }

  // Money cards: show "Bank as Money" or "Play as Property"
  if (card.type === CardType.Money) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={onBankAsMoney}
          disabled={isDisabled}
          className="rounded-md bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
          type="button"
        >
          Bank Money
        </button>
      </div>
    );
  }

  // Action cards: Just Say No is bank-only as a turn play (response path is separate).
  if (card.type === CardType.Action) {
    const isJustSayNo = card.actionId === 'just-say-no';
    return (
      <div className="flex flex-col gap-2">
        {!isJustSayNo ? (
          <button
            onClick={onPlayAsAction}
            disabled={isDisabled}
            className="rounded-md bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/30 disabled:opacity-50"
            type="button"
          >
            Play Action
          </button>
        ) : null}
        <button
          onClick={onBankAsMoney}
          disabled={isDisabled}
          className="rounded-md bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
          type="button"
        >
          {isJustSayNo ? 'Bank as Money (4M)' : 'Bank as Money'}
        </button>
      </div>
    );
  }

  return null;
}
