import {
  CardColor,
  CardValue,
  ClientMessageType,
  ServerMessageType,
  getDrawPenalty,
  getRenamingPlayers,
  isDrawPenaltyCard,
  type Card,
  type GameState,
  type PlayerState,
  type ServerMessage,
  type ClientMessage
} from "@taki/shared";

const IDLE_TIMEOUT_MS        = 45_000;
const IDLE_TIMER_INTERVAL_MS = 1_000;
const INITIAL_HAND_SIZE      = 8;
const NO_MERCY_CARD_LIMIT    = 25;
const PLUS_THREE_CARD_COUNT  = 3;

enum GameLogEvent {
  GameStart = "game_start",
  Play      = "play",
  Draw      = "draw",
  CloseTaki = "close_taki"
}

const WILD_VALUES = new Set<CardValue>([
  CardValue.ChangeColor,
  CardValue.SuperTaki,
  CardValue.PlusThree,
  CardValue.Crown,
  CardValue.PlusFour
]);

interface GameStateSnapshot {
  iCurrentPlayer: number;
  currentPlayerName: string;
  direction: number;
  activeTakiColor: CardColor | null;
  isSuperTakiActive: boolean;
  drawPenaltyValue: number;
  isPlusActive: boolean;
  isCrownActive: boolean;
  hasPendingPlusThree: boolean;
  handCounts: Record<string, number>;
  hands: Record<string, { color: CardColor;
    value: CardValue; }[]>;
}

interface GameLogEntry {
  timestamp: string;
  event: GameLogEvent;
  playerName: string;
  playerId: string;
  card?: { color: CardColor;
    value: CardValue; };
  before: GameStateSnapshot;
  after: GameStateSnapshot;
}

export class GameRoom {
  readonly hostId: string;
  gameState: GameState;
  fullPlayers: PlayerState[];
  deck: Card[] = [];
  peekingPlayerIds = new Set<string>();
  gameLog: GameLogEntry[] = [];
  private idleTimerInterval: ReturnType<typeof setInterval> | null = null;

  sendToPlayer: (playerId: string, message: ServerMessage) => void = () => {};

  constructor(hostId: string, name: string, storageId: string) {
    this.hostId = hostId;
    this.gameState = {
      players: [],
      iCurrentPlayer: 0,
      discardPile: [],
      direction: -1,
      winner: null,
      activeTakiColor: null,
      isSuperTakiActive: false,
      deckCount: 0,
      drawPenaltyValue: 0,
      isPlusActive: false,
      pendingPlusThree: null,
      isCrownActive: false,
      isNoMercyMode: false,
      eliminatedPlayers: [],
      wins: {},
      peekingCount: 0,
      turnStartedAt: 0,
      isIdleTimerHeld: false
    };
    this.deck        = this.createDeck();
    this.fullPlayers = [{
      id: hostId,
      hand: []
    }];
    this.gameState.players.push({
      id: hostId,
      name,
      handCount: 0,
      isConnected: true,
      storageId
    });
  }

  // ── Connection lifecycle ──────────────────────────────────────────────────

  handlePlayerConnect(playerId: string, name: string, storageId: string, isHost: boolean) {
    const byStorageId = this.gameState.players.find(player => player.storageId === storageId);
    if (byStorageId) {
      this.reconnectPlayer(byStorageId, playerId, storageId);
      return;
    }

    const isGameInProgress = this.gameState.discardPile.length > 0;
    if (isGameInProgress) {
      const byName = this.gameState.players.filter(player => player.name === name && !player.isConnected);
      if (byName.length === 1) {
        this.reconnectPlayer(byName[0], playerId, storageId);
        return;
      }
    }

    if (!isHost) {
      let uniqueName = name;
      let nameSuffix = 2;
      while (this.gameState.players.some(player => player.name === uniqueName)) {
        uniqueName = `${name} ${nameSuffix++}`;
      }
      name = uniqueName;

      const newHand: Card[] = [];
      if (isGameInProgress) {
        for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
          if (this.deck.length === 0) {
            const top = this.gameState.discardPile.pop()!;
            this.deck = this.gameState.discardPile;
            this.shuffle(this.deck);
            this.gameState.discardPile = [top];
          }

          if (this.deck.length > 0) {
            newHand.push(this.drawOneCard());
          }
        }
      }

      this.fullPlayers.push({
        id: playerId,
        hand: newHand
      });
      this.gameState.players.push({
        id: playerId,
        name,
        handCount: newHand.length,
        isConnected: true,
        storageId
      });
    }

    this.broadcastState();
  }

  handlePlayerDisconnect(playerId: string) {
    if (this.peekingPlayerIds.has(playerId)) {
      this.peekingPlayerIds.delete(playerId);
      this.gameState.peekingCount = this.peekingPlayerIds.size;
      this.broadcastState();
      return;
    }

    const player = this.findPlayer(playerId);
    if (player) {
      player.isConnected = false;
      delete player.previewName;
      this.broadcastState();
    }
  }

  handlePeek(peekId: string) {
    this.peekingPlayerIds.add(peekId);
    this.gameState.peekingCount = this.peekingPlayerIds.size;
    this.broadcastState();
  }

  // ── Message dispatch ──────────────────────────────────────────────────────

  handleMessage(playerId: string, message: ClientMessage) {
    switch (message.type) {
      case ClientMessageType.PlayCard:
        this.playCard(playerId, message.cardId, message.newColor);
        break;
      case ClientMessageType.DrawCard:
        this.drawCard(playerId);
        break;
      case ClientMessageType.CloseTaki:
        this.closeTaki(playerId);
        break;
      case ClientMessageType.StartGame:
        this.startGame(playerId);
        break;
      case ClientMessageType.AcceptPlusThree:
        this.handlePlusThreeResponse(playerId, false, null);
        break;
      case ClientMessageType.PlayPlusThreeBreaker:
        this.handlePlusThreeResponse(playerId, true, message.cardId);
        break;
      case ClientMessageType.Rename:
        this.handleRename(playerId, message.name);
        break;
      case ClientMessageType.PreviewName:
        this.handlePreviewName(playerId, message.name);
        break;
      case ClientMessageType.CancelRename:
        this.handleCancelRename(playerId);
        break;
      case ClientMessageType.KickPlayer:
        if (playerId === this.hostId) {
          this.kickPlayer(message.targetId);
        }

        break;
      case ClientMessageType.ReorderPlayers:
        if (playerId === this.hostId) {
          this.reorderPlayers(message.playerIds);
        }

        break;
      case ClientMessageType.SetNoMercy:
        if (playerId === this.hostId) {
          this.setNoMercyMode(message.enabled);
        }

        break;
      case ClientMessageType.SkipDisconnected:
        if (playerId === this.hostId) {
          this.skipDisconnectedPlayer();
        }

        break;
      case ClientMessageType.HoldDisconnectedTurn:
        if (playerId === this.hostId) {
          this.gameState.isIdleTimerHeld = message.isHeld;
          this.broadcastState();
        }

        break;
    }
  }

  private get isMatchInProgress(): boolean {
    return this.gameState.discardPile.length > 0 && !this.gameState.winner;
  }

  // ── State broadcast ───────────────────────────────────────────────────────

  broadcastState() {
    this.gameState.deckCount = this.deck.length;
    for (const fullPlayer of this.fullPlayers) {
      this.sendToPlayer(fullPlayer.id, {
        type: ServerMessageType.State,
        state: this.gameState,
        playerState: fullPlayer
      });
    }
  }

  // ── Lookup helpers ────────────────────────────────────────────────────────

  private findPlayer(playerId: string): GamePlayer | undefined {
    return this.gameState.players.find(player => player.id === playerId);
  }

  private findFullPlayer(playerId: string): PlayerState | undefined {
    return this.fullPlayers.find(player => player.id === playerId);
  }

  private logAndBroadcast(
    event: GameLogEvent,
    playerName: string,
    playerId: string,
    before: GameStateSnapshot,
    card?: { color: CardColor;
      value: CardValue; }
  ) {
    this.gameLog.push({
      timestamp: new Date().toISOString(),
      event,
      playerName,
      playerId,
      ...(card ? { card } : {}),
      before,
      after: this.snapshotState()
    });
    this.broadcastState();
  }

  // ── Host-only actions ─────────────────────────────────────────────────────

  private kickPlayer(targetId: string) {
    this.sendToPlayer(targetId, { type: ServerMessageType.Kick });

    const iPlayer = this.gameState.players.findIndex(player => player.id === targetId);
    if (iPlayer !== -1) {
      this.gameState.players.splice(iPlayer, 1);

      if (this.gameState.iCurrentPlayer >= iPlayer) {
        this.gameState.iCurrentPlayer = Math.max(0, this.gameState.iCurrentPlayer - 1);
      }
    }

    const iFullPlayer = this.fullPlayers.findIndex(player => player.id === targetId);
    if (iFullPlayer !== -1) {
      this.fullPlayers.splice(iFullPlayer, 1);
    }

    this.broadcastState();
  }

  private skipDisconnectedPlayer() {
    const current = this.gameState.players[this.gameState.iCurrentPlayer];
    if (!current.isConnected) {
      for (let safety = this.gameState.players.length; safety > 0; safety--) {
        this.nextTurn(null);
        const next = this.gameState.players[this.gameState.iCurrentPlayer];
        const isNextPlayerReady = next.isConnected && !this.gameState.eliminatedPlayers.includes(next.id);
        if (isNextPlayerReady) {
          break;
        }
      }

      this.broadcastState();
    }
  }

  private handleRename(playerId: string, name: string) {
    if (this.isMatchInProgress) {
      return;
    }

    const player = this.findPlayer(playerId);
    if (!player) {
      return;
    }

    const isDuplicate = this.gameState.players.some(
      other => other.id !== playerId && other.name === name
    );
    if (isDuplicate) {
      return;
    }

    player.name = name;
    delete player.previewName;
    this.broadcastState();
  }

  private handlePreviewName(playerId: string, name: string) {
    if (this.isMatchInProgress) {
      return;
    }

    const player = this.findPlayer(playerId);
    if (player) {
      player.previewName = name;
      this.broadcastState();
    }
  }

  private handleCancelRename(playerId: string) {
    const player = this.findPlayer(playerId);
    if (player) {
      delete player.previewName;
      this.broadcastState();
    }
  }

  private setNoMercyMode(enabled: boolean) {
    this.gameState.isNoMercyMode = enabled;
    this.broadcastState();
  }

  private reorderPlayers(playerIds: string[]) {
    this.gameState.players = playerIds
      .map(id => this.gameState.players.find(player => player.id === id))
      .filter((player): player is GamePlayer => player !== undefined);

    this.fullPlayers = playerIds
      .map(id => this.fullPlayers.find(player => player.id === id))
      .filter((player): player is PlayerState => player !== undefined);

    this.broadcastState();
  }

  // ── Game logic ────────────────────────────────────────────────────────────

  private reconnectPlayer(player: GamePlayer, playerId: string, storageId: string) {
    const oldId = player.id;
    const iPlayer = this.gameState.players.indexOf(player);
    player.id          = playerId;
    player.storageId   = storageId;
    player.isConnected = true;
    const fullPlayer = this.findFullPlayer(oldId) ?? this.fullPlayers[iPlayer];
    if (fullPlayer) {
      fullPlayer.id = playerId;
    }

    this.updatePlayerId(oldId, playerId);

    const isReconnectedCurrentPlayer = this.gameState.discardPile.length > 0
      && !this.gameState.winner
      && this.gameState.players[this.gameState.iCurrentPlayer].id === playerId;
    if (isReconnectedCurrentPlayer) {
      this.gameState.turnStartedAt = Date.now();
    }

    this.broadcastState();
  }

  private advanceTurnOrEndTaki(player: PlayerState, card: Card) {
    if (!this.gameState.activeTakiColor) {
      this.nextTurn(card);
      return;
    }

    const hasPlayable = player.hand.some(handCard => handCard.color === this.gameState.activeTakiColor);
    if (!hasPlayable) {
      this.gameState.activeTakiColor   = null;
      this.gameState.isSuperTakiActive = false;
      this.nextTurn(card);
    }
  }

  private updatePlayerId(oldId: string, newId: string) {
    if (oldId === newId) {
      return;
    }

    if (this.gameState.winner === oldId) {
      this.gameState.winner = newId;
    }

    if (this.gameState.wins[oldId] !== undefined) {
      this.gameState.wins[newId] = this.gameState.wins[oldId];
      delete this.gameState.wins[oldId];
    }

    const pending = this.gameState.pendingPlusThree;
    if (pending) {
      if (pending.fromId === oldId) {
        pending.fromId = newId;
      }

      const iWaiting = pending.waiting.indexOf(oldId);
      if (iWaiting >= 0) {
        pending.waiting[iWaiting] = newId;
      }
    }

    const iEliminated = this.gameState.eliminatedPlayers.indexOf(oldId);
    if (iEliminated >= 0) {
      this.gameState.eliminatedPlayers[iEliminated] = newId;
    }
  }

  private createDeck() {
    const colors = [CardColor.Red, CardColor.Blue, CardColor.Green, CardColor.Yellow];
    const coloredSlots: [CardValue, number][] = [
      [CardValue.One,       2],
      [CardValue.Three,     2],
      [CardValue.Four,      2],
      [CardValue.Five,      2],
      [CardValue.Six,       2],
      [CardValue.Seven,     2],
      [CardValue.Eight,     2],
      [CardValue.Nine,      2],
      [CardValue.PlusTwo,   2],
      [CardValue.Stop,      2],
      [CardValue.Taki,      2],
      [CardValue.Plus,      2],
      [CardValue.Direction, 2],
      [CardValue.PlusSix,   1],
      [CardValue.PlusTen,   1]
    ];
    const wildSlots: [CardValue, number][] = [
      [CardValue.ChangeColor,      4],
      [CardValue.SuperTaki,        4],
      [CardValue.PlusThree,        2],
      [CardValue.PlusThreeBreaker, 2],
      [CardValue.Crown,            2],
      [CardValue.PlusFour,         4]
    ];

    let idCounter = 0;
    const deck: Card[] = [];

    for (const color of colors) {
      for (const [value, slots] of coloredSlots) {
        for (let i = 0; i < slots; i++) {
          deck.push({
            id: idCounter,
            color,
            value
          });
          idCounter++;
        }
      }
    }

    for (const [value, slots] of wildSlots) {
      for (let i = 0; i < slots; i++) {
        if (crypto.getRandomValues(new Uint32Array(1))[0] % 2 === 0) {
          deck.push({
            id: idCounter,
            color: CardColor.None,
            value
          });
          idCounter++;
        }
      }
    }

    return deck;
  }

  private drawOneCard() {
    const index = crypto.getRandomValues(new Uint32Array(1))[0] % this.deck.length;
    return this.deck.splice(index, 1)[0];
  }

  private shuffle<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private isCardPlayableAtStart(card: Card, startCard: Card) {
    return WILD_VALUES.has(card.value)
      || card.color === startCard.color
      || card.value === startCard.value;
  }

  private startGame(requestingPlayerId: string) {
    const isProceedingToNextRound  = this.gameState.winner !== null;
    const isAnyOtherPlayerRenaming = getRenamingPlayers(this.gameState.players)
      .some(player => player.id !== requestingPlayerId);
    if (isProceedingToNextRound && isAnyOtherPlayerRenaming) {
      return;
    }

    const prevWinnerId = this.gameState.winner;
    this.deck = this.createDeck();
    this.shuffle(this.deck);
    this.gameState.winner      = null;

    for (const player of this.fullPlayers) {
      player.hand = this.deck.splice(0, INITIAL_HAND_SIZE);
      const gamePlayer = this.findPlayer(player.id);
      if (gamePlayer) {
        gamePlayer.handCount = player.hand.length;
      }
    }

    const iWinner = this.gameState.players.findIndex(player => player.id === prevWinnerId);
    this.gameState.iCurrentPlayer  = iWinner >= 0 ? iWinner : 0;

    const firstPlayerId   = this.gameState.players[this.gameState.iCurrentPlayer]?.id;
    const firstPlayerHand = this.fullPlayers.find(player => player.id === firstPlayerId)?.hand ?? [];

    const actionValues = new Set<CardValue>([
      CardValue.Plus, CardValue.Direction, CardValue.Stop, CardValue.Taki,
      CardValue.PlusTwo, CardValue.PlusSix, CardValue.PlusTen
    ]);
    this.gameState.discardPile = [this.drawOneCard()];
    while (true) {
      const startCard          = this.gameState.discardPile[0];
      const isInvalidStartCard = startCard.color === CardColor.None
        || actionValues.has(startCard.value);
      const isFirstPlayerStuck = firstPlayerHand.length > 0
        && !firstPlayerHand.some(card => this.isCardPlayableAtStart(card, startCard));
      if (!isInvalidStartCard && !isFirstPlayerStuck) {
        break;
      }

      this.deck.push(this.gameState.discardPile.pop()!);
      this.shuffle(this.deck);
      this.gameState.discardPile = [this.drawOneCard()];
    }

    this.gameState.activeTakiColor  = null;
    this.gameState.isSuperTakiActive  = false;
    this.gameState.drawPenaltyValue = 0;
    this.gameState.isPlusActive     = false;
    this.gameState.pendingPlusThree = null;
    this.gameState.isCrownActive      = false;
    this.gameState.eliminatedPlayers  = [];
    this.gameState.turnStartedAt    = Date.now();
    this.startIdleTimer();
    this.gameLog = [];
    this.gameLog.push({
      timestamp: new Date().toISOString(),
      event: GameLogEvent.GameStart,
      playerName: "system",
      playerId: "system",
      before: this.snapshotState(),
      after: this.snapshotState()
    });
    this.broadcastState();
  }

  private playCard(playerId: string, cardId: number, newColor?: CardColor) {
    if (this.gameState.winner) {
      return;
    }

    if (this.gameState.pendingPlusThree) {
      return;
    }

    if (this.gameState.players[this.gameState.iCurrentPlayer].id !== playerId) {
      return;
    }

    const player = this.findFullPlayer(playerId);
    if (!player) {
      return;
    }

    const iCard = player.hand.findIndex(card => card.id === cardId);
    if (iCard < 0) {
      return;
    }

    const card = player.hand[iCard];
    const top  = this.gameState.discardPile[this.gameState.discardPile.length - 1];
    const isCrown = card.value === CardValue.Crown;
    const isSubjectToPlusRules = !isCrown && !this.gameState.isCrownActive;
    if (isSubjectToPlusRules) {
      const isDrawPenaltyStackCard = isDrawPenaltyCard(card.value);
      const isDrawPenaltyBlocked = this.gameState.drawPenaltyValue > 0 && !isDrawPenaltyStackCard;
      if (isDrawPenaltyBlocked) {
        return;
      }
    }

    const isWild = WILD_VALUES.has(card.value);
    const isPlusFourCheck = card.value === CardValue.PlusFour && !isCrown
      && !this.gameState.isCrownActive && this.gameState.drawPenaltyValue === 0;
    if (isPlusFourCheck) {
      const activeColor = this.gameState.activeTakiColor ?? top.color;
      const isHoldingActiveColorCard = player.hand.some(
        handCard => handCard.color === activeColor && handCard.id !== cardId
      );
      if (isHoldingActiveColorCard) {
        return;
      }
    }

    const isFreeBreaker = card.value === CardValue.PlusThreeBreaker && !this.gameState.pendingPlusThree;
    const isFreeBreakableWithActiveTaki = isFreeBreaker
      && this.gameState.activeTakiColor !== null && !this.gameState.isSuperTakiActive;
    if (isFreeBreakableWithActiveTaki) {
      return;
    }

    const isChangeColor = card.value === CardValue.ChangeColor;
    const isWildBlockedByActiveTaki = isWild && this.gameState.activeTakiColor !== null
      && !(isCrown && this.gameState.isSuperTakiActive) && !isChangeColor;
    if (isWildBlockedByActiveTaki) {
      return;
    }

    const isSubjectToColorValueRules = !isCrown && !isFreeBreaker
      && !this.gameState.isCrownActive && this.gameState.drawPenaltyValue === 0;
    if (isSubjectToColorValueRules) {
      const activeTaki = this.gameState.activeTakiColor;
      const colorMatch = activeTaki !== null ? card.color === activeTaki : card.color === top.color;
      const valueMatch = activeTaki !== null ? false : card.value === top.value;
      const isNoColorOrValueMatch = !isWild && !colorMatch && !valueMatch;
      if (isNoColorOrValueMatch) {
        return;
      }
    }

    const logBefore = this.snapshotState();
    const gamePlayer = this.findPlayer(playerId)!;
    const playerName = gamePlayer.name;

    player.hand.splice(iCard, 1);
    gamePlayer.handCount = player.hand.length;

    const isWildColorCard = card.value === CardValue.ChangeColor || card.value === CardValue.PlusFour;
    const isWildColorAssignment = isWildColorCard && !!newColor;
    if (isWildColorAssignment && newColor) {
      card.color = newColor;
    } else if (card.value === CardValue.PlusThreeBreaker) {
      const lastColoredCard = [...this.gameState.discardPile]
        .reverse()
        .find(discCard => discCard.color !== CardColor.None);
      if (lastColoredCard) {
        card.color = lastColoredCard.color;
      }
    }

    const topColorBeforePlay = top.color;
    this.gameState.discardPile.push(card);

    const isFinishingWithPlus = card.value === CardValue.Plus && player.hand.length === 0;
    if (player.hand.length === 0 && !isFinishingWithPlus) {
      this.gameState.winner = playerId;
      this.gameState.wins[playerId] = (this.gameState.wins[playerId] ?? 0) + 1;
    }

    if (this.gameState.isCrownActive) {
      this.gameState.isCrownActive = false;
    }

    if (card.value === CardValue.Crown) {
      this.gameState.drawPenaltyValue  = 0;
      this.gameState.isPlusActive      = false;
      this.gameState.activeTakiColor   = null;
      this.gameState.isSuperTakiActive = false;
      this.gameState.pendingPlusThree  = null;
      this.gameState.isCrownActive     = true;
    } else if (isFreeBreaker) {
      this.gameState.isPlusActive = false;

      if (!this.gameState.activeTakiColor) {
        this.nextTurn(card);
      }
    } else if (card.value === CardValue.Plus) {
      if (isFinishingWithPlus) {
        this.gameState.isPlusActive      = false;
        this.gameState.activeTakiColor   = null;
        this.gameState.isSuperTakiActive = false;
        this.giveCards(playerId, 1);
        this.nextTurn(null);
      } else {
        this.gameState.isPlusActive = true;
      }
    } else if (card.value === CardValue.Direction) {
      this.gameState.isPlusActive = false;
      this.advanceTurnOrEndTaki(player, card);
    } else if (card.value === CardValue.SuperTaki) {
      const effectiveColor = topColorBeforePlay !== CardColor.None ? topColorBeforePlay : (newColor ?? null);
      this.gameState.activeTakiColor  = effectiveColor;
      this.gameState.isSuperTakiActive  = effectiveColor !== null;
      this.gameState.isPlusActive       = false;
      const hasPlayable = effectiveColor !== null && player.hand.some(
        handCard => handCard.color === effectiveColor && handCard.color !== CardColor.None
      );
      if (!hasPlayable) {
        card.color = effectiveColor ?? CardColor.None;
        this.gameState.activeTakiColor  = null;
        this.gameState.isSuperTakiActive  = false;
        this.nextTurn(null);
      }
    } else if (card.value === CardValue.Taki) {
      this.gameState.activeTakiColor = card.color;
      this.gameState.isPlusActive    = false;

      if (!player.hand.some(handCard => handCard.color === card.color)) {
        this.gameState.activeTakiColor = null;
        this.nextTurn(null);
      }
    } else if (card.value === CardValue.PlusThree) {
      const otherIds = this.gameState.players
        .filter(player => player.id !== playerId)
        .map(player => player.id);
      const isBreakable = player.hand.length > 0;
      this.gameState.pendingPlusThree = {
        fromId: playerId,
        waiting: [...otherIds],
        isBreakable,
        acceptedCardIds: {}
      };
      this.gameState.isPlusActive     = false;
      this.gameState.turnStartedAt    = Date.now();
    } else if (card.value === CardValue.PlusFour) {
      this.gameState.isPlusActive = false;
      this.nextTurn(card);
    } else {
      this.gameState.isPlusActive = false;

      if (isChangeColor && this.gameState.activeTakiColor) {
        this.gameState.activeTakiColor   = null;
        this.gameState.isSuperTakiActive = false;
        this.nextTurn(null);
      } else {
        this.advanceTurnOrEndTaki(player, card);
      }
    }

    this.logAndBroadcast(GameLogEvent.Play, playerName, playerId, logBefore, {
      color: card.color,
      value: card.value
    });
  }

  private handlePlusThreeResponse(peerId: string, isBreaker: boolean, breakerCardId: number | null) {
    const pending = this.gameState.pendingPlusThree;
    if (!pending) {
      return;
    }

    const iWaiting = pending.waiting.indexOf(peerId);
    if (iWaiting < 0) {
      return;
    }

    pending.waiting.splice(iWaiting, 1);

    const isEffectiveBreaker = isBreaker && pending.isBreakable;
    if (isEffectiveBreaker) {
      for (const [acceptedPlayerId, cardIds] of Object.entries(pending.acceptedCardIds)) {
        this.removeCards(acceptedPlayerId, cardIds);
      }

      this.giveCards(pending.fromId, PLUS_THREE_CARD_COUNT);

      const breakerPlayer     = this.findFullPlayer(peerId);
      const breakerGamePlayer = this.findPlayer(peerId);
      if (breakerPlayer) {
        const iCard = breakerCardId !== null
          ? breakerPlayer.hand.findIndex(card => card.id === breakerCardId)
          : breakerPlayer.hand.findIndex(card => card.value === CardValue.PlusThreeBreaker);
        if (iCard >= 0) {
          const [breakerCard] = breakerPlayer.hand.splice(iCard, 1);
          const lastColoredCard = [...this.gameState.discardPile]
            .reverse()
            .find(card => card.color !== CardColor.None);
          if (lastColoredCard) {
            breakerCard.color = lastColoredCard.color;
          }

          this.gameState.discardPile.push(breakerCard);

          if (breakerGamePlayer) {
            breakerGamePlayer.handCount = breakerPlayer.hand.length;
          }

          const isBreakingWinner = breakerPlayer.hand.length === 0 && !this.gameState.winner;
          if (isBreakingWinner) {
            this.gameState.winner = peerId;
            this.gameState.wins[peerId] = (this.gameState.wins[peerId] ?? 0) + 1;
          }
        }
      }

      this.gameState.pendingPlusThree = null;
      this.nextTurn(null);
    } else {
      const hasRemainingBreaker = pending.isBreakable && pending.waiting.some(waitingId => {
        const waitingFullPlayer = this.findFullPlayer(waitingId);
        return waitingFullPlayer?.hand.some(card => card.value === CardValue.PlusThreeBreaker);
      });

      const drawnCards = this.giveCards(peerId, PLUS_THREE_CARD_COUNT);
      if (hasRemainingBreaker) {
        pending.acceptedCardIds[peerId] = drawnCards.map(card => card.id);
      }

      if (pending.waiting.length === 0) {
        const plusThreeCard = this.gameState.discardPile[this.gameState.discardPile.length - 1];
        if (plusThreeCard?.color === CardColor.None) {
          const lastColoredCard = [...this.gameState.discardPile]
            .slice(0, -1)
            .reverse()
            .find(card => card.color !== CardColor.None);
          if (lastColoredCard) {
            plusThreeCard.color = lastColoredCard.color;
          }
        }

        this.gameState.pendingPlusThree = null;
        this.nextTurn(null);
      }
    }

    this.broadcastState();
  }

  private eliminatePlayer(playerId: string) {
    const fullPlayer = this.findFullPlayer(playerId);
    const gamePlayer = this.findPlayer(playerId);
    if (fullPlayer) {
      fullPlayer.hand = [];
    }

    if (gamePlayer) {
      gamePlayer.handCount = 0;
    }

    if (!this.gameState.eliminatedPlayers.includes(playerId)) {
      this.gameState.eliminatedPlayers.push(playerId);
    }

    const activePlayers = this.gameState.players.filter(
      player => !this.gameState.eliminatedPlayers.includes(player.id)
    );
    const isSoloSurvivor = activePlayers.length === 1 && !this.gameState.winner;
    if (isSoloSurvivor) {
      this.gameState.winner = activePlayers[0].id;
      this.gameState.wins[activePlayers[0].id] = (this.gameState.wins[activePlayers[0].id] ?? 0) + 1;
    }
  }

  private giveCards(playerId: string, count: number) {
    const fullPlayer = this.findFullPlayer(playerId);
    const gamePlayer = this.findPlayer(playerId);
    if (!fullPlayer || !gamePlayer) {
      return [];
    }

    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        const top = this.gameState.discardPile.pop()!;
        this.deck = this.gameState.discardPile;
        this.shuffle(this.deck);
        this.gameState.discardPile = [top];
      }

      if (this.deck.length > 0) {
        const card = this.drawOneCard();
        fullPlayer.hand.push(card);
        drawn.push(card);
      }
    }

    gamePlayer.handCount = fullPlayer.hand.length;

    if (this.gameState.isNoMercyMode && fullPlayer.hand.length >= NO_MERCY_CARD_LIMIT) {
      this.eliminatePlayer(playerId);
    }

    return drawn;
  }

  private removeCards(playerId: string, cardIds: number[]) {
    const fullPlayer = this.findFullPlayer(playerId);
    const gamePlayer = this.findPlayer(playerId);
    if (!fullPlayer || !gamePlayer) {
      return;
    }

    const removedCards = fullPlayer.hand.filter(card => cardIds.includes(card.id));
    fullPlayer.hand = fullPlayer.hand.filter(card => !cardIds.includes(card.id));
    gamePlayer.handCount = fullPlayer.hand.length;
    this.deck.push(...removedCards);
  }

  private closeTaki(playerId: string) {
    if (this.gameState.players[this.gameState.iCurrentPlayer].id !== playerId) {
      return;
    }

    const logBefore  = this.snapshotState();
    const playerName = this.findPlayer(playerId)?.name ?? playerId;

    const top = this.gameState.discardPile[this.gameState.discardPile.length - 1];
    const shouldAssignTakiColorToTop = !!top && top.color === CardColor.None && this.gameState.activeTakiColor !== null;
    if (shouldAssignTakiColorToTop && top && this.gameState.activeTakiColor) {
      top.color = this.gameState.activeTakiColor;
    }

    this.gameState.activeTakiColor  = null;
    this.gameState.isSuperTakiActive  = false;
    this.nextTurn(top);
    this.logAndBroadcast(GameLogEvent.CloseTaki, playerName, playerId, logBefore);
  }

  private drawCard(playerId: string) {
    if (this.gameState.winner) {
      return;
    }

    if (this.gameState.players[this.gameState.iCurrentPlayer].id !== playerId) {
      return;
    }

    if (!this.findFullPlayer(playerId)) {
      return;
    }

    const logBefore  = this.snapshotState();
    const playerName = this.findPlayer(playerId)?.name ?? playerId;
    if (this.gameState.isPlusActive) {
      this.gameState.isPlusActive = false;
      this.giveCards(playerId, 1);
      this.nextTurn(null);
      this.logAndBroadcast(GameLogEvent.Draw, playerName, playerId, logBefore);
      return;
    }

    if (this.gameState.drawPenaltyValue > 0) {
      const count = this.gameState.drawPenaltyValue;
      this.gameState.drawPenaltyValue = 0;
      this.giveCards(playerId, count);
      this.nextTurn(null);
      this.logAndBroadcast(GameLogEvent.Draw, playerName, playerId, logBefore);
      return;
    }

    this.giveCards(playerId, 1);

    if (this.gameState.activeTakiColor) {
      const top = this.gameState.discardPile[this.gameState.discardPile.length - 1];
      if (top?.color === CardColor.None) {
        top.color = this.gameState.activeTakiColor;
      }

      this.gameState.activeTakiColor   = null;
      this.gameState.isSuperTakiActive = false;
    }

    this.nextTurn(null);
    this.logAndBroadcast(GameLogEvent.Draw, playerName, playerId, logBefore);
  }

  private snapshotState() {
    const {
      iCurrentPlayer,
      activeTakiColor,
      isSuperTakiActive,
      drawPenaltyValue,
      isPlusActive,
      isCrownActive,
      direction,
      pendingPlusThree,
      players
    } = this.gameState;

    return {
      iCurrentPlayer,
      currentPlayerName: players[iCurrentPlayer]?.name ?? "?",
      direction,
      activeTakiColor,
      isSuperTakiActive,
      drawPenaltyValue,
      isPlusActive,
      isCrownActive,
      hasPendingPlusThree: pendingPlusThree !== null,
      handCounts: Object.fromEntries(
        players.map(player => [player.name, player.handCount])
      ),
      hands: Object.fromEntries(
        this.fullPlayers.map(fullPlayer => {
          const name = this.findPlayer(fullPlayer.id)?.name ?? fullPlayer.id;
          return [name, fullPlayer.hand.map(card => ({
            color: card.color,
            value: card.value
          }))];
        })
      )
    };
  }

  private nextTurn(card: Card | null) {
    if (this.gameState.winner) {
      return;
    }

    if (this.gameState.activeTakiColor) {
      return;
    }

    const { players, eliminatedPlayers } = this.gameState;
    const playerCount = players.length;
    if (card?.value === CardValue.Direction) {
      this.gameState.direction = this.gameState.direction === 1 ? -1 : 1;
    }

    if (card) {
      this.gameState.drawPenaltyValue += getDrawPenalty(card.value);
    }

    let step = this.gameState.direction;
    if (card?.value === CardValue.Stop && playerCount > 2) {
      step *= 2;
    }

    let iNext = (this.gameState.iCurrentPlayer + step) % playerCount;
    if (iNext < 0) {
      iNext += playerCount;
    }

    this.gameState.iCurrentPlayer = iNext;

    if (playerCount === 2 && card?.value === CardValue.Stop) {
      this.gameState.iCurrentPlayer = (iNext + step) % playerCount;

      if (this.gameState.iCurrentPlayer < 0) {
        this.gameState.iCurrentPlayer += playerCount;
      }
    }

    if (eliminatedPlayers.length > 0) {
      for (let safetyLimit = playerCount; safetyLimit > 0; safetyLimit--) {
        const isCurrentPlayerEliminated = eliminatedPlayers.includes(
          players[this.gameState.iCurrentPlayer].id
        );
        if (!isCurrentPlayerEliminated) {
          break;
        }

        let iCurrent = (this.gameState.iCurrentPlayer + this.gameState.direction) % playerCount;
        if (iCurrent < 0) {
          iCurrent += playerCount;
        }

        this.gameState.iCurrentPlayer = iCurrent;
      }
    }

    this.gameState.turnStartedAt   = Date.now();
    this.gameState.isIdleTimerHeld = false;
  }

  private startIdleTimer() {
    if (this.idleTimerInterval !== null) {
      clearInterval(this.idleTimerInterval);
    }

    this.idleTimerInterval = setInterval(() => this.checkIdleTurn(), IDLE_TIMER_INTERVAL_MS);
  }

  private checkIdleTurn() {
    if (this.gameState.winner) {
      return;
    }

    if (this.gameState.discardPile.length === 0) {
      return;
    }

    if (Date.now() - this.gameState.turnStartedAt < IDLE_TIMEOUT_MS) {
      return;
    }

    if (this.gameState.isIdleTimerHeld) {
      return;
    }

    if (this.gameState.pendingPlusThree) {
      const waiting = [...this.gameState.pendingPlusThree.waiting];
      for (const playerId of waiting) {
        this.handlePlusThreeResponse(playerId, false, null);
      }
      return;
    }

    const currentPlayerId = this.gameState.players[this.gameState.iCurrentPlayer].id;
    if (this.gameState.activeTakiColor !== null) {
      this.closeTaki(currentPlayerId);
      return;
    }

    const turnStartedAtBeforeDraw = this.gameState.turnStartedAt;
    this.drawCard(currentPlayerId);

    const isTurnStillWedged = this.gameState.turnStartedAt === turnStartedAtBeforeDraw;
    if (isTurnStillWedged) {
      this.nextTurn(null);
      this.broadcastState();
    }
  }
}

// Local type alias for filter narrowing
type GamePlayer = NonNullable<ReturnType<GameRoom["gameState"]["players"]["find"]>>;
