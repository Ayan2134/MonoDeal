import type { Server, Socket } from 'socket.io';
import { roomManager } from '../rooms/roomManager.js';
import type { GameState } from '../game/state.js';
import type { GameStateResult, TurnUpdate } from '../game/turn.js';
import type { PlayCardResult } from '../game/playCard.js';
import { toStackSnapshot, type StackSnapshot } from '../game/stack.js';
import { processPlayCard, processRespondToAction, processStartTurn, processEndTurn, processResolveInteraction, processRearrangeProperties } from '../game/action-processing.js';
import type {
  CreateRoomPayload,
  EndTurnPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  PlayCardPayload,
  PublicRoom,
  ReconnectPlayerPayload,
  RespondToActionPayload,
  RoomResult,
  StartGamePayload,
  StartTurnPayload,
  RearrangePropertiesPayload,
} from '../rooms/types.js';

/**
 * RECONNECT CALLBACK RESULT
 *
 * When a player reconnects successfully, the callback includes:
 * - room: Updated room state with player reconnected
 * - gameState: Full game state if game is in progress
 * - turnOwned: Whether the reconnecting player owns the current turn
 */
type ReconnectResult = RoomResult & {
  gameState?: GameState;
  turnOwned?: boolean;
};

type ServerToClientEvents = {
  // ROOM LIFECYCLE
  'room-updated': (room: PublicRoom) => void;
  'room-error': (message: string) => void;
  // GAME STATE SYNC
  'game-updated': (gameState: GameState) => void;
  'turn-updated': (turn: TurnUpdate) => void;
  'stack-updated': (stack: StackSnapshot) => void;
  'response-window-updated': (payload: { roomId: string; isOpen: boolean; deadlineAt: number | null }) => void;
  // GAME STATE RECOVERY ON RECONNECT
  // Sent to reconnecting player to restore full game state
  // Client uses this to hydrate store and restore UI exactly
  'game-state-sync': (payload: { roomId: string; gameState: GameState; turnOwned: boolean }) => void;
  // PLAYER CONNECTION STATUS
  // Broadcast when a player reconnects so others know game can resume
  'player-reconnected': (payload: { roomId: string; playerId: string; playerName: string }) => void;
  // Broadcast when a player disconnects so others show "waiting" state
  'player-disconnected': (payload: { roomId: string; playerId: string; playerName: string }) => void;
  // GAME END
  'game-ended': (gameState: GameState) => void;
  'winner-announced': (payload: { roomId: string; winner: string }) => void;
};

type ClientToServerEvents = {
  'create-room': (payload: CreateRoomPayload, callback: (result: RoomResult) => void) => void;
  'join-room': (payload: JoinRoomPayload, callback: (result: RoomResult) => void) => void;
  'reconnect-player': (payload: ReconnectPlayerPayload, callback: (result: ReconnectResult) => void) => void;
  'leave-room': (payload: LeaveRoomPayload, callback?: (result: RoomResult) => void) => void;
  'start-game': (payload: StartGamePayload, callback: (result: RoomResult) => void) => void;
  'start-turn': (payload: StartTurnPayload, callback: (result: GameStateResult) => void) => void;
  'end-turn': (payload: EndTurnPayload, callback: (result: GameStateResult) => void) => void;
  'play-card': (payload: PlayCardPayload, callback: (result: PlayCardResult) => void) => void;
  'rearrange-properties': (payload: RearrangePropertiesPayload, callback: (result: GameStateResult) => void) => void;
  'respond-to-action': (payload: RespondToActionPayload, callback: (result: GameStateResult) => void) => void;
  'resolve-interaction': (payload: any, callback: (result: GameStateResult) => void) => void;
};

export type MonodealServer = Server<ClientToServerEvents, ServerToClientEvents>;
type MonodealSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const responseTimers = new Map<string, ReturnType<typeof setTimeout>>();
// Track turn disconnect timers to auto-end stuck turns
const turnDisconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

function logSocketEvent(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[socket] ${message}`, details);
  } else {
    console.info(`[socket] ${message}`);
  }
}

function logSocketError(message: string, error: unknown, details?: Record<string, unknown>) {
  const payload = {
    ...details,
    error: error instanceof Error ? error.message : String(error),
  };
  console.error(`[socket] ${message}`, payload);
}

function broadcastRoom(io: MonodealServer, room: PublicRoom) {
  logSocketEvent('emit room-updated', { roomId: room.roomId, roomCode: room.roomCode });
  io.to(room.roomId).emit('room-updated', room);
}

function emitRoomResult(socket: MonodealSocket, result: RoomResult) {
  if (!result.ok) {
    logSocketEvent('emit room-error', { socketId: socket.id, message: result.error });
    socket.emit('room-error', result.error);
  }
}

function broadcastGameState(io: MonodealServer, gameState: GameState) {
  logSocketEvent('emit game-updated', { roomId: gameState.roomId, turnPlayer: gameState.currentTurnPlayerId });
  io.to(gameState.roomId).emit('game-updated', gameState);
}

function broadcastTurn(io: MonodealServer, turn: TurnUpdate) {
  logSocketEvent('emit turn-updated', { roomId: turn.roomId, turnPlayer: turn.currentTurnPlayerId });
  io.to(turn.roomId).emit('turn-updated', turn);
}

function broadcastStack(io: MonodealServer, gameState: GameState) {
  const snapshot = toStackSnapshot(gameState);
  io.to(snapshot.roomId).emit('stack-updated', snapshot);
  io.to(snapshot.roomId).emit('response-window-updated', {
    roomId: snapshot.roomId,
    isOpen: snapshot.responseOpen,
    deadlineAt: snapshot.responseDeadlineAt,
  });
}

function clearResponseResolutionTimer(roomId: string) {
  const timer = responseTimers.get(roomId);

  if (timer) {
    clearTimeout(timer);
    responseTimers.delete(roomId);
  }
}

function scheduleResponseResolution(io: MonodealServer, roomId: string, deadlineAt: number | null) {
  clearResponseResolutionTimer(roomId);

  if (!deadlineAt) {
    return;
  }

  const delay = Math.max(0, deadlineAt - Date.now());
  const timer = setTimeout(() => {
    responseTimers.delete(roomId);
    const resolved = roomManager.resolvePendingAction(roomId);

    if (!resolved.ok) {
      logSocketEvent('resolve-pending-action failed', { roomId, error: resolved.error });
      return;
    }

    broadcastGameState(io, resolved.gameState);
    broadcastTurn(io, resolved.turn);
    broadcastStack(io, resolved.gameState);

    if (resolved.gameState.gameEnded) {
      broadcastWinner(io, resolved.gameState);
    }
  }, delay);

  responseTimers.set(roomId, timer);
}

function broadcastWinner(io: MonodealServer, gameState: GameState) {
  if (!gameState.winner) {
    return;
  }
  logSocketEvent('emit winner-announced', { roomId: gameState.roomId, winner: gameState.winner });
  io.to(gameState.roomId).emit('winner-announced', { roomId: gameState.roomId, winner: gameState.winner });
  io.to(gameState.roomId).emit('game-ended', gameState);
}

function handleUnexpectedError(socket: MonodealSocket, callback: ((result: RoomResult) => void) | undefined, error: unknown) {
  logSocketError('handler error', error, { socketId: socket.id });
  const result: RoomResult = { ok: false, error: 'Unexpected server error. Please try again.' };
  callback?.(result);
  emitRoomResult(socket, result);
}

function handleUnexpectedGameError(
  socket: MonodealSocket,
  callback: ((result: GameStateResult) => void) | undefined,
  error: unknown,
) {
  logSocketError('handler error', error, { socketId: socket.id });
  const result: GameStateResult = { ok: false, error: 'Unexpected server error. Please try again.' };
  callback?.(result);
}

function handleUnexpectedPlayError(
  socket: MonodealSocket,
  callback: ((result: PlayCardResult) => void) | undefined,
  error: unknown,
) {
  logSocketError('handler error', error, { socketId: socket.id });
  const result: PlayCardResult = { ok: false, error: 'Unexpected server error. Please try again.' };
  callback?.(result);
}

function scheduleTurnDisconnectTimeout(io: MonodealServer, roomId: string, playerId: string) {
  // AUTO-END STUCK TURNS:
  // If a player is disconnected during their turn for more than 30 seconds,
  // automatically end their turn so the game doesn't stall
  // This only triggers if they don't reconnect within 30 seconds
  const timerKey = `${roomId}:${playerId}`;

  // Clear any existing timer
  const existingTimer = turnDisconnectTimers.get(timerKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    const gameState = roomManager.getGameState(roomId);

    // Only auto-end turn if player is still disconnected and still owns the turn
    if (gameState && gameState.currentTurnPlayerId === playerId) {
      logSocketEvent('auto-ending stuck turn due to prolonged disconnect', { roomId, playerId });
      const result = processEndTurn({
        playerId,
        roomId,
        clientVersion: gameState.version,
      });

      if (result.ok) {
        broadcastGameState(io, result.gameState);
        broadcastTurn(io, result.turn);
        logSocketEvent('auto-ended turn successfully', { roomId, playerId });
      }
    }

    turnDisconnectTimers.delete(timerKey);
  }, 30_000); // 30 second grace period before auto-ending turn

  turnDisconnectTimers.set(timerKey, timer);
}

function clearTurnDisconnectTimeout(roomId: string, playerId: string) {
  const timerKey = `${roomId}:${playerId}`;
  const timer = turnDisconnectTimers.get(timerKey);

  if (timer) {
    clearTimeout(timer);
    turnDisconnectTimers.delete(timerKey);
  }
}

export function registerSocketHandlers(io: MonodealServer, socket: MonodealSocket) {
  // Debugging flow: log inbound events, validate, emit acknowledgements, then
  // broadcast room updates so the client can see every step in the lifecycle.
  logSocketEvent('client connected', { socketId: socket.id, recovered: socket.recovered });

  socket.on('create-room', (payload, callback) => {
    try {
      logSocketEvent('create-room', { socketId: socket.id, playerId: payload.playerId });
      // The socket carries the network connection, while payload.playerId carries
      // the durable browser identity. The server trusts only validated payloads
      // and decides what room state is created.
      const result = roomManager.createRoom(payload, socket.id);

      if (result.ok) {
        socket.join(result.room.roomId);
        logSocketEvent('room joined', { socketId: socket.id, roomId: result.room.roomId, roomCode: result.room.roomCode });
        callback(result);
        broadcastRoom(io, result.room);
        return;
      }

      logSocketEvent('create-room failed', { socketId: socket.id, error: result.error });
      callback(result);
      emitRoomResult(socket, result);
    } catch (error) {
      handleUnexpectedError(socket, callback, error);
    }
  });

  socket.on('join-room', (payload, callback) => {
    try {
      logSocketEvent('join-room', { socketId: socket.id, playerId: payload.playerId, roomCode: payload.roomCode, roomId: payload.roomId });
      // A join may arrive from a typed room code or an invite link roomId. Both
      // paths go through the same authoritative validation and capacity checks.
      const result = roomManager.joinRoom(payload, socket.id);

      if (result.ok) {
        socket.join(result.room.roomId);
        logSocketEvent('room joined', { socketId: socket.id, roomId: result.room.roomId, roomCode: result.room.roomCode });
        callback(result);
        broadcastRoom(io, result.room);
        return;
      }

      logSocketEvent('join-room failed', { socketId: socket.id, error: result.error });
      callback(result);
      emitRoomResult(socket, result);
    } catch (error) {
      handleUnexpectedError(socket, callback, error);
    }
  });

  socket.on('reconnect-player', (payload, callback) => {
    try {
      logSocketEvent('reconnect-player', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId });
      // RECONNECTION FLOW:
      // 1. Browser refresh creates new socket.id (Socket.IO gives new ID each time)
      // 2. Client sends reconnect-player with persistent playerId + roomId
      // 3. Server validates playerId exists in room
      // 4. Server updates socket binding and clears removal timer
      // 5. Server sends back room + full game state (if game is active)
      // 6. Client hydrates store and restores UI exactly as it was
      const result = roomManager.reconnectPlayer(payload, socket.id);

      if (!result.ok) {
        logSocketEvent('reconnect-player failed', { socketId: socket.id, error: result.error });
        callback(result);
        emitRoomResult(socket, result);
        return;
      }

      // SUCCESSFUL RECONNECTION
      socket.join(result.room.roomId);
      logSocketEvent('room rejoined', { socketId: socket.id, roomId: result.room.roomId, roomCode: result.room.roomCode });

      // If game is in progress, send full game state to reconnecting client
      const gameState = roomManager.getGameStateForReconnect(result.room.roomId);
      const turnOwned = gameState?.currentTurnPlayerId === payload.playerId;

      // GAME STATE SYNC CALLBACK:
      // Send game state to the reconnecting client so it can restore UI
      // Include turnOwned flag so client knows if they should trigger start-turn
      const reconnectCallback: ReconnectResult = {
        ok: true,
        room: result.room,
        ...(gameState && { gameState }),
        ...(gameState && { turnOwned }),
      };

      callback(reconnectCallback);

      // GAME STATE SYNC EVENT:
      // Send full game state to reconnecting player
      // Client will hydrate Zustand store with this state
      if (gameState) {
        socket.emit('game-state-sync', {
          roomId: result.room.roomId,
          gameState,
          turnOwned,
        });
      }

      // BROADCAST RECONNECTION:
      // Notify other players that this player reconnected so they know
      // the game can resume (turn is no longer paused waiting for them)
      const room = result.room;
      const reconnectingPlayer = room.players.find((p) => p.playerId === payload.playerId);
      if (reconnectingPlayer) {
        // Clear the turn disconnect timeout since player reconnected
        clearTurnDisconnectTimeout(result.room.roomId, payload.playerId);
        logSocketEvent('emit player-reconnected', { roomId: result.room.roomId, playerId: payload.playerId });
        io.to(result.room.roomId).emit('player-reconnected', {
          roomId: result.room.roomId,
          playerId: payload.playerId,
          playerName: reconnectingPlayer.name,
        });
      }

      // BROADCAST UPDATED ROOM:
      // All clients get room update (turn ownership, turn phase, etc.)
      broadcastRoom(io, result.room);

      // If game is in progress, broadcast game state to all players
      if (gameState) {
        broadcastGameState(io, gameState);
      }
    } catch (error) {
      handleUnexpectedError(socket, callback, error);
    }
  });

  socket.on('leave-room', (payload, callback) => {
    try {
      logSocketEvent('leave-room', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId });
      socket.leave(payload.roomId);
      const updatedRoom = roomManager.leaveRoom(payload);

      if (updatedRoom) {
        broadcastRoom(io, updatedRoom);
        callback?.({ ok: true, room: updatedRoom });
        return;
      }

      logSocketEvent('leave-room failed', { socketId: socket.id, error: 'Room closed.' });
      callback?.({ ok: false, error: 'Room closed.' });
    } catch (error) {
      handleUnexpectedError(socket, callback, error);
    }
  });

  socket.on('start-game', (payload, callback) => {
    try {
      logSocketEvent('start-game', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId });
      // No game logic starts here yet. The only state change is moving the room
      // from waiting to started after host and player-count validation.
      const result = roomManager.startGame(payload);

      if (result.ok) {
        callback(result);
        broadcastRoom(io, result.room);
        const gameState = roomManager.getGameState(result.room.roomId);
        if (gameState) {
          broadcastGameState(io, gameState);
          broadcastTurn(io, {
            roomId: gameState.roomId,
            currentTurnPlayerId: gameState.currentTurnPlayerId,
            actionsRemaining: gameState.actionsRemaining,
            turnPhase: gameState.turnPhase,
          });
        }
        return;
      }

      logSocketEvent('start-game failed', { socketId: socket.id, error: result.error });
      callback(result);
      emitRoomResult(socket, result);
    } catch (error) {
      handleUnexpectedError(socket, callback, error);
    }
  });

  socket.on('start-turn', (payload, callback) => {
    try {
      logSocketEvent('start-turn', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId });
      const result = processStartTurn(payload);

      if (result.ok) {
        callback(result);
        broadcastGameState(io, result.gameState);
        broadcastTurn(io, result.turn);
        return;
      }

      logSocketEvent('start-turn failed', { socketId: socket.id, error: result.error });
      callback(result);
    } catch (error) {
      handleUnexpectedGameError(socket, callback, error);
    }
  });

  socket.on('end-turn', (payload, callback) => {
    try {
      logSocketEvent('end-turn', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId });
      const result = processEndTurn(payload);

      if (result.ok) {
        callback(result);
        broadcastGameState(io, result.gameState);
        broadcastTurn(io, result.turn);
        return;
      }

      logSocketEvent('end-turn failed', { socketId: socket.id, error: result.error });
      callback(result);
    } catch (error) {
      handleUnexpectedGameError(socket, callback, error);
    }
  });

  socket.on('play-card', (payload, callback) => {
    try {
      logSocketEvent('play-card', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId, cardId: payload.cardId });
      const result = processPlayCard(payload);

      if (result.ok) {
        callback(result);
        broadcastGameState(io, result.gameState);
        broadcastTurn(io, result.turn);
        broadcastStack(io, result.gameState);
        if (result.gameState.responseWindow.isOpen) {
          scheduleResponseResolution(io, result.gameState.roomId, result.gameState.responseWindow.deadlineAt);
        } else {
          clearResponseResolutionTimer(result.gameState.roomId);
        }
        if (result.gameState.gameEnded) {
          broadcastWinner(io, result.gameState);
        }
        return;
      }

      logSocketEvent('play-card failed', { socketId: socket.id, error: result.error });
      callback(result);
    } catch (error) {
      handleUnexpectedPlayError(socket, callback, error);
    }
  });

  socket.on('rearrange-properties', (payload, callback) => {
    try {
      logSocketEvent('rearrange-properties', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId, cardId: payload.cardId });
      const result = processRearrangeProperties(payload);

      if (result.ok) {
        callback(result);
        broadcastGameState(io, result.gameState);
        broadcastTurn(io, result.turn);
        return;
      }

      logSocketEvent('rearrange-properties failed', { socketId: socket.id, error: result.error });
      callback(result);
    } catch (error) {
      handleUnexpectedGameError(socket, callback, error);
    }
  });

  socket.on('respond-to-action', (payload, callback) => {
    try {
      logSocketEvent('respond-to-action', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId });
      const result = processRespondToAction(payload);

      if (result.ok) {
        callback(result);
        broadcastGameState(io, result.gameState);
        broadcastTurn(io, result.turn);
        broadcastStack(io, result.gameState);
        if (result.gameState.responseWindow.isOpen) {
          scheduleResponseResolution(io, result.gameState.roomId, result.gameState.responseWindow.deadlineAt);
        } else {
          clearResponseResolutionTimer(result.gameState.roomId);
        }
        return;
      }

      logSocketEvent('respond-to-action failed', { socketId: socket.id, error: result.error });
      callback(result);
    } catch (error) {
      handleUnexpectedGameError(socket, callback, error);
    }
  });

  socket.on('resolve-interaction', (payload, callback) => {
    try {
      logSocketEvent('resolve-interaction', { socketId: socket.id, ...payload });
      const result = processResolveInteraction(payload);

      if (result.ok) {
        callback(result);
        broadcastGameState(io, result.gameState);
        broadcastTurn(io, result.turn);
        // Interaction might have finished the game? (unlikely from payment, but possible)
        if (result.gameState.gameEnded) {
          broadcastWinner(io, result.gameState);
        }
        return;
      }

      logSocketEvent('resolve-interaction failed', { socketId: socket.id, error: result.error });
      callback(result);
    } catch (error) {
      handleUnexpectedGameError(socket, callback, error);
    }
  });

  socket.on('disconnect', (reason) => {
    try {
      logSocketEvent('client disconnected', { socketId: socket.id, reason });
      // DISCONNECT HANDLING WITH GRACE PERIOD:
      // When a player disconnects (network drop, browser close, etc.):
      // 1. Mark player as disconnected in room (don't remove yet)
      // 2. Clear socketId so they can reconnect with new socket.id
      // 3. Start removal timer (grace period: 1 min for lobby, 10 min for active game)
      // 4. Broadcast disconnect to other players so they see "waiting" state
      //
      // If player reconnects within grace period:
      // - reconnect-player event arrives with same playerId
      // - server clears removal timer, updates socketId, marks connected
      //
      // If grace period expires:
      // - removal callback fires, player removed from room
      // - other players see player completely gone
      const updatedRooms = roomManager.markDisconnected(socket.id, (room) => {
        if (room) {
          broadcastRoom(io, room);
        }
      });

      for (const room of updatedRooms) {
        // BROADCAST DISCONNECT EVENT:
        // Notify other players that this player disconnected
        // Client shows "Waiting for [PlayerName]..." UI indicator
        const disconnectedPlayer = room.players.find((p) => p.status === 'disconnected');

        logSocketEvent('emit player-disconnected', { roomId: room.roomId, playerId: disconnectedPlayer?.playerId });
        io.to(room.roomId).emit('player-disconnected', {
          roomId: room.roomId,
          playerId: disconnectedPlayer?.playerId ?? '',
          playerName: disconnectedPlayer?.name ?? '',
        });

        // If disconnected player owns the turn during an active game,
        // schedule auto-end of their turn after 30 seconds
        if (disconnectedPlayer && room.status === 'in_progress') {
          const gameState = roomManager.getGameState(room.roomId);
          if (gameState && gameState.currentTurnPlayerId === disconnectedPlayer.playerId) {
            logSocketEvent('scheduling turn disconnect timeout', { roomId: room.roomId, playerId: disconnectedPlayer.playerId });
            scheduleTurnDisconnectTimeout(io, room.roomId, disconnectedPlayer.playerId);
          }
        }

        broadcastRoom(io, room);

        // SYNC GAME STATE ON DISCONNECT:
        // Ensure all other players see the "disconnected" status on the game board
        if (room.status === 'in_progress' || room.status === 'paused') {
          const gameState = roomManager.getGameState(room.roomId);
          if (gameState) {
            broadcastGameState(io, gameState);
          }
        }
      }
    } catch (error) {
      handleUnexpectedError(socket, undefined, error);
    }
  });

  socket.on('error', (error) => {
    logSocketError('socket error', error, { socketId: socket.id });
  });
}
