/** How long a disconnected player keeps their seat before being removed from the room. */
export const DISCONNECT_GRACE_MS = 10 * 60 * 1000;

/** If the turn owner stays disconnected, auto-end their turn so the table does not stall. */
export const TURN_DISCONNECT_TIMEOUT_MS = 30_000;
