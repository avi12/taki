<script lang="ts">
  import DiscardPile from "$lib/components/cards/DiscardPile.svelte";
  import DrawDeck from "$lib/components/cards/DrawDeck.svelte";
  import DirectionIndicator from "$lib/components/game/DirectionIndicator.svelte";
  import TakiBanner from "$lib/components/game/TakiBanner.svelte";
  import { CardValue, type GameState, type Card } from "$lib/network";
  import { getCardColorHex } from "$lib/utils/cards";

  interface Props {
    gameRoomState: GameState;
    myId: string;
    isPlusThreeRecipient: boolean;
    isPlusThreeBreakerAvailable: boolean;
    isDraggingOver: boolean;
    arrowAnimKey: number;
    cardEffectValue: CardValue | null;
    isSuperTakiAnimating: boolean;
    hand: Card[];
    isMyTurnNow: boolean;
    canPlayCard: (card: Card) => boolean;
    onDrawCard: () => void;
    onDragOver: () => void;
    onDragLeave: () => void;
    onEffectEnd: () => void;
    onSuperTakiEffectEnd: () => void;
    onCloseTaki: () => void;
  }

  let {
    gameRoomState,
    myId,
    isPlusThreeRecipient,
    isPlusThreeBreakerAvailable,
    isDraggingOver,
    arrowAnimKey,
    cardEffectValue,
    isSuperTakiAnimating,
    hand,
    isMyTurnNow,
    canPlayCard,
    onDrawCard,
    onDragOver,
    onDragLeave,
    onEffectEnd,
    onSuperTakiEffectEnd,
    onCloseTaki,
    elDiscardPile = $bindable<HTMLElement | null>(null)
  }: Props & { elDiscardPile?: HTMLElement | null } = $props();

  const takiHex = $derived(
    gameRoomState.activeTakiColor ? getCardColorHex(gameRoomState.activeTakiColor) : ""
  );
</script>

<div class="center-area">
  {#if gameRoomState.activeTakiColor}
    <div class="taki-banner-overlay">
      <TakiBanner isMyTurn={isMyTurnNow} {onCloseTaki} takiColor={takiHex} />
    </div>
  {/if}

  <DirectionIndicator {arrowAnimKey} direction={gameRoomState.direction} />

  <DrawDeck
    {canPlayCard}
    {gameRoomState}
    {hand}
    {isPlusThreeBreakerAvailable}
    {isPlusThreeRecipient}
    {myId}
    {onDrawCard}
  />

  <DiscardPile
    {cardEffectValue}
    {gameRoomState}
    {isDraggingOver}
    {isSuperTakiAnimating}
    {onDragLeave}
    {onDragOver}
    {onEffectEnd}
    {onSuperTakiEffectEnd}
    bind:elPile={elDiscardPile}
  />
</div>

<style>
  .center-area {
    position: relative;
    z-index: 10;
    display: flex;
    flex: 1;
    gap: clamp(3rem, 10vw, 6rem);
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    padding: 1rem;

    @media (width <= 600px) {
      padding: 2rem 1rem;
    }
  }

  .taki-banner-overlay {
    position: absolute;
    top: 0.75rem;
    left: 50%;
    z-index: 30;
    pointer-events: auto;
    translate: -50% 0;
  }
</style>
