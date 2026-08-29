import {
  type Card,
  CardColor,
  type ClientMessage,
  ClientMessageType,
  type GameState,
  parseServerMessage,
  type ServerMessage,
  ServerMessageType
} from "@taki/shared";

export {
  CardColor,
  CardValue,
  ClientMessageType,
  ServerMessageType,
  getCardDrawPenalty,
  getRenamingPlayers,
  isDrawPenaltyCard,
  JOKER_PENALTY_AMOUNTS,
  type Card,
  type GamePlayer,
  type GameState,
  type JokerPenaltyAmount,
  type PlayerState
} from "@taki/shared";

const JOIN_TIMEOUT_MS          = 15_000;
const MAX_RECONNECT_DELAY_MS   = 10_000;
const RECONNECT_MODAL_DELAY_MS = 2_000;
const RECONNECT_BASE_DELAY_MS  = 1_000;
const DEFAULT_WS_URL           = "ws://localhost:8080";

function getWebSocketUrl() {
  return import.meta.env.VITE_WS_URL ?? DEFAULT_WS_URL;
}

// ── GameNetwork ───────────────────────────────────────────────────────────────

enum ReconnectRole {
  Host   = "host",
  Client = "client"
}

type ReconnectParams =
  | {
    type: ReconnectRole.Host;
    name: string;
    roomId: string;
    storageId: string;
  }
  | {
    type: ReconnectRole.Client;
    name: string;
    hostId: string;
    storageId: string;
  };

export class GameNetwork {
  isHost = false;
  id     = "";
  hostId = "";

  onStateUpdate: (state: GameState, hand: Card[]) => void          = () => {};
  onConnectionChange: (connected: boolean, error?: string) => void    = () => {};
  onKicked: () => void                                         = () => {};
  onServerUpdated: () => void                                  = () => {};

  private socket: WebSocket | null = null;
  private serverBuildId: string | null = null;
  private peekSocket: WebSocket | null = null;
  private reconnectParams: ReconnectParams | null = null;
  private reconnectAttempts = 0;
  private reconnectModalTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Server build tracking ────────────────────────────────

  private openSocket(onServerMessage: (message: ServerMessage) => void) {
    const socket = new WebSocket(getWebSocketUrl());
    socket.onmessage = (event: MessageEvent) => {
      const message = parseServerMessage(event.data);
      if (message.type === ServerMessageType.ServerBuild) {
        this.trackServerBuild(message.buildId);
        return;
      }

      onServerMessage(message);
    };
    return socket;
  }

  private trackServerBuild(buildId: string) {
    const isFirstBuildSeen = this.serverBuildId === null;
    if (isFirstBuildSeen) {
      this.serverBuildId = buildId;
      return;
    }

    if (this.serverBuildId !== buildId) {
      this.onServerUpdated();
    }
  }

  // ── Initialization ────────────────────────────────────────────────────────

  async initHost(name: string, roomId: string, storageId: string) {
    this.isHost = true;
    this.id     = roomId;
    this.hostId = roomId;

    return new Promise<string>((resolve, reject) => {
      let isResolved = false;
      const socket = this.openSocket(message => {
        const isRoomCreatedResponse = message.type === ServerMessageType.RoomCreated && !isResolved;
        const isUnresolvedError     = message.type === ServerMessageType.Error        && !isResolved;
        if (isRoomCreatedResponse) {
          isResolved = true;
          this.reconnectParams = {
            type: ReconnectRole.Host,
            name,
            roomId,
            storageId
          };
          resolve(roomId);
        } else if (message.type === ServerMessageType.State) {
          this.onStateUpdate(message.state, message.playerState.hand);
        } else if (message.type === ServerMessageType.Kick) {
          this.onKicked();
        } else if (isUnresolvedError && message.type === ServerMessageType.Error) {
          isResolved = true;
          reject(new Error(message.message));
        }
      });
      this.socket = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: ClientMessageType.CreateRoom,
            roomId,
            playerId: roomId,
            name,
            storageId
          })
        );
      };

      socket.onclose = () => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error("Connection closed before room was created"));
        } else {
          this.scheduleReconnect();
        }
      };

      socket.onerror = () => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error("WebSocket connection failed"));
        }
      };
    });
  }

  async initClient(hostId: string, name: string, storageId: string) {
    this.isHost = false;
    this.hostId = hostId;
    this.id     = crypto.randomUUID();

    return new Promise<void>((resolve, reject) => {
      let isResolved = false;
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error("Join timeout: host not responding"));
        }
      }, JOIN_TIMEOUT_MS);

      const socket = this.openSocket(message => {
        if (message.type === ServerMessageType.State) {
          this.onStateUpdate(message.state, message.playerState.hand);

          const isMyPlayerInGame = message.state.players.some(player => player.id === this.id);
          const isJoinConfirmed  = !isResolved && isMyPlayerInGame;
          if (isJoinConfirmed) {
            isResolved = true;
            clearTimeout(timeoutId);
            this.reconnectParams = {
              type: ReconnectRole.Client,
              name,
              hostId,
              storageId
            };
            this.reconnectAttempts = 0;
            this.onConnectionChange(true);
            resolve();
          }
        } else if (message.type === ServerMessageType.Kick) {
          clearTimeout(timeoutId);
          this.onKicked();
        } else if (message.type === ServerMessageType.Error) {
          isResolved = true;
          clearTimeout(timeoutId);
          reject(new Error(message.message));
        }
      });
      this.socket = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: ClientMessageType.JoinRoom,
            roomId: hostId,
            playerId: this.id,
            name,
            storageId
          })
        );
      };

      socket.onclose = () => {
        clearTimeout(timeoutId);

        if (!isResolved) {
          isResolved = true;
          reject(new Error("Connection closed before joining"));
        } else {
          this.scheduleReconnect();
        }
      };

      socket.onerror = () => {
        clearTimeout(timeoutId);

        if (!isResolved) {
          isResolved = true;
          reject(new Error("WebSocket connection failed"));
        }
      };
    });
  }

  async startPeeking(hostId: string) {
    const socket = this.openSocket(() => {});
    this.peekSocket = socket;
    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: ClientMessageType.PeekRoom,
          roomId: hostId
        })
      );
    };
  }

  stopPeeking() {
    this.peekSocket?.close();
    this.peekSocket = null;
  }

  private scheduleReconnect() {
    const isReconnectViable = this.reconnectParams !== null;
    if (!isReconnectViable) {
      return;
    }

    this.reconnectAttempts++;
    const delayMs = Math.min(RECONNECT_BASE_DELAY_MS * this.reconnectAttempts, MAX_RECONNECT_DELAY_MS);
    this.reconnectModalTimer = setTimeout(() => {
      this.onConnectionChange(false);
    }, RECONNECT_MODAL_DELAY_MS);
    setTimeout(() => this.attemptReconnect(), delayMs);
  }

  private async attemptReconnect() {
    const reconnectParams = this.reconnectParams;
    const isReconnectViable = reconnectParams !== null;
    if (!isReconnectViable || !reconnectParams) {
      return;
    }

    try {
      const params = reconnectParams;
      if (params.type === ReconnectRole.Host) {
        await this.initHost(params.name, params.roomId, params.storageId);
      } else {
        await this.initClient(params.hostId, params.name, params.storageId);
      }

      this.reconnectAttempts = 0;

      if (this.reconnectModalTimer) {
        clearTimeout(this.reconnectModalTimer);
        this.reconnectModalTimer = null;
      }

      this.onConnectionChange(true);
    } catch {
      this.scheduleReconnect();
    }
  }

  // ── Send actions ──────────────────────────────────────────────────────────

  private send(message: ClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  sendPlayCard(cardId: number, newColor?: CardColor) {
    this.send({
      type: ClientMessageType.PlayCard,
      playerId: this.id,
      cardId,
      newColor
    });
  }

  sendDrawCard() {
    this.send({
      type: ClientMessageType.DrawCard,
      playerId: this.id
    });
  }

  sendCloseTaki() {
    this.send({
      type: ClientMessageType.CloseTaki,
      playerId: this.id
    });
  }

  sendStartGame() {
    this.send({
      type: ClientMessageType.StartGame,
      playerId: this.id
    });
  }

  sendAcceptPlusThree() {
    this.send({
      type: ClientMessageType.AcceptPlusThree,
      playerId: this.id
    });
  }

  sendPlayPlusThreeBreaker(cardId: number) {
    this.send({
      type: ClientMessageType.PlayPlusThreeBreaker,
      playerId: this.id,
      cardId
    });
  }

  sendRename(name: string) {
    if (this.reconnectParams) {
      this.reconnectParams.name = name;
    }

    this.send({
      type: ClientMessageType.Rename,
      playerId: this.id,
      name
    });
  }

  sendPreviewName(name: string) {
    this.send({
      type: ClientMessageType.PreviewName,
      playerId: this.id,
      name
    });
  }

  sendCancelRename() {
    this.send({
      type: ClientMessageType.CancelRename,
      playerId: this.id
    });
  }

  kickPlayer(targetId: string) {
    this.send({
      type: ClientMessageType.KickPlayer,
      playerId: this.id,
      targetId
    });
  }

  reorderPlayers(playerIds: string[]) {
    this.send({
      type: ClientMessageType.ReorderPlayers,
      playerId: this.id,
      playerIds
    });
  }

  setNoMercyMode(enabled: boolean) {
    this.send({
      type: ClientMessageType.SetNoMercy,
      playerId: this.id,
      enabled
    });
  }

  skipDisconnectedPlayer() {
    this.send({
      type: ClientMessageType.SkipDisconnected,
      playerId: this.id
    });
  }

  holdDisconnectedTurn(isHeld: boolean) {
    this.send({
      type: ClientMessageType.HoldDisconnectedTurn,
      playerId: this.id,
      isHeld
    });
  }
}
