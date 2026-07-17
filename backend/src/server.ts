import { GameRoom } from "./game.js";
import {
  type ClientMessage,
  type ServerMessage,
  parseClientMessage,
  ClientMessageType,
  ServerMessageType
} from "@taki/shared";
import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = parseInt(process.env.PORT ?? "8080");

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  if (req.url === "/logs") {
    const allLogs = Object.fromEntries(
      Array.from(rooms.entries()).map(([roomId, room]) => [roomId, room.gameLog])
    );
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(allLogs, null, 2));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

const rooms = new Map<string, GameRoom>();
const playerConnections = new Map<string, WebSocket>();

const socketAliveness = new WeakMap<WebSocket, boolean>();

const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS  = 10_000;

setInterval(() => {
  wss.clients.forEach(socket => {
    socketAliveness.set(socket, false);
    socket.ping();
    setTimeout(() => {
      if (!socketAliveness.get(socket)) {
        socket.terminate();
      }
    }, PONG_TIMEOUT_MS);
  });
}, PING_INTERVAL_MS);

interface ConnectionInfo {
  roomId: string | null;
  playerId: string | null;
}

const connectionInfos = new Map<WebSocket, ConnectionInfo>();

function send(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function makeSendToPlayer(): (playerId: string, message: ServerMessage) => void {
  return (playerId, message) => {
    const socket = playerConnections.get(playerId);
    if (socket) {
      send(socket, message);
    }
  };
}

wss.on("connection", socket => {
  socketAliveness.set(socket, true);
  socket.on("pong", () => socketAliveness.set(socket, true));
  connectionInfos.set(socket, {
    roomId: null,
    playerId: null
  });

  socket.on("message", data => {
    try {
      const message = parseClientMessage(data.toString());
      handleMessage(socket, message);
    } catch {
      send(socket, {
        type: ServerMessageType.Error,
        message: "Invalid message format"
      });
    }
  });

  socket.on("close", () => {
    const { roomId = null, playerId = null } = connectionInfos.get(socket) ?? {};
    const isTrackedConnection = !!roomId && !!playerId;
    if (isTrackedConnection && roomId && playerId) {
      playerConnections.delete(playerId);
      rooms.get(roomId)?.handlePlayerDisconnect(playerId);
    }

    connectionInfos.delete(socket);
  });
});

function handleMessage(socket: WebSocket, message: ClientMessage) {
  const info = connectionInfos.get(socket);
  if (!info) {
    return;
  }

  if (message.type === ClientMessageType.CreateRoom) {
    const existing = rooms.get(message.roomId);
    playerConnections.set(message.playerId, socket);
    info.roomId   = message.roomId;
    info.playerId = message.playerId;

    if (existing) {
      existing.handlePlayerConnect(message.playerId, message.name, message.storageId, true);
    } else {
      const room = new GameRoom(message.playerId, message.name, message.storageId);
      room.sendToPlayer = makeSendToPlayer();
      rooms.set(message.roomId, room);
      room.broadcastState();
    }

    send(socket, { type: ServerMessageType.RoomCreated });
    return;
  }

  if (message.type === ClientMessageType.JoinRoom) {
    const room = rooms.get(message.roomId);
    if (!room) {
      send(socket, {
        type: ServerMessageType.Error,
        message: "Room not found"
      });
      return;
    }

    playerConnections.set(message.playerId, socket);
    info.roomId   = message.roomId;
    info.playerId = message.playerId;
    send(socket, { type: ServerMessageType.Joined });
    room.handlePlayerConnect(message.playerId, message.name, message.storageId, false);
    return;
  }

  if (message.type === ClientMessageType.PeekRoom) {
    const room = rooms.get(message.roomId);
    if (!room) {
      return;
    }

    const peekId = `peek_${crypto.randomUUID()}`;
    playerConnections.set(peekId, socket);
    info.roomId   = message.roomId;
    info.playerId = peekId;
    room.handlePeek(peekId);
    return;
  }

  const { roomId, playerId } = info;
  const isConnectionReady = !!roomId && !!playerId;
  if (!isConnectionReady || !roomId || !playerId) {
    return;
  }

  rooms.get(roomId)?.handleMessage(playerId, message);
}

httpServer.listen(PORT, () => {
  console.log(`Taki server running on port ${PORT}`);
});
