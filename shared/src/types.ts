export const CardColor = {
  Red: "red",
  Blue: "blue",
  Green: "green",
  Yellow: "yellow",
  None: "none"
} as const;
export type CardColor = (typeof CardColor)[keyof typeof CardColor];

export const CardValue = {
  One: "1",
  Three: "3",
  Four: "4",
  Five: "5",
  Six: "6",
  Seven: "7",
  Eight: "8",
  Nine: "9",
  PlusTwo: "+2",
  PlusSix: "+6",
  PlusTen: "+10",
  Stop: "stop",
  Taki: "taki",
  ChangeColor: "change_color",
  Plus: "+",
  Direction: "direction",
  SuperTaki: "super_taki",
  PlusThree: "+3",
  PlusThreeBreaker: "+3_block",
  Crown: "crown",
  PlusFour: "+4"
} as const;
export type CardValue = (typeof CardValue)[keyof typeof CardValue];

export const DRAW_PENALTY_BY_VALUE: Partial<Record<CardValue, number>> = {
  [CardValue.PlusTwo]: 2,
  [CardValue.PlusFour]: 4,
  [CardValue.PlusSix]: 6,
  [CardValue.PlusTen]: 10
};

export function getDrawPenalty(value: CardValue): number {
  return DRAW_PENALTY_BY_VALUE[value] ?? 0;
}

export function isDrawPenaltyCard(value: CardValue): boolean {
  return getDrawPenalty(value) > 0;
}

export type Card = {
  id: number;
  color: CardColor;
  value: CardValue;
};

export type GamePlayer = {
  id: string;
  name: string;
  previewName?: string;
  handCount: number;
  isConnected: boolean;
  storageId: string;
};

export function getRenamingPlayers(players: GamePlayer[]): GamePlayer[] {
  return players.filter(player => player.previewName);
}

export type GameState = {
  players: GamePlayer[];
  iCurrentPlayer: number;
  discardPile: Card[];
  direction: 1 | -1;
  winner: string | null;
  activeTakiColor: CardColor | null;
  isSuperTakiActive: boolean;
  deckCount: number;
  drawPenaltyValue: number;
  isPlusActive: boolean;
  pendingPlusThree: {
    fromId: string;
    waiting: string[];
    isBreakable: boolean;
    acceptedCardIds: Record<string, number[]>;
  } | null;
  isCrownActive: boolean;
  isNoMercyMode: boolean;
  eliminatedPlayers: string[];
  wins: Record<string, number>;
  peekingCount: number;
  turnStartedAt: number;
  isIdleTimerHeld: boolean;
};

export type PlayerState = {
  id: string;
  hand: Card[];
};

export enum ServerMessageType {
  RoomCreated = "room_created",
  Joined      = "joined",
  State       = "state",
  Kick        = "kick",
  ServerBuild = "server_build",
  Error       = "error"
}

export enum ClientMessageType {
  CreateRoom           = "create_room",
  JoinRoom             = "join_room",
  PeekRoom             = "peek_room",
  PlayCard             = "play_card",
  DrawCard             = "draw_card",
  CloseTaki            = "close_taki",
  StartGame            = "start_game",
  AcceptPlusThree      = "accept_plus_three",
  PlayPlusThreeBreaker = "play_plus_three_breaker",
  Rename               = "rename",
  PreviewName          = "preview_name",
  CancelRename         = "cancel_rename",
  KickPlayer           = "kick_player",
  ReorderPlayers       = "reorder_players",
  SetNoMercy           = "set_no_mercy",
  SkipDisconnected     = "skip_disconnected",
  HoldDisconnectedTurn = "hold_disconnected_turn"
}

export type ServerMessage =
  | { type: ServerMessageType.RoomCreated }
  | { type: ServerMessageType.Joined }
  | {
    type: ServerMessageType.State;
    state: GameState;
    playerState: PlayerState;
  }
  | { type: ServerMessageType.Kick }
  | {
    type: ServerMessageType.ServerBuild;
    buildId: string;
  }
  | {
    type: ServerMessageType.Error;
    message: string;
  };

export type ClientMessage =
  | {
    type: ClientMessageType.CreateRoom;
    roomId: string;
    playerId: string;
    name: string;
    storageId: string;
  }
  | {
    type: ClientMessageType.JoinRoom;
    roomId: string;
    playerId: string;
    name: string;
    storageId: string;
  }
  | {
    type: ClientMessageType.PeekRoom;
    roomId: string;
  }
  | {
    type: ClientMessageType.PlayCard;
    playerId: string;
    cardId: number;
    newColor?: CardColor;
  }
  | {
    type: ClientMessageType.DrawCard;
    playerId: string;
  }
  | {
    type: ClientMessageType.CloseTaki;
    playerId: string;
  }
  | {
    type: ClientMessageType.StartGame;
    playerId: string;
  }
  | {
    type: ClientMessageType.AcceptPlusThree;
    playerId: string;
  }
  | {
    type: ClientMessageType.PlayPlusThreeBreaker;
    playerId: string;
    cardId: number;
  }
  | {
    type: ClientMessageType.Rename;
    playerId: string;
    name: string;
  }
  | {
    type: ClientMessageType.PreviewName;
    playerId: string;
    name: string;
  }
  | {
    type: ClientMessageType.CancelRename;
    playerId: string;
  }
  | {
    type: ClientMessageType.KickPlayer;
    playerId: string;
    targetId: string;
  }
  | {
    type: ClientMessageType.ReorderPlayers;
    playerId: string;
    playerIds: string[];
  }
  | {
    type: ClientMessageType.SetNoMercy;
    playerId: string;
    enabled: boolean;
  }
  | {
    type: ClientMessageType.SkipDisconnected;
    playerId: string;
  }
  | {
    type: ClientMessageType.HoldDisconnectedTurn;
    playerId: string;
    isHeld: boolean;
  };

export function parseServerMessage(data: string): ServerMessage {
  return JSON.parse(data);
}

export function parseClientMessage(data: string): ClientMessage {
  return JSON.parse(data);
}
