/**
 * ACTION TYPES AND DEFINITIONS
 *
 * Defines all possible game actions and their payloads.
 * Used for type-safe action processing and validation.
 *
 * ACTION FLOW:
 * 1. Client sends action (e.g., play-card)
 * 2. Server creates Action object with unique ID + timestamp
 * 3. Action added to queue
 * 4. Processor validates against current state version
 * 5. Processor applies atomically
 * 6. Version incremented
 * 7. Acknowledgement sent to client with new version
 */
export function createActionId() {
    // Could be UUID, but for simplicity use timestamp + random
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * All possible action types in the game
 */
export var ActionType;
(function (ActionType) {
    // Turn actions
    ActionType["StartTurn"] = "start-turn";
    ActionType["EndTurn"] = "end-turn";
    // Card actions
    ActionType["PlayCard"] = "play-card";
    ActionType["RespondToAction"] = "respond-to-action";
    ActionType["ResolveInteraction"] = "resolve-interaction";
    ActionType["RearrangeProperties"] = "rearrange-properties";
    // Game lifecycle
    ActionType["StartGame"] = "start-game";
})(ActionType || (ActionType = {}));
/**
 * Create action from client request
 * Server-side only: generates ID and timestamp
 */
export function createAction(type, playerId, roomId, clientVersion, payload) {
    return {
        id: createActionId(),
        type,
        playerId,
        roomId,
        clientVersion,
        timestamp: Date.now(),
        ...payload,
    };
}
/**
 * Validate action version
 * Rejects actions from outdated client state
 *
 * VALIDATION RULES:
 * - clientVersion must match or be close to serverVersion
 * - If versions differ, could indicate network lag or out-of-order actions
 * - Reject if client is too far behind (e.g., > 5 versions)
 * - Allow small differences due to network jitter
 */
export function isActionVersionValid(clientVersion, serverVersion, toleranceVersions = 2) {
    // Client can be same version or slightly behind due to network lag
    // but shouldn't be ahead (indicates action from future)
    const versionDiff = serverVersion - clientVersion;
    return versionDiff >= 0 && versionDiff <= toleranceVersions;
}
