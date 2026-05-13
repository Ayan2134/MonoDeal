import { useEffect, useMemo, useState } from 'react';
import { Card, CardDestination, TurnPhase, type PropertySet } from './types';
import { useGameStore } from '../store/gameStore';
import { getPlayerId } from '../session/playerSession';
import { CardInspectionModal } from './components/CardInspectionModal';
import { CardEncyclopedia } from './components/CardEncyclopedia';
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
import { WinnerModal } from './components/WinnerModal';
import { PausedRecoveryOverlay } from './components/PausedRecoveryOverlay';
import { GameLogSidebar } from './components/GameLogSidebar';

export function GameTable({ roomId }: { roomId: string }) {
  const playerId = getPlayerId();
  const { room } = useLobbyStore();
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
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
  
  const isPlayersTurn = turn?.currentTurnPlayerId === playerId && !gameState?.gameEnded;
  const canStartTurn = isPlayersTurn && turn?.turnPhase === TurnPhase.Draw && !gameState?.gameEnded;
  const canEndTurn = isPlayersTurn && turn?.turnPhase !== TurnPhase.Draw && !gameState?.gameEnded;
  const actionsRemaining = turn?.actionsRemaining ?? 0;

  const currentTurnPlayerName = useMemo(() => {
    const p = gameState?.players.find(p => p.id === turn?.currentTurnPlayerId);
    return p?.name || 'Someone';
  }, [gameState, turn]);

  const inspectedPlayer = useMemo(() => 
    gameState?.players.find(p => p.id === inspectedPlayerId) ?? null, 
  [gameState, inspectedPlayerId]);

  function handleEndTurn() {
    if (!currentPlayer || gameState?.gameEnded) return;
    if (currentPlayer.hand.length > 7) {
      setIsDiscarding(true);
    } else {
      void endTurn(roomId);
    }
  }

  function handleReturnToLobby() {
    void useLobbyStore.getState().leaveRoom(roomId);
  }

  function handlePlayCard(cardId: string, destination: CardDestination, propertyColor?: PropertySet['color'], targets?: any, targetSetId?: string) {
    if (!currentPlayer || gameState?.gameEnded) return;
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
    if (!currentPlayer || gameState?.gameEnded) return;
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
      {/* Paused Recovery Overlay */}
      {room?.status === 'paused' && (
        <PausedRecoveryOverlay room={room} />
      )}

      {/* Winner Modal */}
      {gameState.winner && (
        <WinnerModal 
          winnerId={gameState.winner} 
          players={gameState.players} 
          onReturnToLobby={handleReturnToLobby}
        />
      )}

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
        onOpenEncyclopedia={() => setIsEncyclopediaOpen(true)}
      />

      {/* Game Log Sidebar */}
      <GameLogSidebar 
        logs={gameState.gameLogs || []} 
        onInspectCard={setInspectedCard}
      />

      {/* Main Table Area */}
      <main className="flex-1 mt-14 overflow-y-auto overflow-x-hidden flex flex-col gap-20 p-4 pb-64 min-h-0">
        {/* Opponents Summary Row */}
        <div className="flex flex-wrap justify-center gap-4 py-2">
          {gameState.players.filter(p => p.id !== playerId).map(p => (
            <PlayerSummaryPanel 
              key={p.id} 
              player={p} 
              isMe={false}
              isTurn={turn?.currentTurnPlayerId === p.id}
              onViewBoard={() => setInspectedPlayerId(p.id)}
            />
          ))}
        </div>

        {/* Center Table / Turn Controls */}
        <div className="flex-1 flex items-center justify-center min-h-[120px]">
          <CenterTable 
            deckCount={gameState.deck.length}
            discardPile={gameState.discardPile}
            canStartTurn={canStartTurn}
            canEndTurn={canEndTurn}
            onStartTurn={() => startTurn(roomId)}
            onEndTurn={handleEndTurn}
          />
        </div>

        {/* Player Board Section */}
        {currentPlayer && (
          <div className="max-w-6xl mx-auto w-full px-4 mb-4">
            <PlayerBoardSection 
              player={currentPlayer} 
              isCurrentPlayer={true}
              onRearrange={handleRearrange}
              isPlayersTurn={isPlayersTurn}
              onInspectCard={setInspectedCard}
            />
          </div>
        )}
      </main>

      {/* Hand Section */}
      <HandSection
        cards={currentPlayer?.hand || []}
        isPlayersTurn={isPlayersTurn}
        isLoading={false}
        gameEnded={gameState.gameEnded}
        actionsRemaining={actionsRemaining}
        players={gameState.players}
        playerId={playerId}
        onPlayCard={handlePlayCard}
        onRearrange={handleRearrange}
        onInspectCard={setInspectedCard}
      />

      {/* Modals */}
      {inspectedCard && (
        <CardInspectionModal 
          card={inspectedCard} 
          onClose={() => setInspectedCard(null)} 
        />
      )}

      {isEncyclopediaOpen && (
        <CardEncyclopedia 
          onClose={() => setIsEncyclopediaOpen(false)} 
        />
      )}

      {inspectedPlayer && (
        <ExpandedBoardModal 
          player={inspectedPlayer} 
          isCurrentPlayer={inspectedPlayer.id === playerId}
          onClose={() => setInspectedPlayerId(null)} 
          onInspectCard={setInspectedCard}
        />
      )}

      {activeInteractionForMe && (
        <InteractionOverlay 
          interaction={activeInteractionForMe} 
          playerId={playerId} 
          roomId={roomId} 
          onInspectCard={setInspectedCard}
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
          onInspectCard={setInspectedCard}
        />
      )}
    </div>
  );
}
