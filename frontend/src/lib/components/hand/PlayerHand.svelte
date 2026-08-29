<script lang="ts">
  import CardIcon from "$lib/components/cards/CardIcon.svelte";
  import ColorHintTooltip from "$lib/components/cards/ColorHintTooltip.svelte";
  import DragGhost from "$lib/components/hand/DragGhost.svelte";
  import { locale } from "$lib/locale.svelte";
  import { CardValue, type GameState, type Card, CardColor } from "$lib/network";
  import { getCardColorHex, getCardColorDark, isActionCard } from "$lib/utils/cards";
  import { flip } from "svelte/animate";
  import { cubicOut } from "svelte/easing";
  import { fly, type TransitionConfig } from "svelte/transition";

  export type DragState = {
    cardId: number;
    left: number;
    top: number;
    startLeft: number;
    startTop: number;
    cardW: number;
    cardH: number;
    grabOffsetX: number;
    grabOffsetY: number;
    snapping: boolean;
    snapRotation: number;
  };

  interface Props {
    hand: Card[];
    myId: string;
    gameRoomState: GameState;
    isPlusThreeRecipient: boolean;
    isPlusThreeBreakerAvailable: boolean;
    isColorPickerVisible: boolean;
    hoveredPickerColor: CardColor | null;
    newlyDrawnExemptId: number | null;
    lastDrawnCardId: number | null;
    dragState: DragState | null;
    isDragReturning: boolean;
    pendingRemovalCardId: number | null;
    pendingCardId: number | null;
    canPlayCard: (card: Card) => boolean;
    onCardPointerDown: (event: PointerEvent, card: Card) => void;
    onCardPointerMove: (event: PointerEvent) => void;
    onCardPointerUp: (event: PointerEvent, card: Card) => void;
    onCardPointerCancel: () => void;
    onGhostMoveComplete?: () => void;
    onLastDrawnCardIntroEnd: () => void;
  }

  const {
    hand,
    myId,
    gameRoomState,
    isPlusThreeRecipient,
    isPlusThreeBreakerAvailable,
    isColorPickerVisible,
    hoveredPickerColor,
    newlyDrawnExemptId,
    lastDrawnCardId,
    dragState,
    isDragReturning,
    pendingRemovalCardId,
    pendingCardId,
    canPlayCard,
    onCardPointerDown,
    onCardPointerMove,
    onCardPointerUp,
    onCardPointerCancel,
    onGhostMoveComplete,
    onLastDrawnCardIntroEnd
  }: Props = $props();

  // Peek state - reveals a card by spreading neighbors apart
  let peekedIndex = $state<number | null>(null);

  $effect(() => {
    if (dragState) {
      peekedIndex = null;
    }
  });

  // Color hint - shown when hovering a wild (colorless) card
  let hoveredWildId = $state<number | null>(null);
  let hintX = $state(0);
  let hintY = $state(0);

  const handColorCounts = $derived.by(() => ({
    red: hand.filter(card => card.color === CardColor.Red).length,
    yellow: hand.filter(card => card.color === CardColor.Yellow).length,
    green: hand.filter(card => card.color === CardColor.Green).length,
    blue: hand.filter(card => card.color === CardColor.Blue).length
  }));

  const hasPlayableWild = $derived.by(() => {
    if (isColorPickerVisible || isPlusThreeRecipient) {
      return false;
    }

    const isMyTurn = gameRoomState.pendingPlusThree
      ? isPlusThreeRecipient
      : gameRoomState.players[gameRoomState.iCurrentPlayer].id === myId;
    return isMyTurn && hand.some(card =>
      (card.value === CardValue.ChangeColor || card.value === CardValue.PlusFour) && canPlayCard(card));
  });

  const hintCounts = $derived.by(() => {
    if (hoveredWildId === null) {
      return null;
    }

    const others = hand.filter(card => card.id !== hoveredWildId);
    return {
      red: others.filter(card => card.color === CardColor.Red).length,
      yellow: others.filter(card => card.color === CardColor.Yellow).length,
      green: others.filter(card => card.color === CardColor.Green).length,
      blue: others.filter(card => card.color === CardColor.Blue).length
    };
  });

  function onWildEnter(event: MouseEvent, card: Card): void {
    const isColorPicker = card.value === CardValue.ChangeColor || card.value === CardValue.PlusFour;
    if (!isColorPicker || !canPlayCard(card)) {
      return;
    }

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const rect = target.getBoundingClientRect();
    hintX = rect.left + rect.width / 2;
    hintY = rect.top - 14;
    hoveredWildId = card.id;
  }

  function onWildLeave(card: Card): void {
    if (card.color !== CardColor.None) {
      return;
    }

    hoveredWildId = null;
  }

  /* Collapses the card's occupied slot while it flies out, so neighbors
     slide over smoothly instead of jumping once the outro finishes. */
  function handCardExitTransition(node: Element): TransitionConfig {
    const cardWidth = node instanceof HTMLElement ? node.offsetWidth : 0;
    const style = getComputedStyle(node);
    const marginInlineEnd = parseFloat(style.marginInlineEnd) || 0;
    const startOpacity = parseFloat(style.opacity);
    return {
      duration: 320,
      easing: cubicOut,
      css: (visible, gone) => `
        margin-inline-end: ${visible * marginInlineEnd - gone * cardWidth}px;
        translate: 0 ${gone * 80}px;
        opacity: ${visible * startOpacity};
        transition: none;
      `
    };
  }
</script>

<!-- My hand -->
<div style="--card-count: {Math.max(hand.length, 2)};" class="my-hand">
  {#each hand as handCard, handIndex (handCard.id)}
    {@const playable = canPlayCard(handCard)}
    {@const colorHex = getCardColorHex(handCard.color)}
    {@const colorDark = getCardColorDark(handCard.color)}
    {@const isRemovalPending = handCard.id === pendingRemovalCardId}
    {@const isDragging = dragState?.cardId === handCard.id && !isDragReturning || isRemovalPending}
    {@const isReturningCard = dragState?.cardId === handCard.id && isDragReturning}
    {@const isMyTurn = gameRoomState.pendingPlusThree
      ? isPlusThreeRecipient
      : gameRoomState.players[gameRoomState.iCurrentPlayer].id === myId}
    {@const isPlusThreeBreakerCard = handCard.value === CardValue.PlusThreeBreaker}
    {@const colorPickerActive = isColorPickerVisible && hoveredPickerColor !== null}
    {@const isColorDim = colorPickerActive && handCard.color !== hoveredPickerColor}
    {@const isColorHighlight = colorPickerActive && handCard.color === hoveredPickerColor}
    {@const isUnplayable = isMyTurn
      && !playable
      && handCard.id !== newlyDrawnExemptId
      && !isColorPickerVisible
      && !isPlusThreeRecipient}
    {@const isPeeked = peekedIndex === handIndex && !dragState}
    {@const isPending = handCard.id === pendingCardId}
    <button
      style:--card-color={colorHex}
      style:--card-dark={colorDark}
      class="card hand-card"
      class:action-card={isActionCard(handCard.value)}
      class:color-picker-dim={isColorDim}
      class:color-picker-highlight={isColorHighlight}
      class:drag-placeholder={isDragging}
      class:drag-returning={isReturningCard}
      class:not-my-turn={!isMyTurn && !isPending}
      class:peeked={isPeeked}
      class:pending={isPending && !isMyTurn}
      class:playable={isMyTurn && playable && !isColorPickerVisible && !isPlusThreeRecipient}
      class:plus-three-breaker={isPlusThreeRecipient && isPlusThreeBreakerCard && isPlusThreeBreakerAvailable}
      class:plus-three-dim={isPlusThreeRecipient && !(isPlusThreeBreakerCard && isPlusThreeBreakerAvailable)}
      class:unplayable={isUnplayable}
      aria-label={locale.strings.getCardAriaLabel(handCard.color, handCard.value)}
      onintroend={() => handCard.id === lastDrawnCardId && onLastDrawnCardIntroEnd()}
      onmouseenter={event => {
        if (!dragState) {
          peekedIndex = handIndex;
        }

        onWildEnter(event, handCard);
      }}
      onmouseleave={() => {
        if (peekedIndex === handIndex) {
          peekedIndex = null;
        }

        onWildLeave(handCard);
      }}
      onpointercancel={() => {
        peekedIndex = null;
        onCardPointerCancel();
      }}
      onpointerdown={event => {
        if (!dragState) {
          peekedIndex = handIndex;
        }

        onCardPointerDown(event, handCard);
      }}
      onpointermove={onCardPointerMove}
      onpointerup={event => {
        peekedIndex = null;
        onCardPointerUp(event, handCard);
      }}
      in:fly={handCard.id === lastDrawnCardId
        ? {
          y: -220,
          duration: 460,
          easing: cubicOut
        }
        : {
          y: 80,
          duration: 320
        }}
      out:handCardExitTransition
      animate:flip={{ duration: 280 }}
    >
      <div class="card-inner">
        <div class="card-oval"></div>
        <CardIcon jokerPenalty={handCard.jokerPenalty} value={handCard.value} />
      </div>
      {#if isMyTurn && playable && !isPlusThreeRecipient}
        <div class="playable-ring"></div>
      {/if}
      {#if isPending && !isMyTurn}
        <div class="pending-ring"></div>
      {/if}
    </button>
  {/each}
</div>

<!-- Mobile color count hint for playable wild cards (touch devices, always visible) -->
{#if hasPlayableWild}
  <div class="mobile-wild-hint" aria-hidden="true">
    <span class="color-pip pip-red" class:pip-zero={handColorCounts.red === 0}>
      <span class="pip-letter">{locale.strings.red[0]}</span>{handColorCounts.red}
    </span>
    <span class="color-pip pip-blue" class:pip-zero={handColorCounts.blue === 0}>
      <span class="pip-letter">{locale.strings.blue[0]}</span>{handColorCounts.blue}
    </span>
    <span class="color-pip pip-green" class:pip-zero={handColorCounts.green === 0}>
      <span class="pip-letter">{locale.strings.green[0]}</span>{handColorCounts.green}
    </span>
    <span class="color-pip pip-yellow" class:pip-zero={handColorCounts.yellow === 0}>
      <span class="pip-letter">{locale.strings.yellow[0]}</span>{handColorCounts.yellow}
    </span>
  </div>
{/if}

<!-- Color hint - floats above a hovered wild card -->
{#if hoveredWildId && hintCounts}
  <ColorHintTooltip {hintCounts} {hintX} {hintY} />
{/if}

<!-- Dragged card ghost (fixed-position, follows cursor) -->
{#if dragState}
  {@const ghostCard = hand.find(card => card.id === dragState.cardId)}
  {#if ghostCard}
    <DragGhost {dragState} {ghostCard} {isDragReturning} onMoveComplete={onGhostMoveComplete} />
  {/if}
{/if}

<style>
  @import url("../../styles/card.css");

  .my-hand {
    --hand-edge-padding: 0px;

    position: fixed;
    bottom: 12px;
    left: 0;
    z-index: 100;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    padding: 1.5rem 1.5rem 0;

    :global(html.touch) & {
      --hand-edge-padding: 44px;
      --available: calc(100vw - 2 * var(--hand-edge-padding));

      /* Horizontal-only scroll. Without the explicit vertical value, overflow-x: auto
         forces overflow-y to compute to auto, letting a stray touch-pan lift the cards
         up into the fixed name pill. */
      overflow: auto hidden;
      padding: 80px var(--hand-edge-padding) 0;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }

  .hand-card {
    position: relative;
    margin-inline-end: var(--hand-overlap);
    margin-inline-start: 0;
    box-shadow: 0 -4px 16px rgb(0 0 0 / 22%);
    cursor: grab;
    touch-action: none;
    transition:
      translate 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.4),
      scale 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.4),
      box-shadow 0.28s,
      filter 0.2s,
      opacity 0.2s,
      margin 0.22s ease;

    :global(html.touch) & {
      --min-card-w: 56px;
      --formula-card-w: calc(2 * var(--available) / (var(--card-count) + 1));
      --computed-card-w: max(var(--min-card-w), min(var(--card-w), var(--formula-card-w)));
      --formula-margin:
        calc(
          (var(--available) - var(--card-count) * var(--computed-card-w)) / (var(--card-count) - 1)
        );

      flex-shrink: 0;
      width: var(--computed-card-w);
      height: calc(var(--computed-card-w) * 1.55);
      margin-inline-end: max(calc(-0.4 * var(--computed-card-w)), min(0px, var(--formula-margin)));

      /* The escape zone below overflows the horizontal scroller vertically; touch
         drag relies on pointer capture, not this zone, so drop it here. */
      &::after {
        content: none;
      }
    }

    /* Invisible zone below the card so it doesn't escape the cursor when lifted */
    &::after {
      content: "";
      position: absolute;
      right: 0;
      bottom: -80px;
      left: 0;
      height: 80px;
    }

    &:not(.unplayable, .color-picker-dim, .plus-three-dim, .drag-placeholder, .drag-returning):hover {
      z-index: 200;
      box-shadow: var(--card-hover-shadow);
      scale: 1.08;
      translate: 0 clamp(-55px, -10vh, -75px);
    }

    /* Peeked card: neighbors spread apart to reveal the full card */
    &.peeked {
      z-index: 150;
      margin-inline-end: 4px;
      margin-inline-start: calc(-1 * var(--hand-overlap));
      box-shadow: var(--card-hover-shadow);
      scale: 1.04;
      translate: 0 clamp(-20px, -3vh, -30px);

      :global(html.touch) & {
        margin-inline-end: 4px;
        margin-inline-start: calc(var(--computed-card-w, 70px) * 0.45);
      }
    }

    &:last-child {
      margin-inline-end: 0;

      :global(html.touch) & {
        margin-inline-end: var(--hand-edge-padding);
      }
    }

    /* Dragging placeholder: card collapses in the hand row, siblings slide in.
       Double class for specificity over .card { width: var(--card-w) } in card.css */
    &.hand-card.drag-placeholder {
      overflow: hidden;
      width: 0;
      min-width: 0;
      margin-inline-end: 0;
      opacity: 0%;
      pointer-events: none;
      transition: width 0.22s ease-out, margin-inline-end 0.22s ease-out, opacity 0.1s;
    }

    /* Returning card: slot open but card invisible so ghost can fly in without duplication */
    &.drag-returning {
      opacity: 0%;
      pointer-events: none;
    }

    /* Playable card glow */
    &.playable {
      z-index: 10;
      filter: brightness(1.08);

      &:hover {
        box-shadow: var(--card-hover-shadow), 0 0 25px color-mix(in sRGB, var(--card-color) 60%, transparent);
      }
    }

    /* Unplayable card dim */
    &.unplayable {
      z-index: 1;
      opacity: 45%;
      filter: brightness(0.6) saturate(0.25);
      transition:
        opacity 0.6s ease,
 filter 0.6s ease,
        translate 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.4),
        scale 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.4),
        margin 0.28s;
      scale: 0.93;
      translate: 0 8px;

      &:hover {
        opacity: 55%;
        filter: brightness(0.85) saturate(0.4);
        cursor: not-allowed;
        scale: 0.93;
        translate: 0 4px;
      }
    }

    /* Not my turn - cards can be peeked but not played */
    &.not-my-turn {
      cursor: default;
    }

    /* Color picker open - non-matching color dims out */
    &.color-picker-dim {
      opacity: 40%;
      filter: brightness(0.55) saturate(0.2);
      transition: opacity 0.18s ease, filter 0.18s ease, translate 0.18s ease, scale 0.18s ease;
      scale: 0.93;
      translate: 0 8px;

      &:hover {
        filter: brightness(0.75) saturate(0.35);
      }
    }

    /* Color picker open - matching color lifts and glows */
    &.color-picker-highlight {
      z-index: 200;
      box-shadow: var(--card-hover-shadow), 0 0 28px color-mix(in sRGB, var(--card-color) 70%, transparent);
      filter: brightness(1.1);
      transition: translate 0.18s ease, scale 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
      scale: 1.08;
      translate: 0 clamp(-55px, -10vh, -75px);
    }

    /* +3 pending: all non-breaker cards dim and go inert */
    &.plus-three-dim {
      opacity: 35%;
      filter: brightness(0.5) saturate(0.15);
      pointer-events: none;
      transition: opacity 0.2s ease, filter 0.2s ease, translate 0.2s ease, scale 0.2s ease;
      scale: 0.93;
      translate: 0 8px;

      &:hover {
        filter: brightness(0.7) saturate(0.3);
      }
    }

    /* +3 pending: breaker card lifted and glowing - pulsing glow to draw attention */
    &.plus-three-breaker {
      z-index: 300;
      filter: brightness(1.1);
      scale: 1.15;
      translate: 0 clamp(-70px, -13vh, -95px);
      animation: breaker-glow 1.1s ease-in-out infinite alternate;
    }

    /* Pre-selected card for auto-play on next turn */
    &.pending {
      z-index: 10;
      filter: brightness(1.05);
      translate: 0 -6px;
    }
  }

  @keyframes breaker-glow {
    from{ box-shadow: var(--card-hover-shadow), 0 0 18px color-mix(in sRGB, var(--card-color) 55%, transparent); }
    to{ box-shadow: var(--card-hover-shadow), 0 0 44px color-mix(in sRGB, var(--card-color) 92%, transparent); }
  }

  /* Playable ring indicator */
  .playable-ring {
    position: absolute;
    inset: -4px;
    border: 2px solid rgb(255 255 255 / 60%);
    border-radius: 15px;
    pointer-events: none;
    animation: ring-pulse 1.8s ease-in-out infinite;
  }

  @keyframes ring-pulse {
    0%,
 100%{ opacity: 30%; scale: 1; }
    50%{ opacity: 70%; scale: 1.02; }
  }

  .pending-ring {
    position: absolute;
    inset: -4px;
    border: 2px solid rgb(255 214 0 / 80%);
    border-radius: 15px;
    pointer-events: none;
    animation: pending-pulse 1.4s ease-in-out infinite;
  }

  @keyframes pending-pulse {
    0%,
 100%{ opacity: 50%; scale: 1; }
    50%{ opacity: 100%; box-shadow: 0 0 10px rgb(255 214 0 / 50%); scale: 1.03; }
  }

  /* Mobile-only: fixed badge above the hand showing color counts for playable wilds */
  .mobile-wild-hint {
    display: none;

    @media (hover: none) and (width <= 600px) {
      position: fixed;
      bottom: clamp(110px, 30vw, 150px);
      left: 44px;
      z-index: 200;
      display: flex;
      gap: 4px;
      padding: 5px 10px;
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 999px;
      background: rgb(8 10 28 / 88%);
      white-space: nowrap;
      backdrop-filter: blur(8px);
      pointer-events: none;
    }
  }

  .color-pip {
    display: flex;
    gap: 3px;
    align-items: center;
    padding: 3px 7px;
    border-radius: 100px;
    color: white;
    font-weight: 900;
    font-size: 0.7rem;

    &.pip-red{ background: #e8192c; }
    &.pip-blue{ background: #1565c0; }
    &.pip-green{ background: #2e7d32; }
    &.pip-yellow{ background: #ffd600; color: rgb(0 0 0 / 70%); }

    &.pip-zero {
      opacity: 30%;
      filter: saturate(0.2);
    }
  }

  .pip-letter {
    font-size: 0.6rem;
    line-height: 1;
    opacity: 75%;
  }
</style>
