<script lang="ts">
  import CardIcon from "$lib/components/cards/CardIcon.svelte";
  import type { DragState } from "$lib/components/hand/PlayerHand.svelte";
  import { type Card } from "$lib/network";
  import { getCardColorHex, getCardColorDark, isActionCard } from "$lib/utils/cards";

  interface Props {
    dragState: DragState;
    isDragReturning: boolean;
    ghostCard: Card;
    onMoveComplete?: () => void;
  }

  const {
    dragState, isDragReturning, ghostCard, onMoveComplete
  }: Props = $props();

  const ghostColorHex = $derived(getCardColorHex(ghostCard.color));
  const ghostColorDark = $derived(getCardColorDark(ghostCard.color));

  const ghostTransition = $derived(
    dragState.snapping
      ? "left 0.26s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.26s cubic-bezier(0.34, 1.56, 0.64, 1), rotate 0.26s, scale 0.26s"
      : "none"
  );

  const returnTransition = $derived(
    isDragReturning
      ? "left 0.26s ease-out, top 0.26s ease-out, rotate 0.2s ease-out, scale 0.2s ease-out"
      : "none"
  );

  const ghostRotate = $derived(
    (() => {
      if (isDragReturning || dragState.snapping) {
        return isDragReturning ? "0deg" : `${dragState.snapRotation}deg`;
      }

      return "-4deg";
    })()
  );

  const ghostScale = $derived((!isDragReturning && !dragState.snapping) ? "1.06" : "1");
</script>

<div
  style:--card-color={ghostColorHex}
  style:--card-dark={ghostColorDark}
  style:left="{dragState.left}px"
  style:top="{dragState.top}px"
  style:width="{dragState.cardW}px"
  style:height="{dragState.cardH}px"
  style:rotate={ghostRotate}
  style:scale={ghostScale}
  style:transition={dragState.snapping ? ghostTransition : returnTransition}
  class="card hand-card drag-ghost"
  class:action-card={isActionCard(ghostCard.value)}
  ontransitionend={e => e.propertyName === "left" && onMoveComplete?.()}
>
  <div class="card-inner">
    <div class="card-oval"></div>
    <CardIcon jokerPenalty={ghostCard.jokerPenalty} value={ghostCard.value} />
  </div>
</div>

<style>
  @import url("../../styles/card.css");

  .hand-card.drag-ghost {
    position: fixed;
    z-index: 1000;
    margin: 0;
    cursor: grabbing;
    pointer-events: none;
  }
</style>
