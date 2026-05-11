const rooms = new Map();
function createRoomCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let index = 0; index < 6; index += 1) {
        code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return rooms.has(code) ? createRoomCode() : code;
}
export function createRoom(host) {
    const roomCode = createRoomCode();
    const lobby = {
        roomCode,
        players: [{ ...host, isHost: true }],
    };
    rooms.set(roomCode, lobby);
    return lobby;
}
export function joinRoom(roomCode, player) {
    const lobby = rooms.get(roomCode);
    if (!lobby) {
        return null;
    }
    const existingPlayerIndex = lobby.players.findIndex((currentPlayer) => currentPlayer.id === player.id);
    if (existingPlayerIndex >= 0) {
        const existingPlayer = lobby.players[existingPlayerIndex];
        if (existingPlayer) {
            lobby.players[existingPlayerIndex] = { ...player, isHost: existingPlayer.isHost };
        }
    }
    else {
        lobby.players.push({ ...player, isHost: false });
    }
    return lobby;
}
export function leaveRoomsBySocket(socketId) {
    const changedRooms = [];
    for (const lobby of rooms.values()) {
        const nextPlayers = lobby.players.filter((player) => player.id !== socketId);
        if (nextPlayers.length !== lobby.players.length) {
            lobby.players = nextPlayers;
            changedRooms.push(lobby);
        }
        if (lobby.players.length === 0) {
            rooms.delete(lobby.roomCode);
        }
        else if (!lobby.players.some((player) => player.isHost)) {
            const nextHost = lobby.players[0];
            if (nextHost) {
                nextHost.isHost = true;
            }
        }
    }
    return changedRooms;
}
