<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import type { Card, GamePlayer } from "$lib/network";
  import { CardValue } from "$lib/network";
  import { fade, scale } from "svelte/transition";

  const {
    pendingPlusThree,
    players,
    myId,
    hand,
    onaccept,
    onbreaker
  }: {
    pendingPlusThree: {
      fromId: string;
      waiting: string[];
    };
    players: GamePlayer[];
    myId: string;
    hand: Card[];
    onaccept: () => void;
    onbreaker: (cardId: number) => void;
  } = $props();

  const senderName = $derived(
    players.find(player => player.id === pendingPlusThree.fromId)?.name ?? ""
  );
  const breakerCard = $derived(
    hand.find(card => card.value === CardValue.PlusThreeBreaker)
  );
  const isSender = $derived(myId === pendingPlusThree.fromId);
  const isAlreadyResponded = $derived(!pendingPlusThree.waiting.includes(myId));
  const waitingNames = $derived(
    pendingPlusThree.waiting
      .map(id => players.find(player => player.id === id)?.name ?? id)
      .join(", ")
  );

  const waitingPrefix = $derived(locale.strings.waitingFor.before);
  const waitingSuffix = $derived(locale.strings.waitingFor.after);
</script>

{#if !isSender && !isAlreadyResponded}
  <div class="plus-three-overlay" in:fade={{ duration: 250 }}>
    <div
      class="plus-three-card" in:scale={{
        duration: 300,
        start: 0.85
      }}>
      <div class="plus-three-icon">+3</div>
      <h2 class="plus-three-title">{locale.strings.plusThreePlayed(senderName)}</h2>
      <div class="plus-three-actions">
        <button
          class="breaker-btn"
          disabled={!breakerCard}
          onclick={() => breakerCard && onbreaker(breakerCard.id)}
        >
          {locale.strings.playBlock}
          {#if !breakerCard}
            <span class="btn-sub">{locale.strings.youDontHave}</span>
          {/if}
        </button>
        <button class="accept-btn" onclick={onaccept}>
          {locale.strings.acceptDraw3}
        </button>
      </div>
    </div>
  </div>
{:else if isSender}
  <div class="plus-three-waiting-banner" in:fade={{ duration: 200 }}>
    <span>{locale.strings.waitingResponses(pendingPlusThree.waiting.length)}</span>
  </div>
{:else}
  <div class="plus-three-waiting-banner" in:fade={{ duration: 200 }}>
    <span>{waitingPrefix}<span dir="auto">{waitingNames}</span>{waitingSuffix}</span>
  </div>
{/if}

<style>
  .plus-three-overlay {
    position: fixed;
    inset: 0;
    z-index: 1800;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgb(0 0 0 / 88%);
    backdrop-filter: blur(12px);
  }

  .plus-three-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
    max-width: 90vw;
    padding: clamp(1.5rem, 5vw, 2.5rem) clamp(1.5rem, 6vw, 3rem);
    border: 1px solid var(--picker-card-border);
    border-radius: 2rem;
    background: var(--picker-card-bg);
    text-align: center;
    box-shadow: 0 40px 80px rgb(0 0 0 / 50%);
  }

  .plus-three-icon {
    background: linear-gradient(135deg, #e8192c, #c0101f);
    background-clip: text;
    background-clip: text;
    font-family: Impact, "Arial Black", sans-serif;
    font-weight: 900;
    font-size: clamp(2.5rem, 8vw, 4rem);
    line-height: 1;
    -webkit-text-fill-color: transparent;
  }

  .plus-three-title {
    margin: 0;
    color: var(--picker-title-color);
    font-weight: 900;
    font-size: clamp(1.1rem, 3.5vw, 1.5rem);
  }

  .plus-three-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  .breaker-btn {
    display: flex;
    gap: 0.4rem;
    justify-content: center;
    align-items: center;
    padding: 0.9rem 1.5rem;
    border: none;
    border-radius: 1rem;
    background: linear-gradient(135deg, #1565c0, #0d3d7a);
    color: white;
    font-weight: 800;
    font-size: clamp(0.9rem, 2.5vw, 1rem);
    box-shadow: 0 8px 20px rgb(21 101 192 / 40%);
    cursor: pointer;
    transition:
      translate 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275),
      scale 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275),
      box-shadow 0.2s;

    &:hover:not(:disabled) {
      scale: 1.02;
      translate: 0 -2px;
    }

    &:disabled {
      border: 2px solid var(--badge-border);
      background: var(--badge-bg);
      color: var(--text);
      opacity: 55%;
      box-shadow: none;
      cursor: not-allowed;
    }
  }

  .btn-sub {
    font-weight: 400;
    font-size: 0.8em;
    opacity: 80%;
  }

  .accept-btn {
    padding: 0.9rem 1.5rem;
    border: none;
    border-radius: 1rem;
    background: linear-gradient(135deg, #e8192c, #c0101f);
    color: white;
    font-weight: 800;
    font-size: clamp(0.9rem, 2.5vw, 1rem);
    box-shadow: 0 8px 20px rgb(232 25 44 / 40%);
    cursor: pointer;
    transition:
      translate 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275),
      scale 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275),
      box-shadow 0.2s;

    &:hover {
      scale: 1.02;
      translate: 0 -2px;
    }
  }

  .plus-three-waiting-banner {
    position: fixed;
    bottom: 1rem;
    left: 0;
    z-index: 500;
    padding: 0.6rem 1.2rem;
    border-radius: 2rem;
    background: rgb(0 0 0 / 75%);
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
    backdrop-filter: blur(8px);
    translate: calc(50vw - 50%);
  }
</style>
