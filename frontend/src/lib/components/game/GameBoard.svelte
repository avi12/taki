<script lang="ts">
  import CenterArea from "$lib/components/game/CenterArea.svelte";
  import MyInfoPill from "$lib/components/game/MyInfoPill.svelte";
  import OpponentsRow from "$lib/components/game/OpponentsRow.svelte";
  import TurnInfo from "$lib/components/game/TurnInfo.svelte";
  import HandAreaOverlay from "$lib/components/hand/HandAreaOverlay.svelte";
  import PlayerHand from "$lib/components/hand/PlayerHand.svelte";
  import { type DragState } from "$lib/components/hand/PlayerHand.svelte";
  import WinnerOverlay from "$lib/components/overlays/WinnerOverlay.svelte";
  import { CardValue, type GameState, type Card, CardColor } from "$lib/network";
  import { cardDealRotation, getCardEffect, CardEffect } from "$lib/utils/cards";

  interface Props {
    gameRoomState: GameState;
    hand: Card[];
    myId: string;
    playerName: string;
    isHost: boolean;
    isPlusThreeRecipient: boolean;
    isPlusThreeBreakerAvailable: boolean;
    isColorPickerVisible: boolean;
    hoveredPickerColor: CardColor | null;
    newlyDrawnExemptId: number | null;
    lastDrawnCardId: number | null;
    canPlayCard: (card: Card) => boolean;
    onPlayCard: (card: Card) => void;
    onDrawCard: () => void;
    onCloseTaki: () => void;
    onStartGame: () => void;
    onSkipDisconnected: () => void;
    onKickPlayer: (targetId: string) => void;
    onHoldTurn: (isHeld: boolean) => void;
    onRenamePlayer: (targetId: string, name: string) => void;
    onRename: (name: string) => void;
    onPreviewName: (name: string) => void;
    onCancelRename: () => void;
    onLastDrawnCardIntroEnd: () => void;
    onPendingCardPlay: (card: Card) => void;
  }

  const {
    gameRoomState,
    hand,
    myId,
    playerName,
    isHost,
    isPlusThreeRecipient,
    isPlusThreeBreakerAvailable,
    isColorPickerVisible,
    hoveredPickerColor,
    newlyDrawnExemptId,
    lastDrawnCardId,
    canPlayCard,
    onPlayCard,
    onDrawCard,
    onCloseTaki,
    onStartGame,
    onSkipDisconnected,
    onKickPlayer,
    onHoldTurn,
    onRenamePlayer,
    onRename,
    onPreviewName,
    onCancelRename,
    onLastDrawnCardIntroEnd,
    onPendingCardPlay
  }: Props = $props();

  let pendingCardId = $state<number | null>(null);

  $effect(() => {
    if (!isMyTurnNow || !pendingCardId) {
      return;
    }

    const card = hand.find(handCard => handCard.id === pendingCardId);
    pendingCardId = null;

    if (!card || !canPlayCard(card)) {
      return;
    }

    onPendingCardPlay(card);
  });

  // ── Direction arrow animation key ──
  // Incremented on each direction change; drives {#key} remount in CenterArea
  // so the entry animation (CW or CCW spin) replays on every reversal.
  let arrowAnimKey = $state<number>(0);
  let prevDirection = $state<1 | -1 | null>(null);

  $effect(() => {
    const dir = gameRoomState.direction;
    if (prevDirection === null) {
      prevDirection = dir;
      return;
    }

    if (dir !== prevDirection) {
      arrowAnimKey++;
      prevDirection = dir;
    }
  });

  // ── Card effect animation state ──
  let cardEffectValue = $state<CardValue | null>(null);
  let lastDiscardTopId = $state<number | null>(null);
  let isSuperTakiAnimating = $state(false);
  let prevActiveTakiColor = $state<CardColor | null>(null);

  // ── Stop card animation state ──
  let isStopAnimating = $state(false);
  let stopSkippedPlayerId = $state<string | null>(null);
  let stopNextPlayerName = $state<string | null>(null);

  // ── +4 recipient indicator ──
  let plusFourRecipientId = $state<string | null>(null);

  $effect(() => {
    const top = gameRoomState.discardPile.at(-1);
    if (!top || top.id === lastDiscardTopId) {
      return;
    }

    lastDiscardTopId = top.id;

    const effect = getCardEffect(top.value);
    const isAnimatedEffect =
      effect !== CardEffect.Number && effect !== CardEffect.Crown && effect !== CardEffect.PlusFour;
    if (isAnimatedEffect) {
      cardEffectValue = top.value;
    }

    if (top.value === CardValue.PlusFour) {
      const { players, direction, iCurrentPlayer } = gameRoomState;
      const playerCount = players.length;
      const iRecipient = (iCurrentPlayer - direction + playerCount) % playerCount;
      plusFourRecipientId = players[iRecipient].id;
      setTimeout(() => (plusFourRecipientId = null), PLUS_FOUR_INDICATOR_DURATION_MS);
    }

    if (top.value !== CardValue.Stop) {
      return;
    }

    const { players, direction, iCurrentPlayer } = gameRoomState;
    const playerCount = players.length;
    const isStopPlayAgain = playerCount === 2;
    const stopSkipDirection = isStopPlayAgain ? direction : -direction;
    const iSkipped = (iCurrentPlayer + stopSkipDirection + playerCount) % playerCount;
    stopSkippedPlayerId = players[iSkipped].id;
    stopNextPlayerName = players[iCurrentPlayer].name;
    isStopAnimating = true;
  });

  $effect(() => {
    const { activeTakiColor: color = null } = gameRoomState;
    const isColorChangedDuringTaki = color !== null && color !== prevActiveTakiColor && prevActiveTakiColor !== null;
    if (isColorChangedDuringTaki) {
      isSuperTakiAnimating = true;
    }

    prevActiveTakiColor = color;
  });

  // ── Drag state ──
  let dragState = $state<DragState | null>(null);
  let isDragReturning = $state<boolean>(false);
  let isDraggingOver = $state<boolean>(false);
  let elDiscardPile = $state<HTMLElement | null>(null);
  let pendingRemovalCardId = $state<number | null>(null);

  $effect(() => {
    const isMyTurn = gameRoomState.players[gameRoomState.iCurrentPlayer].id === myId;
    if (!isMyTurn) {
      dragState = null;
      isDragReturning = false;
      isDraggingOver = false;
      pendingRemovalCardId = null;
      return;
    }

    const isCardStillInHand = hand.some(card => card.id === pendingRemovalCardId);
    const isPendingCardRemoved = !!pendingRemovalCardId && !isCardStillInHand;
    if (isPendingCardRemoved) {
      pendingRemovalCardId = null;
      dragState = null;
    }
  });

  const PILE_DROP_RADIUS             = 130;
  const TAP_MOVEMENT_THRESHOLD       = 8;
  const PLUS_FOUR_INDICATOR_DURATION_MS = 2000;

  function onGhostMoveComplete(): void {
    if (dragState?.snapping) {
      dragState = null;
    } else if (isDragReturning) {
      dragState = null;
      isDragReturning = false;
    }
  }

  function handleCardPointerDown(e: PointerEvent, card: Card): void {
    if (e.button !== 0) {
      return;
    }

    const isDragInProgress = dragState !== null && !dragState.snapping;
    if (isDragInProgress) {
      return;
    }

    if (card.id === pendingRemovalCardId) {
      return;
    }

    if (dragState?.snapping) {
      dragState = null;
    }

    const isWaitingForMyTurn = !isPlusThreeRecipient && gameRoomState.players[gameRoomState.iCurrentPlayer].id !== myId;
    if (isWaitingForMyTurn) {
      pendingCardId = pendingCardId === card.id ? null : card.id;
      return;
    }

    if (!canPlayCard(card)) {
      return;
    }

    e.preventDefault();

    const elTarget = e.currentTarget;
    if (!(elTarget instanceof HTMLElement)) {
      return;
    }

    elTarget.setPointerCapture(e.pointerId);

    const rect = elTarget.getBoundingClientRect();
    dragState = {
      cardId: card.id,
      left: rect.left,
      top: rect.top,
      startLeft: rect.left,
      startTop: rect.top,
      cardW: rect.width,
      cardH: rect.height,
      grabOffsetX: e.clientX - rect.left,
      grabOffsetY: e.clientY - rect.top,
      snapping: false,
      snapRotation: 0
    };
  }

  function handleCardPointerMove(e: PointerEvent): void {
    if (!dragState) {
      return;
    }

    const isDragActiveAndFree = !dragState.snapping && !isDragReturning;
    if (!isDragActiveAndFree) {
      return;
    }

    dragState.left = e.clientX - dragState.grabOffsetX;
    dragState.top  = e.clientY - dragState.grabOffsetY;

    if (!elDiscardPile) {
      return;
    }

    const pileRect = elDiscardPile.getBoundingClientRect();
    const cardCenterX = dragState.left + dragState.cardW / 2;
    const cardCenterY = dragState.top + dragState.cardH / 2;
    const pileCenterX = pileRect.left + pileRect.width / 2;
    const pileCenterY = pileRect.top + pileRect.height / 2;
    isDraggingOver = Math.hypot(cardCenterX - pileCenterX, cardCenterY - pileCenterY) < PILE_DROP_RADIUS;
  }

  function startReturnToHand(): void {
    if (!dragState) {
      return;
    }

    const canReturnToHand = !isDragReturning && !dragState.snapping;
    if (!canReturnToHand) {
      return;
    }

    isDragReturning = true;
    const returnLeft = dragState.startLeft;
    const returnTop  = dragState.startTop;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!dragState) {
        return;
      }

      if (dragState.left === returnLeft && dragState.top === returnTop) {
        onGhostMoveComplete();
        return;
      }

      dragState.left = returnLeft;
      dragState.top  = returnTop;
    }));
  }

  function snapCardToPile(card: Card, pileRect: DOMRect): void {
    pendingCardId = null;
    pendingRemovalCardId = card.id;
    onPlayCard(card);
    dragState!.snapping     = true;
    dragState!.snapRotation = cardDealRotation(card.id);
    const snapLeft = pileRect.left + (pileRect.width  - dragState!.cardW) / 2;
    const snapTop  = pileRect.top  + (pileRect.height - dragState!.cardH) / 2;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (dragState) {
        dragState.left = snapLeft;
        dragState.top  = snapTop;
      }
    }));
  }

  function handleCardPointerUp(_: PointerEvent, card: Card): void {
    if (!dragState) {
      return;
    }

    const isActiveDragForThisCard = dragState.cardId === card.id && !dragState.snapping && !isDragReturning;
    if (!isActiveDragForThisCard) {
      return;
    }

    isDraggingOver = false;
    const moved = Math.hypot(dragState.left - dragState.startLeft, dragState.top - dragState.startTop);
    if (moved < TAP_MOVEMENT_THRESHOLD) {
      // Tap/click: fly card to discard pile before notifying parent
      if (elDiscardPile) {
        snapCardToPile(card, elDiscardPile.getBoundingClientRect());
      } else {
        dragState = null;
        onPlayCard(card);
      }

      return;
    }

    if (elDiscardPile) {
      const pileRect = elDiscardPile.getBoundingClientRect();
      const cardCenterX = dragState.left + dragState.cardW / 2;
      const cardCenterY = dragState.top  + dragState.cardH / 2;
      const pileCenterX = pileRect.left + pileRect.width  / 2;
      const pileCenterY = pileRect.top  + pileRect.height / 2;
      const isOverDiscardPile = Math.hypot(cardCenterX - pileCenterX, cardCenterY - pileCenterY) < PILE_DROP_RADIUS;
      if (isOverDiscardPile) {
        snapCardToPile(card, pileRect);
        return;
      }
    }

    startReturnToHand();
  }

  function handleCardPointerCancel(): void {
    isDraggingOver = false;
    startReturnToHand();
  }

  const isMyTurnNow = $derived(
    gameRoomState.players[gameRoomState.iCurrentPlayer].id === myId
  );

  const isSkipped = $derived(isStopAnimating && stopSkippedPlayerId === myId);
</script>

<div class="game-board">
  <OpponentsRow {gameRoomState} {isHost} {myId} {onRenamePlayer} {plusFourRecipientId} {stopSkippedPlayerId} />

  <CenterArea
    {arrowAnimKey}
    {canPlayCard}
    {cardEffectValue}
    {gameRoomState}
    {hand}
    {isDraggingOver}
    {isMyTurnNow}
    {isPlusThreeBreakerAvailable}
    {isPlusThreeRecipient}
    {isSuperTakiAnimating}
    {myId}
    {onCloseTaki}
    onDragLeave={() => isDraggingOver = false}
    onDragOver={() => isDraggingOver = true}
    {onDrawCard}
    onEffectEnd={() => {
      cardEffectValue = null;
      isStopAnimating = false;
      stopSkippedPlayerId = null;
      stopNextPlayerName = null;
    }}
    onSuperTakiEffectEnd={() => (isSuperTakiAnimating = false)}
    bind:elDiscardPile
  />

  <TurnInfo
    {gameRoomState}
    {isHost}
    {isMyTurnNow}
    {onHoldTurn}
    {onKickPlayer}
    {onSkipDisconnected}
  />

  <MyInfoPill
    handCount={hand.length}
    {isHost}
    {onCancelRename}
    {onPreviewName}
    {onRename}
    {playerName}
  />

  <PlayerHand
    {canPlayCard}
    {dragState}
    {gameRoomState}
    {hand}
    {hoveredPickerColor}
    {isColorPickerVisible}
    {isDragReturning}
    {isPlusThreeBreakerAvailable}
    {isPlusThreeRecipient}
    {lastDrawnCardId}
    {myId}
    {newlyDrawnExemptId}
    onCardPointerCancel={handleCardPointerCancel}
    onCardPointerDown={handleCardPointerDown}
    onCardPointerMove={handleCardPointerMove}
    onCardPointerUp={handleCardPointerUp}
    {onGhostMoveComplete}
    {onLastDrawnCardIntroEnd}
    {pendingCardId}
    {pendingRemovalCardId}
  />

  <HandAreaOverlay
    isEliminated={gameRoomState.eliminatedPlayers?.includes(myId) ?? false}
    {isSkipped}
    {stopNextPlayerName}
  />

  <WinnerOverlay
    {gameRoomState}
    {isHost}
    {onCancelRename}
    onPlayAgain={onStartGame}
    {onPreviewName}
    {onRename}
    {playerName}
  />

  <p class="version-label" aria-hidden="true">v{__APP_VERSION__}</p>
</div>

<style>
  .version-label {
    position: fixed;
    right: 8px;
    bottom: 4px;
    z-index: 50;
    margin: 0;
    color: var(--text-muted);
    font-size: 0.6rem;
    opacity: 40%;
    pointer-events: none;
  }

  .game-board {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    min-height: 100dvh;
    padding-bottom: var(--game-pad-bottom);
    background: var(--bg-game);

    @media (width > 600px) {
      overflow: hidden;
      height: 100dvh;
    }
  }
</style>
