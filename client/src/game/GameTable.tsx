import { useEffect, useMemo, useState } from 'react';
import { CardDestination, TurnPhase, type PropertySet } from './types';
import { useGameStore } from '../store/gameStore';
import { getPlayerId } from '../session/playerSession';
import { useLobbyStore } from '../store/lobbyStore';
import { env } from '../config/env';
import { TopBar } from './components/TopBar';
import { PlayerSummaryPanel } from './components/PlayerSummaryPanel';
import { ExpandedBoardModal } from './components/ExpandedBoardModal';
import { CenterTable } from './components/CenterTable';
import { HandSection } from './components/HandSection';
import { PlayerBoardSection } from './components/PlayerBoardSection';
import { InteractionOverlay } from './components/InteractionOverlay';
import { DiscardOverlay } from './components/DiscardOverlay';

export function GameTable({ roomId }: { roomId: string }) {
  const playerId = getPlayerId();
  const { room } = useLobbyStore();
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
  const [inspectedPlayerId, setInspectedPlayerId] = useState<string | null>(null);

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
  
  const isPlayersTurn = turn?.currentTurnPlayerId === playerId;
  const canStartTurn = isPlayersTurn && turn?.turnPhase === TurnPhase.Draw;
  const canEndTurn = isPlayersTurn && turn?.turnPhase !== TurnPhase.Draw;
  const actionsRemaining = turn?.actionsRemaining ?? 0;

  const currentTurnPlayerName = useMemo(() => {
    const p = gameState?.players.find(p => p.id === turn?.currentTurnPlayerId);
    return p?.name || 'Someone';
  }, [gameState, turn]);

  const inspectedPlayer = useMemo(() => 
    gameState?.players.find(p => p.id === inspectedPlayerId) ?? null, 
  [gameState, inspectedPlayerId]);

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
        roomCode={room?.roomCode}
        inviteLink={room ? `${env.appUrl}${room.invitePath}` : undefined}
      />

      {/* Main Table Area */}
      <main className="flex-1 mt-14 overflow-y-auto overflow-x-hidden flex flex-col justify-between p-4 pb-48 scrollbar-hide">
        {/* Opponents Summary Row */}
        <div className="flex flex-wrap justify-center gap-4 py-2">
          {gameState.players.filter(p => p.id !== playerId).map(p => (
            <PlayerSummaryPanel 
              key={p.id} 
              player={p} 
              isMe={false}
              isTurn={p.id === turn?.currentTurnPlayerId} 
              onViewBoard={() => setInspectedPlayerId(p.id)}
            />
          ))}
        </div>

        {/* Center Area - Deck, Discard, Turn Controls */}
        <div className="flex-1 flex items-center justify-center">
           <CenterTable 
             deckCount={gameState.deck.length}
             discardPile={gameState.discardPile}
             statusMessage={error || (gameState.gameEnded ? `Game Over! Winner: ${gameState.players.find(p => p.id === gameState.winner)?.name}` : undefined)}
             waitingForResponse={!!otherActiveInteraction && !activeInteractionForMe}
             canStartTurn={canStartTurn}
             canEndTurn={canEndTurn}
             onStartTurn={() => startTurn(roomId)}
             onEndTurn={handleEndTurn}
           />
        </div>

        {/* Your Board (Bank & Properties) - POSITIONED TO FIT FRAME */}
        <div className="w-full max-w-6xl mx-auto mb-32">
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
      {inspectedPlayer && (
        <ExpandedBoardModal
          player={inspectedPlayer}
          isCurrentPlayer={inspectedPlayer.id === playerId}
          isPlayersTurn={isPlayersTurn}
          onClose={() => setInspectedPlayerId(null)}
          onRearrange={handleRearrange}
        />
      )}

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
