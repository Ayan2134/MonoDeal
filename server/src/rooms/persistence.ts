import { supabase } from '../db/supabase.js';
import type { Room, RoomStatus, RecoveryMetadata, ReconnectMetadata } from './types.js';
import type { GameState } from '../game/state.js';

function parseGameStateJson(value: unknown): GameState | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!parsed || typeof parsed !== 'object' || Object.keys(parsed as object).length === 0) {
    return undefined;
  }

  return parsed as GameState;
}

export async function saveRoomSnapshot(room: Room) {
  if (!supabase) return;

  try {
    // SERIALIZATION
    // We strip socketId from player records before persisting to JSONB.
    // Socket identity is ephemeral and transport-specific, whereas 
    // playerId is durable and browser-scoped.
    const serializedPlayers = room.players.map(p => ({
      playerId: p.playerId,
      name: p.name,
      isHost: p.isHost,
      status: p.status,
      lastSeen: p.lastSeen,
      disconnectedAt: p.disconnectedAt
    }));

    // Construct the snapshot payload using snake_case for DB columns.
    // NOTE: room_code, max_players, host_id, and players are NOT columns in the DB.
    // We store them inside recovery_metadata to ensure the Room object can be fully restored.
    const snapshot = {
      room_id: room.roomId,
      status: room.status,
      game_state_json: room.gameState ?? {},
      room_version: room.roomVersion,
      created_at: new Date(room.createdAt).toISOString(),
      updated_at: new Date(room.updatedAt).toISOString(),
      last_activity_at: new Date(room.lastActivityAt).toISOString(),
      winner_player_id: room.gameState?.winner || null,
      recovery_metadata: {
        ...(room.recoveryMetadata || {}),
        roomCode: room.roomCode,
        maxPlayers: room.maxPlayers,
        hostId: room.hostId,
        players: serializedPlayers,
      },
      reconnect_metadata: room.reconnectMetadata || {},
    };

    const { error } = await supabase
      .from('rooms')
      .upsert(snapshot, { onConflict: 'room_id' });

    if (error) {
      console.error(`[Persistence] Failed to save snapshot for room ${room.roomCode}:`, error);
    } else {
      console.info(`[Persistence] snapshot saved: Room ${room.roomCode} (v${room.roomVersion})`);
    }
  } catch (error) {
    console.error(`[Persistence] failed serialization for room ${room.roomCode}:`, error);
  }
}

export async function loadRoomSnapshot(roomId: string): Promise<Room | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        console.error(`[Persistence] Failed to load snapshot for room ${roomId}:`, error);
      }
      return null;
    }

    // DESERIALIZATION: map snake_case DB fields back to camelCase
    const gameState = parseGameStateJson(data.game_state_json);
    const recoveryMetadata = data.recovery_metadata as any;

    const room: Room = {
      roomId: data.room_id,
      roomCode: recoveryMetadata?.roomCode || 'UNKNOWN',
      maxPlayers: recoveryMetadata?.maxPlayers || 4,
      hostId: recoveryMetadata?.hostId || '',
      status: data.status as RoomStatus,
      players: (recoveryMetadata?.players || []).map((p: any) => ({
        ...p,
        socketId: undefined, // Sockets are not persistent
      })),
      gameState,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
      lastActivityAt: new Date(data.last_activity_at).getTime(),
      roomVersion: data.room_version,
      recoveryMetadata: recoveryMetadata as RecoveryMetadata,
      reconnectMetadata: data.reconnect_metadata as Record<string, ReconnectMetadata>,
    };

    console.info(`[Persistence] snapshot loaded: Room ${room.roomCode} (v${room.roomVersion})`);
    return room;
  } catch (error) {
    console.error(`[Persistence] failed deserialization for room ${roomId}:`, error);
    return null;
  }
}

export async function loadAllActiveRooms(): Promise<Room[]> {
  if (!supabase) return [];

  try {
    console.info('[Persistence] Hydrating room registry from database...');
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .in('status', ['in_progress', 'paused']);

    if (error) {
      console.error('[Persistence] Failed to load active rooms:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.info('[Persistence] No active rooms found in database.');
      return [];
    }

    const rooms: Room[] = [];
    const restartRecoveryId = crypto.randomUUID();

    for (const record of data) {
      try {
        const gameState = parseGameStateJson(record.game_state_json);
        const recoveryMetadata = record.recovery_metadata as any;
        
        // RECOVERY RULES:
        // 1. All players initially disconnected (sockets are gone)
        // 2. Room is paused until players return
        // 3. Track recovery metadata for audit/debugging
        const players = (recoveryMetadata?.players || []).map((p: any) => ({
          ...p,
          socketId: undefined,
          status: 'disconnected' as const,
        }));

        const room: Room = {
          roomId: record.room_id,
          roomCode: recoveryMetadata?.roomCode || 'UNKNOWN',
          maxPlayers: recoveryMetadata?.maxPlayers || 4,
          hostId: recoveryMetadata?.hostId || '',
          status: 'paused', // Always pause on restore
          players,
          gameState,
          createdAt: new Date(record.created_at).getTime(),
          updatedAt: new Date(record.updated_at).getTime(),
          lastActivityAt: new Date(record.last_activity_at).getTime(),
          roomVersion: record.room_version,
          reconnectMetadata: record.reconnect_metadata as Record<string, ReconnectMetadata>,
          recoveryMetadata: {
            ...recoveryMetadata,
            restoredAt: Date.now(),
            restartRecoveryId,
            recoveryReason: 'backend_restart',
            awaitingReconnectPlayers: players.map((p: any) => p.playerId),
          },
        };

        rooms.push(room);
        console.info(`[RoomRecovery] Room ${room.roomCode} restored (v${room.roomVersion})`);
      } catch (err) {
        console.error(`[RoomRecovery] Corrupted snapshot detected for room ${record.room_id}:`, err);
        // We don't throw here so other rooms can still be restored
      }
    }

    console.info(`[Persistence] Successfully restored ${rooms.length} active rooms.`);
    return rooms;
  } catch (error) {
    console.error('[Persistence] Global restoration error:', error);
    return [];
  }
}
