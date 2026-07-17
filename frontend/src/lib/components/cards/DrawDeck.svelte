<script lang="ts">
  import TakiLogo from "$lib/components/TakiLogo.svg?raw";
  import { locale } from "$lib/locale.svelte";
  import { CardValue, type GameState, type Card } from "$lib/network";
  import { scale } from "svelte/transition";

  interface Props {
    gameRoomState: GameState;
    hand: Card[];
    myId: string;
    isPlusThreeRecipient: boolean;
    isPlusThreeBreakerAvailable: boolean;
    canPlayCard: (card: Card) => boolean;
    onDrawCard: () => void;
  }

  const {
    gameRoomState,
    hand,
    myId,
    isPlusThreeRecipient,
    isPlusThreeBreakerAvailable,
    canPlayCard,
    onDrawCard
  }: Props = $props();

  const isMyTurn = $derived(
    gameRoomState.players[gameRoomState.iCurrentPlayer].id === myId
  );

  const isPlusThreeDrawRequired = $derived(
    isPlusThreeRecipient && !isPlusThreeBreakerAvailable
  );

  const isDeckDisabled = $derived(
    gameRoomState.pendingPlusThree ? !isPlusThreeDrawRequired : !isMyTurn
  );

  const isPlusTwoBadgeOnDeck = $derived(
    gameRoomState.plusTwoValue > 0 && isMyTurn
  );

  const isPlusFourBadgeOnDeck = $derived(
    gameRoomState.plusFourValue > 0 && isMyTurn
  );

  const hasPlusFourToStack = $derived(
    isPlusFourBadgeOnDeck && hand.some(card => card.value === CardValue.PlusFour && canPlayCard(card))
  );

  const isDeckHighlight = $derived(
    (isMyTurn && !gameRoomState.pendingPlusThree && hand.every(card => !canPlayCard(card)))
    || isPlusThreeDrawRequired
    || (isPlusFourBadgeOnDeck && !hasPlusFourToStack)
  );

  const isDeckHighlightOptional = $derived(
    (isPlusThreeRecipient && isPlusThreeBreakerAvailable)
    || hasPlusFourToStack
  );

  const drawCardAriaLabel = $derived.by(() => {
    if (isPlusTwoBadgeOnDeck) {
      return locale.strings.drawCardWithPenalty(gameRoomState.plusTwoValue);
    }

    if (isPlusFourBadgeOnDeck) {
      return locale.strings.drawCardWithPenalty(gameRoomState.plusFourValue);
    }

    return locale.strings.drawCard;
  });
</script>

<div class="deck-container">
  <button
    class="deck"
    class:deck-disabled={isDeckDisabled}
    class:deck-highlight={isDeckHighlight}
    class:deck-highlight-optional={isDeckHighlightOptional}
    aria-label={drawCardAriaLabel}
    onclick={onDrawCard}
    ondragover={e => e.preventDefault()}
  >
    <div class="draw-btn-wrapper">
      <div class="card draw-btn">
        <div class="card-inner card-back-inner">
          <div class="card-back-oval"></div>
          <div class="deck-logo">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html TakiLogo}
          </div>
        </div>
      </div>
      <!-- +2 stack badge - only shown to the player who must draw -->
      {#if isPlusTwoBadgeOnDeck}
        <div class="plus-two-badge" dir="ltr" in:scale={{ duration: 250 }}>
          +{gameRoomState.plusTwoValue}
        </div>
      {/if}
      <!-- +3 badge - shown to all recipients until they respond -->
      {#if isPlusThreeRecipient}
        <div class="plus-three-badge" dir="ltr" in:scale={{ duration: 250 }}>+3</div>
      {/if}
      <!-- +4 stack badge - shown when current player must respond to a +4 chain -->
      {#if isPlusFourBadgeOnDeck}
        <div class="plus-four-badge" dir="ltr" in:scale={{ duration: 250 }}>
          +{gameRoomState.plusFourValue}
        </div>
      {/if}
    </div>
  </button>
</div>

<style>
  @import url("../../styles/card.css");

  .deck-container {
    position: relative;
    z-index: 15;
  }

  .deck {
    display: block;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;

    &:hover .draw-btn-wrapper {
      scale: 1.03;
      translate: 0 -6px;
    }

    &:hover .draw-btn {
      box-shadow: var(--card-hover-shadow), 0 0 20px rgb(21 101 192 / 30%);
    }

    &.deck-disabled {
      cursor: default;
      pointer-events: none;
    }

    /* Deck highlight (draw required after +2 or forced +3 draw) */
    &.deck-highlight .draw-btn {
      box-shadow: 0 0 0 3px #4caf50, 0 0 22px 6px rgb(76 175 80 / 55%);
      animation: deck-pulse 0.9s ease-in-out infinite alternate;
    }

    /* +3 recipient with a breaker available — softer amber glow to indicate optional draw */
    &.deck-highlight-optional .draw-btn {
      box-shadow: 0 0 0 3px #f59e0b, 0 0 22px 6px rgb(245 158 11 / 45%);
      animation: deck-pulse-optional 0.9s ease-in-out infinite alternate;
    }
  }

  .plus-two-badge,
  .plus-three-badge {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 20;
    padding: 0.2rem 0.55rem;
    border: 2px solid rgb(255 255 255 / 30%);
    border-radius: 2rem;
    color: white;
    font-weight: 900;
    font-size: 0.85rem;
    translate: 12px -12px;
    animation: badge-pulse 1s ease-in-out infinite alternate;
  }

  .plus-two-badge {
    background: linear-gradient(135deg, #e8192c, #c0101f);
    box-shadow: 0 4px 12px rgb(232 25 44 / 50%);
  }

  .plus-three-badge {
    background: linear-gradient(135deg, #9333ea, #6b21a8);
    box-shadow: 0 4px 12px rgb(147 51 234 / 50%);
  }

  .plus-four-badge {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 20;
    padding: 0.2rem 0.55rem;
    border: 2px solid rgb(255 255 255 / 30%);
    border-radius: 2rem;
    background: linear-gradient(135deg, #d97706, #92400e);
    color: white;
    font-weight: 900;
    font-size: 0.85rem;
    box-shadow: 0 4px 12px rgb(217 119 6 / 50%);
    translate: 12px -12px;
    animation: badge-pulse 1s ease-in-out infinite alternate;
  }

  @keyframes badge-pulse {
    from{ scale: 1; }
    to{ scale: 1.12; }
  }

  /* Draw button wrapper - lifts both the card and badge together on hover */
  .draw-btn-wrapper {
    position: relative;
    transition:
      translate 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
      scale 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  /* Draw button card */
  .draw-btn {
    cursor: pointer;
    transition: box-shadow 0.25s;
  }

  .deck-logo {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80%;

    :global(.taki-logo-svg) {
      width: 100%;
      height: auto;
    }
  }

  @keyframes deck-pulse {
    from{ box-shadow: 0 0 0 3px #4caf50, 0 0 16px 4px rgb(76 175 80 / 45%); }
    to{ box-shadow: 0 0 0 3px #81c784, 0 0 28px 10px rgb(76 175 80 / 70%); }
  }

  @keyframes deck-pulse-optional {
    from{ box-shadow: 0 0 0 3px #f59e0b, 0 0 16px 4px rgb(245 158 11 / 35%); }
    to{ box-shadow: 0 0 0 3px #fcd34d, 0 0 28px 10px rgb(245 158 11 / 55%); }
  }
</style>
