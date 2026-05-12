import { useEffect, useMemo, useState } from 'react';
import { CardDestination, TurnPhase, type PropertySet } from './types';
import { useGameStore } from '../store/gameStore';
import { getPlayerId } from '../session/playerSession';
import { TopBar } from './components/TopBar';
import { OpponentPanel } from './components/OpponentPanel';
import { CenterTable } from './components/CenterTable';
import { HandSection } from './components/HandSection';
import { PlayerBoardSection } from './components/PlayerBoardSection';
import { InteractionOverlay } from './components/InteractionOverlay';
import { DiscardOverlay } from './components/DiscardOverlay';

export function GameTable({ roomId }: { roomId: string }) {
  const playerId = getPlayerId();
  const {
    gameState,
    turn,
    error,
    isLoading,
    listenForGameUpdates,
    startTurn,
    endTurn,
    playCard,
    rearrangeProperties,
    shouldAutoStartTurn,
    autoStartRoomId,
  } = useGameStore();

  const [isDiscarding, setIsDiscarding] = useState(false);

  useEffect(() => {
    listenForGameUpdates();
  }, [listenForGameUpdates]);

  // Auto-start turn when reconnecting and owning the turn
  useEffect(() => {
    if (shouldAutoStartTurn && autoStartRoomId === roomId && turn?.turnPhase === TurnPhase.Draw) {
      useGameStore.setState({ shouldAutoStartTurn: false });
      void startTurn(roomId);
    }
  }, [shouldAutoStartTurn, autoStartRoomId, roomId, turn?.turnPhase, startTurn]);

  const currentPlayer = useMemo(() => gameState?.players.find((p) => p.id === playerId) ?? null, [gameState, playerId]);
  const opponents = useMemo(() => gameState?.players.filter((p) => p.id !== playerId) ?? [], [gameState, playerId]);
  
  const isPlayersTurn = turn?.currentTurnPlayerId === playerId;
  const canStartTurn = isPlayersTurn && turn?.turnPhase === TurnPhase.Draw;
  const canEndTurn = isPlayersTurn && turn?.turnPhase !== TurnPhase.Draw;
  const actionsRemaining = turn?.actionsRemaining ?? 0;

  const currentTurnPlayerName = useMemo(() => {
    const p = gameState?.players.find(p => p.id === turn?.currentTurnPlayerId);
    return p?.name || 'Someone';
  }, [gameState, turn]);

  function handleEndTurn() {
    if (!currentPlayer) return;
    if (currentPlayer.hand.length > 7) {
      setIsDiscarding(true);
    } else {
      void endTurn(roomId);
    }
  }

  function handlePlayCard(cardId: string, destination: CardDestination, propertyColor?: PropertySet['color'], targets?: any, targetSetId?: string) {
    if (!currentPlayer) return;
    void playCard({
      roomId,
      cardId,
      destination,
      propertySetColor: propertyColor,
      targetSetId,
      targets: targets ?? {
        playerIds: [],
        propertyCardIds: [],
        propertySetColors: [],
        propertySetIds: [],
      },
    });
  }

  function handleRearrange(cardId: string, targetColor: string, targetSetId: string) {
    if (!currentPlayer) return;
    void rearrangeProperties({
      roomId,
      cardId,
      targetColor,
      targetSetId
    });
  }

  const activeInteractionForMe = gameState?.activeInteractions?.find(i => {
    if (i.counterStack && i.counterStack.stackState === 'active') {
      return i.counterStack.currentResponderPlayerId === playerId;
    }
    return i.targetPlayerIds.includes(playerId);
  });
  
  const otherActiveInteraction = gameState?.activeInteractions?.find(i => {
    if (i.counterStack && i.counterStack.stackState === 'active') {
      return i.counterStack.currentResponderPlayerId !== playerId;
    }
    return !i.targetPlayerIds.includes(playerId);
  });

  if (!gameState) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ink">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brass border-t-transparent mx-auto" />
          <p className="text-brass font-bold uppercase tracking-widest animate-pulse">Entering Table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col game-table-bg overflow-hidden text-white">
      {/* Top Bar */}
      <TopBar 
        currentTurnPlayerName={currentTurnPlayerName}
        isMyTurn={isPlayersTurn}
        phase={turn?.turnPhase ?? TurnPhase.Draw}
        actionsRemaining={actionsRemaining}
        deckCount={gameState.deck.length}
        discardCount={gameState.discardPile.length}
        gameEnded={gameState.gameEnded}
      />

      {/* Main Table Area */}
      <main className="flex-1 mt-14 overflow-y-auto overflow-x-hidden flex flex-col pb-[200px]">
        {/* Opponents Row */}
        <div className="flex justify-center gap-6 p-6">
          {opponents.map(opp => (
            <OpponentPanel 
              key={opp.id} 
              player={opp} 
              isTurn={opp.id === turn?.currentTurnPlayerId} 
            />
          ))}
        </div>

        {/* Center Area */}
        <div className="flex-1 flex items-center justify-center">
           <CenterTable 
             deckCount={gameState.deck.length}
             discardPile={gameState.discardPile}
             statusMessage={error || (gameState.gameEnded ? `Game Over! Winner: ${gameState.players.find(p => p.id === gameState.winner)?.name}` : undefined)}
             waitingForResponse={!!otherActiveInteraction && !activeInteractionForMe}
           />
        </div>

        {/* Start/End Turn Controls (Floating above hand) */}
        {isPlayersTurn && !gameState.gameEnded && (
          <div className="flex justify-center gap-4 mb-4">
            {canStartTurn && (
              <button
                onClick={() => startTurn(roomId)}
                className="rounded-full bg-brass px-8 py-3 font-black text-ink shadow-2xl transition hover:scale-105 hover:bg-[#e6bc72]"
              >
                START YOUR TURN
              </button>
            )}
            {canEndTurn && (
              <button
                onClick={handleEndTurn}
                className="rounded-full border-2 border-brass/40 bg-[#121417]/80 px-8 py-3 font-black text-brass shadow-2xl transition hover:scale-105 hover:bg-brass/10"
              >
                END TURN
              </button>
            )}
          </div>
        )}

        {/* Your Board (Bank & Properties) */}
        <div className="px-6 mb-8">
           <PlayerBoardSection 
             player={currentPlayer!} 
             isCurrentPlayer={true} 
             onRearrange={handleRearrange}
             isPlayersTurn={isPlayersTurn}
           />
        </div>
      </main>

      {/* Your Hand (Bottom Fan) */}
      <HandSection
        cards={currentPlayer?.hand ?? []}
        isPlayersTurn={isPlayersTurn || false}
        isLoading={isLoading}
        gameEnded={gameState.gameEnded}
        actionsRemaining={gameState.actionsRemaining}
        players={gameState.players}
        playerId={playerId}
        onPlayCard={handlePlayCard}
        onRearrange={handleRearrange}
      />

      {/* Overlays */}
      {activeInteractionForMe && (
        <InteractionOverlay 
          interaction={activeInteractionForMe} 
          playerId={playerId} 
          roomId={roomId} 
        />
      )}

      {isDiscarding && currentPlayer && (
        <DiscardOverlay
          cards={currentPlayer.hand}
          requiredCount={currentPlayer.hand.length - 7}
          onConfirm={async (cardIds) => {
            await endTurn(roomId, cardIds);
            setIsDiscarding(false);
          }}
          onCancel={() => setIsDiscarding(false)}
        />
      )}
    </div>
  );
}
