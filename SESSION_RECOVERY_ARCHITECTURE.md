/**
 * MONODEAL MULTIPLAYER SESSION RECOVERY ARCHITECTURE
 *
 * This document describes the robust session recovery and reconnection system
 * that enables players to seamlessly resume active games after disconnections.
 *
 * ============================================================================
 * CORE PRINCIPLES
 * ============================================================================
 *
 * 1. PERSISTENT PLAYER IDENTITY
 *    - playerId: Stored in browser localStorage, survives all reconnections
 *    - socketId: Ephemeral, changes every time Socket.IO reconnects
 *    - Server NEVER uses socket.id as player authority
 *
 * 2. SERVER-AUTHORITATIVE
 *    - All game state lives on server
 *    - Client sends intents; server validates and applies
 *    - On reconnect, client receives full game state from server
 *
 * 3. GRACEFUL DEGRADATION
 *    - Disconnected players stay in game during grace period
 *    - Turn ownership preserved; game pauses implicitly
 *    - Other players see "Waiting for [Name]..." indicator
 *
 * ============================================================================
 * DISCONNECT FLOW
 * ============================================================================
 *
 * When a player's socket disconnects:
 *
 *   1. Client detects disconnect (Socket.IO automatic)
 *   2. Socket.on('disconnect') fires on server
 *   3. Server marks player: status='disconnected'
 *      - socket.id cleared
 *      - lastSeen updated to current time
 *      - disconnectedAt set to current time
 *   4. Removal timer started (DISCONNECT_GRACE_MS = 10 minutes)
 *   4b. If they own the turn, a separate 30s timer may auto-end that turn
 *   5. Room update broadcasted (players see status=disconnected)
 *   6. player-disconnected event sent to all clients
 *
 * During grace period:
 *   - Player remains in room (seat preserved)
 *   - Game state unchanged
 *   - If disconnected player owned turn: game implicitly paused
 *   - Other players can proceed normally (depends on game design)
 *
 * If grace period expires:
 *   - Player removed from room
 *   - Room update broadcasted
 *   - Game continues without them
 *
 * ============================================================================
 * RECONNECT FLOW
 * ============================================================================
 *
 * When a player reconnects within grace period:
 *
 *   1. Browser refresh/network restored → Socket.IO automatic reconnect
 *   2. New socket.id assigned (old one discarded)
 *   3. SocketProvider.handleConnect() fires
 *   4. Calls store.recoverPlayerSession()
 *   5. Sends 'reconnect-player' event with:
 *      - playerId (from localStorage)
 *      - roomId (from localStorage)
 *
 * Server side:
 *   1. socket.on('reconnect-player') handler called
 *   2. Validates playerId exists in roomId
 *   3. If valid:
 *      a. Finds existing player record
 *      b. Clears removal timer
 *      c. Updates player.socketId = new socket.id
 *      d. Sets player.status = 'connected'
 *      e. Updates lastSeen timestamp
 *      f. Socket joins room
 *   4. Sends callback with:
 *      - room (updated state)
 *      - gameState (full state if game active)
 *      - turnOwned (whether player owns current turn)
 *   5. Emits 'game-state-sync' event to reconnecting player
 *   6. Emits 'player-reconnected' broadcast to all in room
 *   7. Broadcasts 'room-updated' to all in room
 *
 * Client side:
 *   1. Callback received in reconnectPlayer()
 *   2. Saves roomId in localStorage
 *   3. Sets room in lobbyStore
 *   4. 'game-state-sync' event received
 *   5. gameStore hydrates with gameState
 *   6. If turnOwned, client should call startTurn()
 *   7. UI restores exactly as it was
 *
 * ============================================================================
 * PLAYER MODEL CHANGES
 * ============================================================================
 *
 * Before:
 *   type Player = {
 *     playerId: string;
 *     name: string;
 *     isHost: boolean;
 *     status: 'connected' | 'disconnected';
 *     socketId?: string;
 *     disconnectedAt?: number;
 *   }
 *
 * After (enhanced):
 *   type Player = {
 *     // PERSISTENT IDENTITY - Stored in browser localStorage
 *     playerId: string;
 *     // EPHEMERAL TRANSPORT - Changes on every Socket.IO reconnection
 *     socketId?: string;
 *     // PLAYER INFO
 *     name: string;
 *     isHost: boolean;
 *     // CONNECTION STATE
 *     status: 'connected' | 'disconnected';
 *     // SESSION TRACKING - Timestamps for disconnect timeout
 *     lastSeen?: number;  // When player was last active (NEW)
 *     disconnectedAt?: number;  // When disconnect started (existing)
 *   }
 *
 * ============================================================================
 * SOCKET EVENTS
 * ============================================================================
 *
 * NEW SERVER → CLIENT EVENTS:
 *
 *   'game-state-sync'
 *   - Sent to reconnecting player
 *   - Payload: { roomId, gameState, turnOwned }
 *   - Allows client to restore UI exactly
 *
 *   'player-reconnected'
 *   - Broadcast to all in room
 *   - Payload: { roomId, playerId, playerName }
 *   - Other players see "Player rejoined!" notification
 *   - Game can resume if was waiting for them
 *
 *   'player-disconnected'
 *   - Broadcast to all in room
 *   - Payload: { roomId, playerId, playerName }
 *   - Other players see "Waiting for [Name]..." indicator
 *   - Game pauses if disconnected player owns turn
 *
 * EXISTING EVENTS (enhanced):
 *
 *   'reconnect-player'
 *   - Now returns ReconnectResult with gameState + turnOwned
 *   - Callback includes full game state for reconnecting player
 *
 * ============================================================================
 * TURN OWNERSHIP HANDLING
 * ============================================================================
 *
 * If disconnected player owns the current turn:
 *
 *   1. Turn state unchanged (still their turn)
 *   2. Game implicitly paused (they can't act while offline)
 *   3. Other players see "Waiting for [Name]..." in turn indicator
 *   4. No explicit turn pause mechanism needed
 *
 * When disconnected turn player reconnects:
 *
 *   1. Receives game-state-sync with turnOwned=true
 *   2. Should call store.startTurn() to draw 2 cards
 *   3. Enters action phase
 *   4. Game resumes normally
 *
 * ============================================================================
 * TIMEOUT SYSTEM
 * ============================================================================
 *
 * Grace Period Constants (server/src/rooms/constants.ts):
 *   - DISCONNECT_GRACE_MS: 10 minutes (600,000 ms) — keep the seat
 *   - TURN_DISCONNECT_TIMEOUT_MS: 30 seconds — auto-end their turn only
 *
 * These are different on purpose. A refresh or dropped Wi-Fi should not
 * kick you out of a match. The table should still move if you vanish
 * mid-turn.
 *
 * Timeline:
 *   T+0s:  Player disconnects → markDisconnected() called
 *   T+0s:  Seat-removal timer scheduled for T+600s
 *   T+0s:  If they own the turn, turn-end timer scheduled for T+30s
 *   T+0s:  Broadcast room update
 *   T+1s:  Player reconnects → reconnect-player event
 *   T+1s:  clearCleanupTimer() cancels the T+600s timer
 *   T+1s:  connectExistingPlayer() restores player
 *   T+1s:  Broadcast reconnection
 *
 *   If they stay disconnected through their turn:
 *   T+30s:  scheduleTurnDisconnectTimeout ends the turn
 *   T+30s:  Player still seated; next connected player plays
 *
 *   If player doesn't reconnect at all:
 *   T+600s: Timeout fires → scheduleDisconnectedPlayerRemoval callback
 *   T+600s: removePlayer() called
 *   T+600s: Player removed from room
 *   T+600s: onExpire callback broadcasts final room state
 *
 * ============================================================================
 * FRONTEND IMPLEMENTATION
 * ============================================================================
 *
 * KEY POINTS:
 *
 * 1. SocketProvider handles lifecycle:
 *    - On connect: calls store.recoverPlayerSession()
 *    - On disconnect: logs but doesn't remove from store
 *    - On reconnect_failed: shows error "Reconnection attempts failed"
 *
 * 2. LobbyStore manages reconnection:
 *    - recoverPlayerSession() called on connect
 *    - Sends reconnect-player with playerId + roomId
 *    - Updates room on success
 *    - Clears room + shows error on failure
 *
 * 3. GameStore listens for status changes:
 *    - 'game-state-sync': Hydrate store with full game state
 *    - 'player-reconnected': Update UI to show player rejoined
 *    - 'player-disconnected': Update UI to show waiting indicator
 *
 * 4. UI Components can show:
 *    - "Waiting for [Player]..." during disconnect
 *    - "[Player] reconnected!" on reconnection
 *    - Reconnection status in turn indicator
 *
 * ============================================================================
 * RECONNECT MANAGER MODULE
 * ============================================================================
 *
 * File: src/game/reconnect.ts
 *
 * Exported functions:
 *
 *   validateReconnection(room, playerId, roomId, gracePeriodMs)
 *   - Called by RoomManager.reconnectPlayer
 *   - Validates reconnection attempt
 *   - Checks player exists, session not expired
 *   - Returns validation + player data
 *
 *   serializeGameStateForReconnect(gameState)
 *   - Prepares game state for client hydration
 *   - Currently returns as-is (JSON serializable)
 *
 *   logReconnectionEvent(event)
 *   - Records reconnection for debugging/analytics
 *   - Logs success/failure + session duration
 *
 *   shouldPauseTurn(gameState, playerId)
 *   - Determines if turn should be paused
 *   - Paused if disconnected player owns turn
 *
 *   prepareTurnResume(gameState, playerId)
 *   - Prepares turn update when player reconnects
 *   - Used to notify clients turn can resume
 *
 * ============================================================================
 * ERROR HANDLING
 * ============================================================================
 *
 * Reconnection failures:
 *
 *   Error: "Room not found"
 *   → Room was already cleaned up
 *   → Player must rejoin (create or join new room)
 *
 *   Error: "Player is not part of this room"
 *   → playerId doesn't exist in roomId
 *   → Player must join room first
 *
 *   Error: "Session expired"
 *   → Disconnected > 10 minutes
 *   → Player was already removed
 *   → Player must rejoin
 *
 * ============================================================================
 * TESTING SCENARIOS
 * ============================================================================
 *
 * 1. SHORT NETWORK BLIP (< 1 sec)
 *    - Client auto-reconnects before timer fires
 *    - recoverPlayerSession() called
 *    - reconnect-player succeeds
 *    - Game resumes seamlessly
 *
 * 2. PAGE REFRESH DURING GAME
 *    - Browser clears all memory
 *    - localStorage contains playerId + roomId
 *    - On load: SocketProvider.handleConnect() calls recoverPlayerSession()
 *    - Game state restored from server
 *    - UI renders exactly as before
 *
 * 3. LONGER DISCONNECT (2-3 minutes)
 *    - markDisconnected() called
 *    - Timer scheduled
 *    - Player gone from other clients' view
 *    - Player clicks "Reconnect" or page auto-reconnects
 *    - reconnect-player still succeeds (within grace period)
 *    - Game resumes
 *
 * 4. SESSION TIMEOUT (> 10 minutes)
 *    - Grace period expires
 *    - scheduleDisconnectedPlayerRemoval fires
 *    - removePlayer() called
 *    - Player no longer in room
 *    - reconnect-player fails: "Player is not part of this room"
 *    - Player must rejoin game
 *
 * 5. MULTIPLE PLAYERS DISCONNECT
 *    - Each gets their own timer
 *    - Each can reconnect independently
 *    - Other disconnections don't affect grace period
 *
 * 6. DISCONNECTED PLAYER OWNS TURN
 *    - Turn state unchanged
 *    - Game waits for them
 *    - On reconnect: turnOwned=true
 *    - Client calls startTurn() to resume
 *
 * ============================================================================
 * FUTURE ENHANCEMENTS
 * ============================================================================
 *
 * 1. Different grace periods for lobby vs. active game
 *    - Lobby: 1 minute (quick recovery only)
 *    - Active game: 10 minutes (generous recovery)
 *
 * 2. Automatic turn skip — implemented (30 seconds, TURN_DISCONNECT_TIMEOUT_MS)
 *
 * 3. Persistent game state to disk
 *    - Currently all in-memory
 *    - Could persist to database
 *    - Recover from server crash
 *
 * 4. Client-side reconnection UI
 *    - Show "Attempting to reconnect..."
 *    - Count down grace period
 *    - Show "Session expired" if > grace period
 *
 * 5. Spectator mode for disconnected players
 *    - Player can watch but not play during disconnect
 *    - Reconnect to resume control
 *
 * ============================================================================
 */
